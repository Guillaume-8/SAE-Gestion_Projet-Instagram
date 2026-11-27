/**
 * @fileoverview Moteur de filtres d'images appliqués côté client (Canvas).
 *
 * Adapté du module de Tanguy & Jonathan : les calculs de pixels sont
 * conservés tels quels, l'API est exposée en fonctions ES6 et le module ne
 * dépend plus du DOM (chaque fonction reçoit le canvas à traiter).
 *
 * Principe : les filtres sont « cuits » dans les pixels avant l'envoi, pour
 * que la publication conserve son rendu côté serveur.
 */

/**
 * Filtres disponibles, dans l'ordre d'affichage.
 * @const {Array<{id: string, label: string}>}
 */
export const FILTRES = [
  {id: 'original', label: 'Original'},
  {id: 'grayscale', label: 'Noir & blanc'},
  {id: 'sepia', label: 'Sépia'},
  {id: 'highContrast', label: 'Contraste'},
  {id: 'brightness', label: 'Luminosité'},
  {id: 'invert', label: 'Négatif'},
  {id: 'saturate', label: 'Saturation'},
  {id: 'warm', label: 'Chaud'},
];

/**
 * Limite une valeur entre 0 et 255.
 * @param {number} valeur Valeur à borner.
 * @return {number} Valeur bornée.
 */
function clamp(valeur) {
  return Math.max(0, Math.min(255, valeur));
}

/**
 * Applique un filtre à un tableau de pixels RGBA (modifié sur place).
 *
 * Chaque pixel occupe quatre cases consécutives : R, G, B, A. Les filtres
 * ne lisent que le pixel courant (aucun voisinage), ce qui les rend rapides
 * même sur une grande image.
 *
 * @param {Uint8ClampedArray} donnees Tableau de pixels RGBA.
 * @param {string} nom Identifiant du filtre (voir {@link FILTRES}).
 * @return {void}
 */
export function appliquerFiltreSurDonnees(donnees, nom) {
  switch (nom) {
    case 'grayscale':
      for (let i = 0; i < donnees.length; i += 4) {
        const moyenne = (donnees[i] + donnees[i + 1] + donnees[i + 2]) / 3;
        donnees[i] = donnees[i + 1] = donnees[i + 2] = moyenne;
      }
      break;

    case 'sepia':
      for (let i = 0; i < donnees.length; i += 4) {
        const r = donnees[i];
        const g = donnees[i + 1];
        const b = donnees[i + 2];
        donnees[i] = r * 0.393 + g * 0.769 + b * 0.189;
        donnees[i + 1] = r * 0.349 + g * 0.686 + b * 0.168;
        donnees[i + 2] = r * 0.272 + g * 0.534 + b * 0.131;
      }
      break;

    case 'highContrast': {
      const facteur = 1.3;
      for (let i = 0; i < donnees.length; i += 4) {
        donnees[i] = clamp((donnees[i] - 128) * facteur + 128);
        donnees[i + 1] = clamp((donnees[i + 1] - 128) * facteur + 128);
        donnees[i + 2] = clamp((donnees[i + 2] - 128) * facteur + 128);
      }
      break;
    }

    case 'brightness': {
      const montant = 40;
      for (let i = 0; i < donnees.length; i += 4) {
        donnees[i] = clamp(donnees[i] + montant);
        donnees[i + 1] = clamp(donnees[i + 1] + montant);
        donnees[i + 2] = clamp(donnees[i + 2] + montant);
      }
      break;
    }

    case 'invert':
      for (let i = 0; i < donnees.length; i += 4) {
        donnees[i] = 255 - donnees[i];
        donnees[i + 1] = 255 - donnees[i + 1];
        donnees[i + 2] = 255 - donnees[i + 2];
      }
      break;

    case 'saturate': {
      const facteur = 1.5;
      for (let i = 0; i < donnees.length; i += 4) {
        const moyenne = (donnees[i] + donnees[i + 1] + donnees[i + 2]) / 3;
        donnees[i] = clamp(moyenne + (donnees[i] - moyenne) * facteur);
        donnees[i + 1] = clamp(moyenne + (donnees[i + 1] - moyenne) * facteur);
        donnees[i + 2] = clamp(moyenne + (donnees[i + 2] - moyenne) * facteur);
      }
      break;
    }

    case 'warm':
      for (let i = 0; i < donnees.length; i += 4) {
        donnees[i] = clamp(donnees[i] + 25);
        donnees[i + 2] = clamp(donnees[i + 2] - 25);
      }
      break;

    default:
      break;
  }
}

