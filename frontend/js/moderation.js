/**
 * @fileoverview Modération des images avant publication ou envoi en message :
 * détection de nudité NudeNet v3 (voir vendor/nudity-guard.js) et détection de
 * doigt d'honneur via MediaPipe Hands (voir vendor/gesture-guard.js).
 * Tout s'exécute dans le navigateur.
 *
 * L'image n'est JAMAIS modifiée : l'analyse sert uniquement à signaler la
 * publication pour qu'un modérateur l'examine (voir createPost dans api.js).
 */

const NUDITY_GUARD_URL = 'js/vendor/nudity-guard.js';
const GESTURE_GUARD_URL = 'js/vendor/gesture-guard.js';
// Version épinglée : sans numéro, jsDelivr sert la dernière version publiée, qui
// peut changer sans prévenir et casser l'analyse. MediaPipe charge ses propres
// assets (wasm, modèle) depuis ce même dossier. C'est la seule dépendance encore
// servie par un CDN : le détecteur de nudité, lui, est hébergé par le site.
const MEDIAPIPE_HANDS_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/';
const MEDIAPIPE_HANDS_URL = MEDIAPIPE_HANDS_BASE + 'hands.js';
// Marge ajoutée autour d'une main censurée, en pixels (repris de SAE_5.04).
const GESTURE_BOX_MARGIN = 30;
// Le détecteur ramène de toute façon l'image à 320 px ; une photo de smartphone
// en pleine résolution coûterait cher à redessiner pour rien.
const MAX_IMAGE_SIDE = 1600;
// Délai au-delà duquel on considère l'analyse perdue. MediaPipe s'appuie sur
// WebGL, et un contexte perdu (GPU saturé, mise en veille, pilote qui redémarre)
// laisse l'attente en suspens : sans ce garde-fou, l'interface reste bloquée sur
// « Analyse en cours » pour toujours.
const ANALYSIS_TIMEOUT_MS = 30000;

let readyPromise = null;
// Deux inférences simultanées se disputent le processeur : on les enchaîne.
let analysisQueue = Promise.resolve();
// Instance MediaPipe Hands, réutilisée d'une image à l'autre (son chargement
// coûte plusieurs Mo, on ne la recrée pas à chaque upload).
let handsSolution = null;
// Passe à false quand MediaPipe ne peut pas fonctionner (pas de WebGL, GPU
// indisponible) : la nudité, elle, est analysée sur le processeur et continue.
let gestureDetectionAvailable = true;
// Levé par l'alerte WebGL de MediaPipe (voir interceptMediaPipeAlert).
let gestureContextLost = false;
let alertIntercepted = false;

/**
 * Charge un script classique (non module).
 * @param {string} src URL du script.
 * @return {Promise<void>}
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Chargement impossible : ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Vérifie que le navigateur sait créer un contexte WebGL.
 *
 * MediaPipe en crée un au démarrage de son graphe et, s'il échoue, affiche
 * lui-même une fenêtre d'alerte bloquante (« Failed to create WebGL canvas
 * context when passing video frame. »). On teste donc avant de le charger.
 *
 * @return {boolean} true si WebGL est utilisable.
 */
function hasWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;
    // Le contexte de test est rendu tout de suite : le navigateur n'en autorise
    // qu'une quinzaine par page, il ne faut pas en gaspiller un.
    const loseContext = gl.getExtension('WEBGL_lose_context');
    if (loseContext) loseContext.loseContext();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Intercepte l'alerte WebGL que MediaPipe déclenche en dur, une fois pour toutes.
 *
 * La bibliothèque appelle alert() quand elle n'obtient pas de contexte WebGL,
 * depuis sa propre file d'attente interne : l'alerte peut donc survenir APRÈS
 * l'appel qu'on a lancé, hors de portée d'un try/finally. On remplace donc
 * window.alert pour toute la session, en ne détournant que ce message précis —
 * les autres alertes de l'application passent normalement.
 *
 * L'échec est enregistré dans `gestureContextLost`, traité au prochain passage
 * dans detectGesturesOrDisable (fermer MediaPipe depuis son propre code serait
 * hasardeux).
 */
function interceptMediaPipeAlert() {
  if (alertIntercepted) return;
  alertIntercepted = true;
  const originalAlert = window.alert;
  window.alert = function (message) {
    if (typeof message === 'string' && message.includes('WebGL')) {
      console.warn('MediaPipe :', message);
      gestureContextLost = true;
      return undefined;
    }
    return originalAlert.call(window, message);
  };
}

/**
 * Instancie MediaPipe Hands une seule fois.
 * @return {Promise<void>}
 */

