/**
 * nudity-guard.js — Détection de nudité (NudeNet v3) + pixellisation, à la demande.
 * Ce fichier ne fait QUE définir des fonctions. initNudeNetModel() doit être appelé
 * avant la première analyse (voir js/moderation.js).
 *
 * Détection par vrai détecteur d'objets plutôt que par heuristique de couleur :
 * un modèle entraîné distingue correctement un mur ou un t-shirt d'une vraie
 * zone de nudité, ce qu'une simple plage de couleur ne peut pas garantir.
 *
 * Modèle : NudeNet v3 « 320n » (notAI-tech/NudeNet), YOLOv8 nano exporté en ONNX,
 * exécuté par onnxruntime-web sur le PROCESSEUR (WebAssembly + SIMD).
 * Les deux fichiers sont servis par le site (models/ et js/vendor/ort/), donc la
 * modération fonctionne hors ligne, sans CDN.
 *
 * Il a remplacé la version précédente (NudeNet v2 converti pour TensorFlow.js) :
 *   - 12 Mo au lieu de 72 Mo, et 13 ms par image au lieu de 3,4 s (mesuré) ;
 *   - pas de WebGL, donc plus de perte de contexte GPU ni de recompilation de
 *     shaders à chaque nouvelle taille d'image (l'entrée est toujours 320x320).
 * ⚠ Licence : ce modèle est sous AGPL-3.0 (voir models/NUDENET-LICENSE-AGPL-3.0.md),
 * contrairement au reste du projet.
 */

const ORT_SCRIPT_URL = 'js/vendor/ort/ort.min.js';
const ORT_WASM_DIR = 'js/vendor/ort/';
const NUDENET_MODEL_URL = 'models/nudenet-320n.onnx';
// Le modèle attend une image carrée de 320x320 (entrée fixe).
const NUDENET_INPUT_SIZE = 320;
// Ordre des classes du modèle : il vient de l'implémentation de référence
// (nudenet/nudenet.py) et ne doit pas être réordonné.
const NUDENET_LABELS = [
  'FEMALE_GENITALIA_COVERED',
  'FACE_FEMALE',
  'BUTTOCKS_EXPOSED',
  'FEMALE_BREAST_EXPOSED',
  'FEMALE_GENITALIA_EXPOSED',
  'MALE_BREAST_EXPOSED',
  'ANUS_EXPOSED',
  'FEET_EXPOSED',
  'BELLY_COVERED',
  'FEET_COVERED',
  'ARMPITS_COVERED',
  'ARMPITS_EXPOSED',
  'FACE_MALE',
  'BELLY_EXPOSED',
  'MALE_GENITALIA_EXPOSED',
  'ANUS_COVERED',
  'FEMALE_BREAST_COVERED',
  'BUTTOCKS_COVERED',
];
// Seules ces classes sont pixellisées : le modèle repère aussi les visages, les
// pieds, les aisselles et les parties couvertes (maillot, sous-vêtement), qui
// n'ont pas à être censurés. Même politique que la version précédente : on
// censure ce qui est dénudé, pas ce qui est habillé.
const NUDENET_CENSORED_LABELS = new Set([
  'ANUS_EXPOSED',
  'BELLY_EXPOSED',
  'BUTTOCKS_EXPOSED',
  'FEMALE_BREAST_EXPOSED',
  'FEMALE_GENITALIA_EXPOSED',
  'MALE_BREAST_EXPOSED',
  'MALE_GENITALIA_EXPOSED',
]);
// Seuil mesuré sur 22 photos : torses nus entre 0,52 et 0,77 ; sur les photos
// sans nudité, aucune classe censurée ne dépasse 0,32.
const NUDENET_MIN_SCORE = 0.4;
// Recouvrement au-delà duquel deux boîtes sont considérées comme la même zone.
const NUDENET_IOU_THRESHOLD = 0.45;
const NUDENET_BOX_PADDING = 12;

const PIXELATE_TILE_SIZE = 16;

var nudeNetSession = null;
var nudeNetReady = false;

/**
 * Charge un script classique (non module).
 * @param {string} src URL du script.
 * @returns {Promise<void>}
 */
function loadOrtScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Chargement impossible : ${src}`));
    document.head.appendChild(script);
  });
}

/** Charge onnxruntime-web puis le modèle NudeNet. */
async function initNudeNetModel() {
  if (nudeNetReady) return;
  try {
    if (!window.ort) await loadOrtScript(ORT_SCRIPT_URL);
    // Chemin ABSOLU : onnxruntime charge son module compagnon .mjs par import
    // dynamique, et un chemin relatif sans « ./ » n'est pas un spécificateur
    // de module valide (« Failed to resolve module specifier »).
    ort.env.wasm.wasmPaths = new URL(ORT_WASM_DIR, document.baseURI).href;
    // Sans en-têtes COOP/COEP, SharedArrayBuffer est indisponible : le multi-thread
    // échouerait. Un seul thread suffit largement (13 ms par image).
    ort.env.wasm.numThreads = 1;
    nudeNetSession = await ort.InferenceSession.create(NUDENET_MODEL_URL, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    nudeNetReady = true;
    console.log('Modèle NudeNet (détection de nudité par zones) chargé avec succès.');
  } catch (e) {
    console.error('Échec du chargement de NudeNet — le scan de nudité restera indisponible :', e);
  }
}

/**
 * Exécute une inférence à vide pour que la première analyse réelle soit rapide
 * (allocation des tampons WebAssembly). Sans conséquence sur le résultat.
 */
async function warmUpNudeNetModel() {
  const warmUpCanvas = document.createElement('canvas');
  warmUpCanvas.width = NUDENET_INPUT_SIZE;
  warmUpCanvas.height = NUDENET_INPUT_SIZE;
  warmUpCanvas.getContext('2d').fillRect(0, 0, NUDENET_INPUT_SIZE, NUDENET_INPUT_SIZE);

  await analyzeImageForNudity(warmUpCanvas);
  console.log('Modèle NudeNet préchauffé.');
}

/**
 * Prépare le tenseur d'entrée : l'image est complétée en carré (bandes noires en
 * bas et à droite), ramenée à 320x320, puis normalisée entre 0 et 1 au format
 * NCHW. C'est exactement le prétraitement de l'implémentation de référence ;
 * s'en écarter dégrade fortement les scores.
 *
 * @param {HTMLCanvasElement} sourceCanvas Image à analyser.
 * @returns {{tensor: Object, scale: number}} Tenseur et facteur pour revenir aux
 *   pixels de `sourceCanvas`.
 */
function buildNudeNetInput(sourceCanvas) {
  const side = Math.max(sourceCanvas.width, sourceCanvas.height);
  const square = document.createElement('canvas');
  square.width = NUDENET_INPUT_SIZE;
  square.height = NUDENET_INPUT_SIZE;
  const ctx = square.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, NUDENET_INPUT_SIZE, NUDENET_INPUT_SIZE);
  const ratio = NUDENET_INPUT_SIZE / side;
  ctx.drawImage(
    sourceCanvas, 0, 0,
    sourceCanvas.width * ratio, sourceCanvas.height * ratio
  );

  const { data } = ctx.getImageData(0, 0, NUDENET_INPUT_SIZE, NUDENET_INPUT_SIZE);
  const pixels = NUDENET_INPUT_SIZE * NUDENET_INPUT_SIZE;
  const chw = new Float32Array(pixels * 3);
  for (let i = 0; i < pixels; i++) {
    chw[i] = data[i * 4] / 255;
    chw[pixels + i] = data[i * 4 + 1] / 255;
    chw[2 * pixels + i] = data[i * 4 + 2] / 255;
  }

  return {
    tensor: new ort.Tensor('float32', chw, [1, 3, NUDENET_INPUT_SIZE, NUDENET_INPUT_SIZE]),
    scale: side / NUDENET_INPUT_SIZE,
  };
}

/**
 * Taux de recouvrement de deux boîtes (intersection sur union).
 * @param {Object} a Première boîte.
 * @param {Object} b Seconde boîte.
 * @returns {number} Valeur entre 0 et 1.
 */
function boxOverlap(a, b) {
  const width = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX));
  const height = Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY));
  const intersection = width * height;
  const union =
    (a.maxX - a.minX) * (a.maxY - a.minY) +
    (b.maxX - b.minX) * (b.maxY - b.minY) -
    intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Analyse UNE image et renvoie les zones à censurer.
 *
 * @param {HTMLCanvasElement} sourceCanvas Image à analyser.
 * @returns {Promise<Array<{minX:number, minY:number, maxX:number, maxY:number,
 *   label:string, score:number}>>} Zones détectées, en pixels de `sourceCanvas`.
 * @throws {Error} Si le modèle n'est pas chargé ou si l'inférence échoue : un
 *   tableau vide signifierait « image saine » et laisserait passer l'image.
 */
async function analyzeImageForNudity(sourceCanvas) {
  if (!nudeNetReady) {
    throw new Error('NudeNet pas encore chargé.');
  }

  const { tensor, scale } = buildNudeNetInput(sourceCanvas);
  let output;
  try {
    const results = await nudeNetSession.run({ images: tensor });
    output = results[nudeNetSession.outputNames[0]];
  } catch (e) {
    console.error('Analyse NudeNet échouée :', e);
    throw e;
  }

  // Sortie YOLOv8 : [1, 4 + nbClasses, nbBoîtes], une colonne par boîte candidate,
  // avec le centre, la largeur, la hauteur, puis un score par classe.
  const [, rowCount, boxCount] = output.dims;
  const values = output.data;
  const candidates = [];
  for (let box = 0; box < boxCount; box++) {
    let bestScore = 0;
    let bestClass = -1;
    for (let cls = 4; cls < rowCount; cls++) {
      const score = values[cls * boxCount + box];
      if (score > bestScore) {
        bestScore = score;
        bestClass = cls - 4;
      }
    }
    const label = NUDENET_LABELS[bestClass];
    if (bestScore < NUDENET_MIN_SCORE || !NUDENET_CENSORED_LABELS.has(label)) continue;

    const centerX = values[box] * scale;
    const centerY = values[boxCount + box] * scale;
    const width = values[2 * boxCount + box] * scale;
    const height = values[3 * boxCount + box] * scale;
    candidates.push({
      minX: Math.max(0, centerX - width / 2 - NUDENET_BOX_PADDING),
      maxX: Math.min(sourceCanvas.width, centerX + width / 2 + NUDENET_BOX_PADDING),
      minY: Math.max(0, centerY - height / 2 - NUDENET_BOX_PADDING),
      maxY: Math.min(sourceCanvas.height, centerY + height / 2 + NUDENET_BOX_PADDING),
      label,
      score: bestScore,
    });
  }

  // Suppression des doublons : le modèle propose plusieurs boîtes pour une même zone.
  candidates.sort((a, b) => b.score - a.score);
  const detections = [];
  candidates.forEach((candidate) => {
    const duplicate = detections.some(
      (kept) => boxOverlap(kept, candidate) > NUDENET_IOU_THRESHOLD
    );
    if (!duplicate) detections.push(candidate);
  });
  return detections;
}

/**
 * Inverse horizontalement des landmarks normalisés (x -> 1-x). MediaPipe analyse le
 * flux vidéo brut, alors que l'aperçu et la photo sont affichés en miroir : sans ça,
 * une main détectée à gauche serait censurée à droite.
 */
function mirrorLandmarks(landmarks) {
  return landmarks.map(pt => ({ x: 1 - pt.x, y: pt.y }));
}

/** Boîte englobante (en pixels, dans le repère de l'image source) d'un jeu de landmarks MediaPipe. */
function boundingBoxOf(landmarks, imgWidth, imgHeight, marginX, marginY) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  landmarks.forEach(pt => {
    const px = pt.x * imgWidth,
      py = pt.y * imgHeight;
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  });
  return {
    minX: Math.max(0, minX - marginX),
    maxX: Math.min(imgWidth, maxX + marginX),
    minY: Math.max(0, minY - marginY),
    maxY: Math.min(imgHeight, maxY + marginY),
  };
}

/**
 * Pixellise une boîte du canvas [ctx]. Ne relit les pixels que dans cette zone,
 * pas toute l'image. La taille des pixels s'adapte à la résolution de la photo :
 * une tuile fixe serait invisible (donc inefficace) sur une capture haute résolution.
 */
function pixelateBox(ctx, box) {
  const x0 = Math.max(0, Math.floor(box.minX)),
    y0 = Math.max(0, Math.floor(box.minY));
  const w = Math.min(ctx.canvas.width - x0, Math.ceil(box.maxX) - x0);
  const h = Math.min(ctx.canvas.height - y0, Math.ceil(box.maxY) - y0);
  if (w <= 0 || h <= 0) return;

  const tileSize = Math.max(
    PIXELATE_TILE_SIZE,
    Math.round(Math.min(ctx.canvas.width, ctx.canvas.height) / 30)
  );

  let imageData;
  try {
    imageData = ctx.getImageData(x0, y0, w, h);
  } catch (e) {
    console.error('pixelateBox : lecture des pixels impossible', e);
    return;
  }
  const data = imageData.data,
    stride = imageData.width;

  for (let ty = 0; ty < h; ty += tileSize) {
    for (let tx = 0; tx < w; tx += tileSize) {
      const px = Math.min(stride - 1, tx),
        py = Math.min(imageData.height - 1, ty);
      const idx = (py * stride + px) * 4;
      ctx.fillStyle = `rgb(${data[idx]},${data[idx + 1]},${data[idx + 2]})`;
      ctx.fillRect(x0 + tx, y0 + ty, tileSize + 0.5, tileSize + 0.5);
    }
  }
}
