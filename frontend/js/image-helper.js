/**
 * @fileoverview Utilitaire de compression et normalisation d'images côté client.
 * Évite les saturations réseau et de base de données.
 */

/**
 * Compresse et redimensionne une image via Canvas.
 * @param {File} file Fichier image issu d'un input type="file".
 * @param {number} maxWidth Largeur maximale en pixels.
 * @param {number} maxHeight Hauteur maximale en pixels.
 * @param {number} [quality=0.8] Qualité de compression JPEG (0.1 à 1.0).
 * @return {Promise<string>} Données de l'image au format Data URL (Base64).
 */
export function compressImage(file, maxWidth, maxHeight, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Le fichier sélectionné n\'est pas une image valide.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let { width, height } = img;

        // Calcul des dimensions en conservant le ratio d'aspect
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Sortie standardisée en image/jpeg compressée
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Impossible de charger l\'image.'));
    };

    reader.onerror = () => reject(new Error('Erreur de lecture du fichier.'));
  });
}

/**
 * Préréglage pour photo de profil (Avatar rond/carré, max 300x300 px, ~30 Ko).
 * @param {File} file Fichier image brut.
 * @return {Promise<string>} Chaîne DataURL Base64 optimisée.
 */
export function optimizeAvatar(file) {
  return compressImage(file, 300, 300, 0.8);
}

/**
 * Préréglage pour publication du fil (Post, max 1080x1080 px, ~150 Ko).
 * @param {File} file Fichier image brut.
 * @return {Promise<string>} Chaîne DataURL Base64 optimisée.
 */
export function optimizePostImage(file) {
  return compressImage(file, 1080, 1080, 0.82);
}