async function initHandsSolution() {
  if (handsSolution) return;
  interceptMediaPipeAlert();
  const hands = new window.Hands({
    locateFile: (file) => MEDIAPIPE_HANDS_BASE + file,
  });
  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  await hands.initialize();
  handsSolution = hands;
}

/**
 * Coupe la détection de gestes pour la session, sans bloquer la modération :
 * la nudité continue d'être analysée (elle tourne sur le processeur).
 * @param {Error} error Cause de l'indisponibilité.
 */
function disableGestureDetection(error) {
  console.warn(
    "Détection des doigts d'honneur indisponible (WebGL) — la détection de " +
    'nudité reste active :', error,
  );
  gestureDetectionAvailable = false;
  if (handsSolution) {
    try {
      handsSolution.close();
    } catch (closeError) {
      console.warn('Fermeture de MediaPipe impossible :', closeError);
    }
  }
  handsSolution = null;
}

/**
 * Fait tourner MediaPipe une fois à vide : sa première inférence réelle initialise
 * son contexte graphique et coûtait à elle seule ~4 s sur la première image.
 * @return {Promise<void>}
 */
async function warmUpHandsSolution() {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 320;
  canvas.getContext('2d').fillRect(0, 0, canvas.width, canvas.height);
  await detectMiddleFingerBoxes(canvas);
}

/**
 * Charge le détecteur de nudité et MediaPipe Hands une seule fois.
 *
 * Seule l'indisponibilité du détecteur de nudité est bloquante. Si MediaPipe ne
 * peut pas démarrer (WebGL absent), on continue sans lui plutôt que d'interdire
 * tout envoi d'image (voir disableGestureDetection).
 *
 * @return {Promise<void>} Rejetée si la détection de nudité est indisponible.
 */
export function preloadModeration() {
  if (!readyPromise) {
    readyPromise = (async () => {
      // Recharger nudity-guard.js redéclarerait ses `const` globales (SyntaxError).
      if (!window.initNudeNetModel) await loadScript(NUDITY_GUARD_URL);
      if (!window.nudeNetReady) await window.initNudeNetModel();
      if (!window.nudeNetReady) throw new Error('Modèle NudeNet indisponible');
      await window.warmUpNudeNetModel();

      try {
        if (!hasWebGLSupport()) throw new Error('WebGL indisponible');
        if (!window.isMiddleFingerGesture) await loadScript(GESTURE_GUARD_URL);
        if (!window.Hands) await loadScript(MEDIAPIPE_HANDS_URL);
        await initHandsSolution();
        await warmUpHandsSolution();
      } catch (error) {
        disableGestureDetection(error);
      }
    })();
    readyPromise.catch(() => {
      readyPromise = null;
    });
  }
  return readyPromise;
}

/**
 * Analyse une image (nudité + doigt d'honneur) sans la modifier.
 * @param {File} file Image choisie par l'utilisateur.
 * @return {Promise<{file: File, detections: Array<Object>,
 *     gestureDetectionAvailable: boolean}>} Le fichier d'origine, inchangé, et
 *     les zones repérées. `gestureDetectionAvailable` vaut false si seule la
 *     nudité a pu être analysée.
 */
export function moderateImageFile(file) {
  const run = analysisQueue.then(() => analyzeImage(file));
  analysisQueue = run.catch(() => {});
  return run;
}

/**
 * Abandonne une promesse qui ne se termine pas (voir ANALYSIS_TIMEOUT_MS).
 * @param {Promise<T>} promise Promesse à surveiller.
 * @param {string} label Nom de l'étape, pour le message d'erreur.
 * @return {Promise<T>}
 * @template T
 */
