/**
 * @fileoverview Fallback visuel pour les médias locaux manquants.
 *
 * Les données mock pointent vers assets/images/posts/post-XX.jpg.
 * Tant que ces fichiers ne sont pas fournis, ce module masque le
 * média en erreur et marque son parent avec la classe "media-missing"
 * (dégradé de remplacement défini dans style.css).
 */

/**
 * Attache un écouteur d'erreur sur chaque média (img/video) contenu
 * dans l'élément racine. En cas d'échec de chargement, le média est
 * masqué et son parent direct reçoit la classe "media-missing".
 * @param {HTMLElement} root Élément racine dans lequel chercher.
 */
export function attachMediaFallback(root) {
  if (!root) return;
  root.querySelectorAll('img, video').forEach((media) => {
    media.addEventListener('error', () => {
      media.style.display = 'none';
      const parent = media.parentElement;
      if (parent) parent.classList.add('media-missing');
    });
  });
}
