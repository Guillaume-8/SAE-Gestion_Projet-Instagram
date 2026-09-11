/**
 * @fileoverview Menu hamburger : dropdown, mode sombre, déconnexion,
 * signalement de problème et navigation.
 */

// ============================================================
//  MODE SOMBRE / CLAIR
// ============================================================

/**
 * Applique le thème au document.
 * @param {string} theme 'dark' ou 'light'.
 */
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.dataset.theme = 'dark';
  } else {
    delete document.documentElement.dataset.theme;
  }
  localStorage.setItem('instaclone-theme', theme);
}

/**
 * Bascule entre mode sombre et clair.
 */
function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  applyTheme(isDark ? 'light' : 'dark');
  updateThemeLabel();
}

/**
 * Met à jour le libellé du bouton thème dans le menu.
 */
function updateThemeLabel() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  const label = document.getElementById('menu-theme-label');
  if (label) {
    label.textContent = isDark ? 'Mode clair' : 'Mode sombre';
  }
  const icon = document.getElementById('menu-theme-icon');
  if (icon) {
    icon.textContent = isDark ? '☀️' : '🌙';
  }
}

// ============================================================
//  MENU DROPDOWN
// ============================================================

/**
 * Bascule l'affichage du menu dropdown.
 */
function toggleMenu() {
  const dropdown = document.getElementById('menu-dropdown');
  const btn = document.getElementById('btn-hamburger');
  if (!dropdown) return;

  const isOpen = dropdown.classList.contains('menu-open');

  if (isOpen) {
    closeMenu();
  } else {
    dropdown.classList.add('menu-open');
    btn.classList.add('hamburger-active');
    updateThemeLabel();
  }
}

/**
 * Ferme le menu dropdown.
 */
function closeMenu() {
  const dropdown = document.getElementById('menu-dropdown');
  const btn = document.getElementById('btn-hamburger');
  if (dropdown) dropdown.classList.remove('menu-open');
  if (btn) btn.classList.remove('hamburger-active');
}

/**
 * Construit le menu dropdown dans le DOM (appelé une seule fois).
 */
function buildMenu() {
  const header = document.getElementById('app-header');
  if (!header || document.getElementById('menu-dropdown')) return;

  const dropdown = document.createElement('div');
  dropdown.className = 'menu-dropdown';
  dropdown.id = 'menu-dropdown';

  dropdown.innerHTML = `
    <button class="menu-item" data-menu-action="theme">
      <span class="menu-icon" id="menu-theme-icon">🌙</span>
      <span id="menu-theme-label">Mode sombre</span>
    </button>
    <button class="menu-item" data-menu-action="saved">
      <span class="menu-icon">🔖</span>
      <span>Enregistrées</span>
    </button>
    <button class="menu-item" data-menu-action="report">
      <span class="menu-icon">⚠️</span>
      <span>Signaler un problème</span>
    </button>
    <button class="menu-item" data-menu-action="settings">
      <span class="menu-icon">⚙️</span>
      <span>Paramètres</span>
    </button>
    <div class="menu-separator"></div>
    <button class="menu-item menu-item-danger" data-menu-action="logout">
      <span class="menu-icon">🚪</span>
      <span>Déconnecter</span>
    </button>
  `;

  header.appendChild(dropdown);

  // Gestion des actions du menu
  dropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.menu-item');
    if (!item) return;

    const action = item.dataset.menuAction;
    closeMenu();

    switch (action) {
      case 'theme':
        toggleTheme();
        break;
      case 'saved':
        window.location.hash = '#/saved';
        break;
      case 'report':
        openReportProblemDialog();
        break;
      case 'settings':
        window.location.hash = '#/settings';
        break;
      case 'logout':
        window.location.hash = '#/login';
        break;
    }
  });

  // Fermer le menu si on clique en dehors
  document.addEventListener('click', (e) => {
    if (
      !e.target.closest('#menu-dropdown') &&
      !e.target.closest('#btn-hamburger')
    ) {
      closeMenu();
    }
  });
}

// ============================================================
//  SIGNALER UN PROBLÈME
// ============================================================

/**
 * Ouvre la boîte de dialogue "Signaler un problème".
 */
function openReportProblemDialog() {
  const overlay = document.createElement('div');
  overlay.className = 'report-overlay';
  overlay.innerHTML = `
    <div class="report-dialog">
      <h3>Signaler un problème</h3>
      <p class="report-subtitle">Décrivez le problème rencontré :</p>
      <div class="report-problem-form">
        <textarea
          class="problem-textarea"
          id="problem-textarea"
          placeholder="Décrivez le bug ou le problème..."
          maxlength="1000"
          rows="5"></textarea>
        <label class="problem-screenshot">
          <input type="checkbox" id="problem-screenshot">
          <span>Joindre une capture d'écran</span>
        </label>
      </div>
      <div class="report-actions">
        <button class="btn-report-cancel">Annuler</button>
        <button class="btn-report-confirm" id="btn-send-problem">Envoyer</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeDialog = () => overlay.remove();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDialog();
  });

  overlay.querySelector('.btn-report-cancel').addEventListener('click', closeDialog);

  overlay.querySelector('#btn-send-problem').addEventListener('click', () => {
    const text = overlay.querySelector('#problem-textarea').value.trim();
    if (!text) {
      overlay.querySelector('#problem-textarea').focus();
      return;
    }
    // TODO: envoyer à l'API quand elle sera prête
    console.info('[MOCK] Problème signalé :', text);
    closeDialog();
    showToast('Problème signalé. Merci !');
  });
}

// ============================================================
//  TOAST
// ============================================================

/**
 * Affiche une notification toast.
 * @param {string} message Message à afficher.
 * @param {boolean} isError Indique s'il s'agit d'une erreur.
 */
function showToast(message, isError = false) {
  const notif = document.createElement('div');
  notif.className = `toast-notification${isError ? ' toast-error' : ''}`;
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

// ============================================================
//  INITIALISATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  buildMenu();

  const btn = document.getElementById('btn-hamburger');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });
  }

  // Appliquer le thème sauvegardé
  const savedTheme = localStorage.getItem('instaclone-theme');
  if (savedTheme === 'dark') {
    applyTheme('dark');
  }
  updateThemeLabel();
});