function withTimeout(promise, label) {
  let timer;
  const expiration = new Promise((resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} : délai dépassé`)),
      ANALYSIS_TIMEOUT_MS,
    );
  });
  return Promise.race([promise, expiration]).finally(() => clearTimeout(timer));
}

/**
 * Repère les doigts d'honneur présents sur une image fixe.
 *
 * @param {HTMLCanvasElement} canvas Image à analyser.
 * @return {Promise<Array<Object>>} Zones repérées, au même format que celles
 *     renvoyées par analyzeImageForNudity().
 */
async function detectMiddleFingerBoxes(canvas) {
  let results = null;
  handsSolution.onResults((r) => {
    results = r;
  });
  // Surtout PAS de handsSolution.reset() ici : il démonte le graphe, donc
  // MediaPipe recrée un canvas et un contexte WebGL à l'image suivante. Le
  // navigateur n'en autorise qu'une quinzaine par page : au bout de quelques
  // photos, la création échouait (« Failed to create WebGL canvas context »).
  // Vérifié : sans reset, aucun report d'une image à l'autre (photo à deux mains
  // puis photo sans main → 0 main détectée), et c'est 6x plus rapide.
  await handsSolution.send({image: canvas});

  // Sans contexte WebGL, MediaPipe abandonne son graphe sans lever d'erreur :
  // le rappel onResults n'est jamais appelé. Un tableau vide ici voudrait dire
  // « aucun geste détecté », ce qui serait faux.
  if (!results) {
    throw new Error("MediaPipe n'a produit aucun résultat");
  }

  const mains = results.multiHandLandmarks || [];
  return mains
    .filter((landmarks) => window.isMiddleFingerGesture(landmarks))
    .map((landmarks) => ({
      // Pas de mirrorLandmarks() ici, contrairement à SAE_5.04 : une image
      // uploadée n'est pas en miroir, alors que l'aperçu webcam l'était.
      ...window.boundingBoxOf(
        landmarks,
        canvas.width,
        canvas.height,
        GESTURE_BOX_MARGIN,
        GESTURE_BOX_MARGIN,
      ),
      label: "doigt d'honneur",
      score: 1,
    }));
}

/**
 * @param {File} file Image à analyser.
 * @return {Promise<{file: File, detections: Array<Object>,
 *     gestureDetectionAvailable: boolean}>}
 */
async function analyzeImage(file) {
  try {
    await preloadModeration();
  } catch (error) {
    console.error('Modération indisponible :', error);
    throw new Error(
      "L'analyse de l'image est indisponible : envoi bloqué. Réessayez.",
    );
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (error) {
    throw new Error("Impossible de lire cette image (format non pris en charge).");
  }

  const scale = Math.min(
    1,
    MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Les deux détecteurs redimensionnent l'image en interne et l'acceptent donc
  // telle quelle. Ils tournent l'un après l'autre : lancés en parallèle, ils se
  // disputeraient la machine (constat déjà fait sur SAE_5.04).
  let zonesNudite;
  try {
    zonesNudite = await withTimeout(
      window.analyzeImageForNudity(canvas),
      'Analyse de nudité',
    );
  } catch (error) {
    console.error('Analyse de modération échouée :', error);
    throw new Error("L'analyse de l'image a échoué : envoi bloqué. Réessayez.");
  }
  const zonesGeste = await detectGesturesOrDisable(canvas);
  const detections = [...zonesNudite, ...zonesGeste];

  console.log('Modération image —', {
    fichier: file.name,
    taille: `${canvas.width}x${canvas.height}`,
    nudite: zonesNudite.length,
    doigtDHonneur: gestureDetectionAvailable ? zonesGeste.length : 'indisponible',
    zones: detections.map((d) => ({label: d.label, score: d.score.toFixed(2)})),
  });

  // L'image est renvoyée telle quelle : c'est la publication qui sera signalée
  // et masquée aux autres utilisateurs, pas le média qui est retouché.
  return {file, detections, gestureDetectionAvailable};
}

/**
 * Cherche les doigts d'honneur. En cas d'échec MediaPipe (contexte WebGL perdu),
 * réessaie une fois avec une instance neuve, puis abandonne la détection de
 * gestes pour la session : mieux vaut une modération partielle, qui repère
 * toujours la nudité, qu'un envoi d'images impossible.
 *
 * @param {HTMLCanvasElement} canvas Image à analyser.
 * @return {Promise<Array<Object>>} Zones repérées (vide si indisponible).
 */
async function detectGesturesOrDisable(canvas) {
  if (!gestureDetectionAvailable || !handsSolution) return [];

  // Contexte WebGL perdu signalé par l'alerte de MediaPipe : inutile d'insister.
  if (gestureContextLost) {
    disableGestureDetection(new Error('Contexte WebGL perdu (alerte MediaPipe)'));
    return [];
  }

  try {
    return await withTimeout(detectMiddleFingerBoxes(canvas), 'Analyse des gestes');
  } catch (error) {
    console.warn('MediaPipe a échoué, nouvelle tentative :', error);
  }

  try {
    handsSolution.close();
  } catch (closeError) {
    console.warn('Fermeture de MediaPipe impossible :', closeError);
  }
  handsSolution = null;

  try {
    await initHandsSolution();
    if (gestureContextLost) throw new Error('Contexte WebGL indisponible');
    return await withTimeout(detectMiddleFingerBoxes(canvas), 'Analyse des gestes');
  } catch (error) {
    disableGestureDetection(error);
    return [];
  }
}
