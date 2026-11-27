/**
 * @fileoverview Fallback visuel pour les médias manquants ou introuvables.
 *
 * Deux cas produisent une image cassée :
 *   - les données de démonstration pointent vers un fichier absent de
 *     assets/images/posts/ ;
 *   - une publication en base référence un fichier absent de
 *     backend-api/uploads/ (ou la règle Apache /api/users/media manque).
 *
 * Dans les deux cas, on masque le média fautif, on marque son parent avec
 * la classe "media-missing" et on insère un repère lisible, pour ne jamais
 * laisser l'icône « image cassée » du navigateur.
 */

/**
 * Classe appliquée au bloc de remplacement inséré à la place du média.
 * @const {string}
 */
const CLASSE_REPLACEMENT = 'media-unavailable';

/**
 * Attache un écouteur d'erreur sur chaque média (img/video) contenu
 * dans l'élément racine.
 *
 * @param {HTMLElement} root Élément racine dans lequel chercher.
 * @return {void}
 */
export function attachMediaFallback(root) {
  if (!root) return;

  root.querySelectorAll('img, video').forEach((media) => {
    // Certaines images peuvent déjà avoir échoué avant l'attachement.
    const dejaEnErreur = media.tagName === 'IMG' && media.complete &&
      media.naturalWidth === 0 && media.src !== '';

    if (dejaEnErreur) {
      remplacerMedia(media);
      return;
    }

    media.addEventListener('error', () => remplacerMedia(media), {once: true});
  });
}

/**
 * Masque le média fautif et affiche un repère dans son conteneur.
 *
 * @param {HTMLElement} media Élément img ou video en erreur.
 * @return {void}
 */
function remplacerMedia(media) {
  if (media.dataset.fallbackApplique === '1') return;
  media.dataset.fallbackApplique = '1';

  media.style.display = 'none';

  const parent = media.parentElement;
  if (!parent) return;

  parent.classList.add('media-missing');

  // Un seul repère par conteneur, même si plusieurs médias échouent.
  if (parent.querySelector('.' + CLASSE_REPLACEMENT)) return;

  const repere = document.createElement('span');
  repere.className = CLASSE_REPLACEMENT;
  repere.textContent = '📷 Média indisponible';
  parent.appendChild(repere);
}