/**
 * Dessine une version filtrée de l'image d'origine dans un canvas.
 *
 * Repart toujours de `origine` : deux filtres successifs ne se cumulent
 * donc jamais (sépia puis noir & blanc donne bien du noir & blanc).
 *
 * @param {HTMLCanvasElement} canvas Canvas cible (redimensionné si besoin).
 * @param {ImageData} origine Pixels de l'image d'origine.
 * @param {string} nom Identifiant du filtre.
 * @return {void}
 */
export function dessinerFiltre(canvas, origine, nom) {
  const ctx = canvas.getContext('2d');

  if (canvas.width !== origine.width || canvas.height !== origine.height) {
    canvas.width = origine.width;
    canvas.height = origine.height;
  }

  const travail = new ImageData(
    new Uint8ClampedArray(origine.data),
    origine.width,
    origine.height,
  );

  appliquerFiltreSurDonnees(travail.data, nom);
  ctx.putImageData(travail, 0, 0);
}

/**
 * Construit une vignette filtrée à partir de l'image d'origine.
 *
 * @param {ImageData} origine Pixels de l'image d'origine.
 * @param {string} nom Identifiant du filtre.
 * @param {number} cote Taille de la vignette (carré), en pixels.
 * @return {HTMLCanvasElement} Vignette prête à insérer dans le DOM.
 */
export function creerVignette(origine, nom, cote = 64) {
  const source = document.createElement('canvas');
  source.width = origine.width;
  source.height = origine.height;
  source.getContext('2d').putImageData(origine, 0, 0);

  // Recadrage carré centré, puis réduction : évite une vignette déformée.
  const marge = Math.min(source.width, source.height);
  const sx = (source.width - marge) / 2;
  const sy = (source.height - marge) / 2;

  const vignette = document.createElement('canvas');
  vignette.width = cote;
  vignette.height = cote;
  const ctx = vignette.getContext('2d');
  ctx.drawImage(source, sx, sy, marge, marge, 0, 0, cote, cote);

  if (nom !== 'original') {
    const pixels = ctx.getImageData(0, 0, cote, cote);
    appliquerFiltreSurDonnees(pixels.data, nom);
    ctx.putImageData(pixels, 0, 0);
  }

  return vignette;
}

/**
 * Exporte le contenu d'un canvas en blob JPEG.
 *
 * @param {HTMLCanvasElement} canvas Canvas à exporter.
 * @param {number} qualite Qualité JPEG entre 0 et 1.
 * @return {Promise<Blob>} Blob de l'image.
 */
export function exporterBlob(canvas, qualite = 0.88) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Export de l\'image impossible.'));
      }
    }, 'image/jpeg', qualite);
  });
}

/**
 * Charge un fichier image dans un canvas, en le redimensionnant.
 *
 * @param {File} fichier Fichier image.
 * @param {number} coteMax Dimension maximale (largeur ou hauteur).
 * @return {Promise<{canvas: HTMLCanvasElement, imageData: ImageData}>}
 *     Canvas redimensionné et pixels d'origine.
 */
export function chargerImage(fichier, coteMax = 1080) {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();

    lecteur.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    lecteur.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Ce fichier n\'est pas une image valide.'));
      image.onload = () => {
        const ratio = Math.min(1, coteMax / Math.max(image.width, image.height));
        const largeur = Math.max(1, Math.round(image.width * ratio));
        const hauteur = Math.max(1, Math.round(image.height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = largeur;
        canvas.height = hauteur;
        canvas.getContext('2d').drawImage(image, 0, 0, largeur, hauteur);

        resolve({
          canvas,
          imageData: canvas.getContext('2d')
            .getImageData(0, 0, largeur, hauteur),
        });
      };
      image.src = lecteur.result;
    };

    lecteur.readAsDataURL(fichier);
  });
}
