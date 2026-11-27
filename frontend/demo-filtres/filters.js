/**
 * @fileoverview Moteur de filtres d'images appliqués côté client via l'API Canvas.
 * Les filtres sont "cuits" dans les pixels avant publication, pour un résultat persistant.
 */

/** @type {HTMLInputElement} */
const input = document.getElementById('imageInput');
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

/**
 * Copie intacte des pixels d'origine, utilisée comme base pour chaque
 * nouveau filtre afin d'éviter tout cumul entre filtres successifs.
 * @type {ImageData|null}
 */
let originalImageData = null;

input.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  const reader = new FileReader();

  reader.onload = (event) => {
    img.src = event.target.result;
  };

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  reader.readAsDataURL(file);
});

/**
 * Limite une valeur entre 0 et 255.
 * @param {number} value
 * @returns {number}
 */
function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

/**
 * Applique un filtre sur les pixels actuellement affichés dans le canvas.
 *
 * @param {HTMLCanvasElement} canvas - Le canvas contenant l'image à filtrer.
 * @param {CanvasRenderingContext2D} ctx - Le contexte 2D du canvas.
 * @param {'grayscale'|'sepia'|'highContrast'|'brightness'|'invert'|'saturate'|'warm'} filterName
 * @returns {void}
 */
function applyFilter(canvas, ctx, filterName) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  switch (filterName) {
    case 'grayscale':
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
      }
      break;

    case 'sepia':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        data[i]     = r * 0.393 + g * 0.769 + b * 0.189;
        data[i + 1] = r * 0.349 + g * 0.686 + b * 0.168;
        data[i + 2] = r * 0.272 + g * 0.534 + b * 0.131;
      }
      break;

    case 'highContrast': {
      const factor = 1.3;
      for (let i = 0; i < data.length; i += 4) {
        data[i]     = clamp((data[i] - 128) * factor + 128);
        data[i + 1] = clamp((data[i + 1] - 128) * factor + 128);
        data[i + 2] = clamp((data[i + 2] - 128) * factor + 128);
      }
      break;
    }

    case 'brightness': {
      const amount = 40;
      for (let i = 0; i < data.length; i += 4) {
        data[i]     = clamp(data[i] + amount);
        data[i + 1] = clamp(data[i + 1] + amount);
        data[i + 2] = clamp(data[i + 2] + amount);
      }
      break;
    }

    case 'invert':
      for (let i = 0; i < data.length; i += 4) {
        data[i]     = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
      break;

    case 'saturate': {
      const factor = 1.5;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i]     = clamp(avg + (data[i] - avg) * factor);
        data[i + 1] = clamp(avg + (data[i + 1] - avg) * factor);
        data[i + 2] = clamp(avg + (data[i + 2] - avg) * factor);
      }
      break;
    }

    case 'warm':
      for (let i = 0; i < data.length; i += 4) {
        data[i]     = clamp(data[i] + 25);
        data[i + 2] = clamp(data[i + 2] - 25);
      }
      break;

    default:
      break;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Sélectionne un filtre à appliquer. Repart systématiquement d'une copie
 * de l'image d'origine pour éviter d'empiler plusieurs filtres.
 *
 * @param {string} filterName - Nom du filtre à appliquer (voir {@link applyFilter}).
 * @returns {void}
 */
function selectFilter(filterName) {
  if (!originalImageData) return;

  const workingData = new ImageData(
    new Uint8ClampedArray(originalImageData.data),
    canvas.width,
    canvas.height
  );
  ctx.putImageData(workingData, 0, 0);
  applyFilter(canvas, ctx, filterName);
}

/**
 * Réaffiche l'image dans son état d'origine, sans filtre.
 * @returns {void}
 */
function resetToOriginal() {
  if (!originalImageData) return;
  ctx.putImageData(originalImageData, 0, 0);
}

/**
 * Exporte l'état actuel du canvas (image + filtre appliqué) en blob JPEG
 * et l'envoie au serveur pour publication.
 * @returns {void}
 */
function publishImage() {
  canvas.toBlob((blob) => {
    const formData = new FormData();
    formData.append('image', blob, 'photo.jpg');

    fetch('/posts', {
      method: 'POST',
      body: formData
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Post publié :', data);
      })
      .catch((err) => {
        console.error('Erreur publication :', err);
      });
  }, 'image/jpeg', 0.9);
}