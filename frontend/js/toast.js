/**
 * @fileoverview Notifications temporaires (toasts), en remplacement des
 * boîtes de dialogue natives du navigateur (alert).
 */

/**
 * Affiche un message temporaire en bas de l'écran.
 * @param {string} message Message à afficher.
 * @param {'info'|'success'|'error'=} type Style du toast.
 * @param {number=} duration Durée d'affichage en millisecondes.
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove(), {once: true});
    // Filet de sécurité si la transition ne se déclenche pas.
    setTimeout(() => toast.remove(), 600);
  }, duration);
}
