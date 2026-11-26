/**
 * @fileoverview Menu hamburger : dropdown, mode sombre, déconnexion,
 * signalement de problème et navigation.
 */

import { logoutUser } from './api.js';
import { initNotifications } from './notification.js';

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
  let dropdown = document.getElementById('menu-dropdown');
  const btn = document.getElementById('btn-hamburger');
  if (!dropdown) {
    buildMenu();
    dropdown = document.getElementById('menu-dropdown');
  }
  if (!dropdown) return;

  const isOpen = dropdown.classList.contains('menu-open');

  if (isOpen) {
    closeMenu();
  } else {
    dropdown.classList.add('menu-open');
    if (btn) btn.classList.add('hamburger-active');
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
        logoutUser();
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
        <div class="problem-image-box" id="problem-image-box" hidden>
          <div class="problem-image-actions">
            <button type="button" class="btn-problem-pick" id="btn-problem-pick">📁 Choisir une image</button>
            <span class="problem-image-hint">ou collez-la (Ctrl+V)</span>
          </div>
          <input type="file" id="problem-image-input" accept="image/*" hidden>
          <div class="problem-image-preview" id="problem-image-preview" hidden>
            <img id="problem-image-img" alt="Aperçu de l'image jointe">
            <button type="button" class="btn-problem-remove" id="btn-problem-remove" title="Retirer l'image">✕</button>
          </div>
        </div>
      </div>
      <div class="report-actions">
        <button class="btn-report-cancel">Annuler</button>
        <button class="btn-report-confirm" id="btn-send-problem">Envoyer</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // --- Image jointe : choix d'un fichier ou collage depuis le presse-papiers
  const screenshotCheckbox = overlay.querySelector('#problem-screenshot');
  const imageBox = overlay.querySelector('#problem-image-box');
  const imageInput = overlay.querySelector('#problem-image-input');
  const imagePreview = overlay.querySelector('#problem-image-preview');
  const imageImg = overlay.querySelector('#problem-image-img');
  let attachedImage = null;

  const setImage = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      attachedImage = {name: file.name || 'capture.png', dataUrl: event.target.result};
      imageImg.src = attachedImage.dataUrl;
      imagePreview.hidden = false;
      // Une image ajoutée coche l'option si ce n'était pas fait.
      screenshotCheckbox.checked = true;
      imageBox.hidden = false;
    };
    reader.readAsDataURL(file);
  };
  const clearImage = () => {
    attachedImage = null;
    imageImg.removeAttribute('src');
    imagePreview.hidden = true;
    imageInput.value = '';
  };

  screenshotCheckbox.addEventListener('change', () => {
    imageBox.hidden = !screenshotCheckbox.checked;
    if (!screenshotCheckbox.checked) clearImage();
  });
  overlay.querySelector('#btn-problem-pick').addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', () => setImage(imageInput.files[0]));
  overlay.querySelector('#btn-problem-remove').addEventListener('click', clearImage);

  // Collage (Ctrl+V) : actif tant que la boîte est ouverte.
  const onPaste = (event) => {
    const items = (event.clipboardData && event.clipboardData.items) || [];
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        event.preventDefault();
        setImage(item.getAsFile());
        return;
      }
    }
  };
  document.addEventListener('paste', onPaste);

  const closeDialog = () => {
    document.removeEventListener('paste', onPaste);
    overlay.remove();
  };

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
    console.info('[MOCK] Problème signalé :', text,
        attachedImage ? `(image jointe : ${attachedImage.name})` : '');
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

  // Centre de notifications : pastille + écouteurs Socket.io
  initNotifications();

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
