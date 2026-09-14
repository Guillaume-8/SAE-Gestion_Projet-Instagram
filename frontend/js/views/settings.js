/**
 * @fileoverview Vue Paramètres.
 */

/**
 * Affiche une notification toast.
 * @param {string} message Message à afficher.
 */
function showToast(message) {
  const notif = document.createElement('div');
  notif.className = 'toast-notification';
  notif.textContent = message;
  document.body.appendChild(notif);

  requestAnimationFrame(() => notif.classList.add('toast-visible'));

  setTimeout(() => {
    notif.classList.remove('toast-visible');
    notif.addEventListener('transitionend', () => notif.remove(), {
      once: true,
    });
  }, 3000);
}

/**
 * Rend le squelette HTML de la vue Paramètres.
 * @return {string} HTML de la vue.
 */
export function render() {
  return `
    <div class="settings-page">
      <div class="settings-container">
        <h1 class="settings-title">Paramètres</h1>

        <section class="settings-section">
          <h2 class="settings-section-title">Comment vous utilisez InstaClone</h2>

          <button class="settings-item" data-settings-action="edit-profile">
            <span class="settings-icon">👤</span>
            <span class="settings-label">Modifier le profil</span>
            <span class="settings-arrow">›</span>
          </button>

          <button class="settings-item" data-settings-action="notifications">
            <span class="settings-icon">🔔</span>
            <span class="settings-label">Notifications</span>
            <span class="settings-arrow">›</span>
          </button>
        </section>

        <section class="settings-section">
          <h2 class="settings-section-title">Ce que vous voyez</h2>

          <button class="settings-item" data-settings-action="privacy">
            <span class="settings-icon">🔒</span>
            <span class="settings-label">Confidentialité</span>
            <span class="settings-arrow">›</span>
          </button>

          <button class="settings-item" data-settings-action="friends">
            <span class="settings-icon">👥</span>
            <span class="settings-label">Amis</span>
            <span class="settings-arrow">›</span>
          </button>
        </section>

        <section class="settings-section">
          <h2 class="settings-section-title">Média</h2>

          <button class="settings-item" data-settings-action="share">
            <span class="settings-icon">🔗</span>
            <span class="settings-label">Partage</span>
            <span class="settings-arrow">›</span>
          </button>
        </section>

        <section class="settings-section">
          <h2 class="settings-section-title">Support</h2>

          <button class="settings-item" data-settings-action="help">
            <span class="settings-icon">❓</span>
            <span class="settings-label">Aide</span>
            <span class="settings-arrow">›</span>
          </button>

          <button class="settings-item" data-settings-action="contact">
            <span class="settings-icon">✉️</span>
            <span class="settings-label">Contact</span>
            <span class="settings-arrow">›</span>
          </button>

          <button class="settings-item" data-settings-action="account-status">
            <span class="settings-icon">📊</span>
            <span class="settings-label">Status du compte</span>
            <span class="settings-arrow">›</span>
          </button>
        </section>

        <p class="settings-version">InstaClone v1.0.0 — SAÉ 5.02 BUT R&T</p>
      </div>
    </div>
  `;
}

/**
 * Ouvre un sous-menu de paramètres.
 * @param {string} action Action demandée.
 */
function handleSettingsAction(action) {
  switch (action) {
    case 'edit-profile':
      window.location.hash = '#/profile';
      break;
    case 'notifications':
      showToast('Paramètres de notifications — bientôt disponible');
      break;
    case 'privacy':
      showToast('Confidentialité — bientôt disponible');
      break;
    case 'friends':
      showToast('Gestion des amis — bientôt disponible');
      break;
    case 'share':
      showToast('Paramètres de partage — bientôt disponible');
      break;
    case 'help':
      showToast("Centre d'aide — bientôt disponible");
      break;
    case 'contact':
      showToast('Contact — bientôt disponible');
      break;
    case 'account-status':
      showToast('Statut du compte — bientôt disponible');
      break;
  }
}

/**
 * Monte la vue : installe les event listeners.
 */
export function mount() {
  const items = document.querySelectorAll('.settings-item');
  items.forEach((item) => {
    item.addEventListener('click', () => {
      handleSettingsAction(item.dataset.settingsAction);
    });
  });
}
