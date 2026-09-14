/**
 * @fileoverview Vue d'édition du profil utilisateur.
 * Permet de modifier le nom d'utilisateur, le nom complet, la bio
 * et la photo de profil (via URL ou fichier local).
 */

import { getCurrentUser, updateProfile } from '../api.js';

/**
 * Rend le squelette HTML de la vue Edit Profile.
 * @return {string} HTML de la vue.
 */
export function render() {
  return `
    <div class="edit-profile-page">
      <div class="edit-profile-card">
        <h1>Modifier le profil</h1>

        <form id="edit-profile-form" class="edit-profile-form">
          <div class="form-group">
            <label for="input-username">Nom d'utilisateur</label>
            <input type="text" id="input-username" placeholder="Votre nom d'utilisateur" required>
          </div>

          <div class="form-group">
            <label for="input-name">Nom complet</label>
            <input type="text" id="input-name" placeholder="Votre nom et prénom">
          </div>

          <div class="form-group">
            <label for="input-bio">Biographie</label>
            <textarea id="input-bio" rows="3" placeholder="Décrivez-vous en quelques mots..."></textarea>
          </div>

          <div class="form-group">
            <label for="input-avatar">Photo de profil (URL)</label>
            <input type="url" id="input-avatar" placeholder="https://example.com/photo.jpg">
          </div>

          <div class="form-group">
            <label>Ou depuis votre ordinateur</label>
            <div class="avatar-file-row">
              <button type="button" class="btn-file-upload" id="btn-avatar-file">📁 Choisir un fichier</button>
              <input type="file" id="input-avatar-file" accept="image/png, image/jpeg, image/webp, image/gif" hidden>
              <span id="avatar-file-name" class="avatar-file-name"></span>
            </div>
          </div>

          <div class="form-group">
            <div class="avatar-preview-section">
              <label>Aperçu :</label>
              <img id="avatar-preview" src="" alt="Aperçu de la photo de profil" class="avatar-preview">
            </div>
          </div>

          <p id="edit-error" class="edit-error" hidden></p>

          <div class="edit-profile-buttons">
            <button type="submit" class="btn-save">Enregistrer les modifications</button>
            <button type="button" class="btn-cancel" id="btn-cancel">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * Charge les données de l'utilisateur dans le formulaire.
 */
async function loadUserData() {
  try {
    const user = await getCurrentUser();
    document.getElementById('input-username').value = user.username;
    document.getElementById('input-name').value = user.name || '';
    document.getElementById('input-bio').value = user.bio || '';
    document.getElementById('input-avatar').value = user.avatar;
    document.getElementById('avatar-preview').src = user.avatar;
  } catch (error) {
    console.error('Erreur de chargement du profil:', error);
  }
}

/**
 * Met à jour l'aperçu de la photo de profil.
 * Affiche l'URL fournie ou un placeholder si l'URL est vide/invalide.
 */
function updateAvatarPreview() {
  const avatarUrl = document.getElementById('input-avatar').value.trim();
  const preview = document.getElementById('avatar-preview');

  preview.onerror = function() {
    preview.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3E%3C/svg%3E';
  };

  if (avatarUrl) {
    preview.src = avatarUrl;
  } else {
    preview.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3E%3C/svg%3E';
  }
}

/**
 * Gère la sélection d'un fichier image local pour l'avatar.
 * Convertit l'image en data URL (base64) pour la prévisualisation
 * et l'enregistrement.
 */
function handleAvatarFileSelect() {
  const fileInput = document.getElementById('input-avatar-file');
  const fileNameSpan = document.getElementById('avatar-file-name');
  const urlInput = document.getElementById('input-avatar');

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez choisir un fichier image (PNG, JPEG, WebP ou GIF).');
      fileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      // Injecte le data URL dans le champ URL (c'est ce qui sera enregistré)
      urlInput.value = dataUrl;
      // Met à jour la prévisualisation
      const preview = document.getElementById('avatar-preview');
      preview.src = dataUrl;
      // Affiche le nom du fichier choisi
      fileNameSpan.textContent = '📄 ' + file.name;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btn-avatar-file').addEventListener('click', () => {
    fileInput.click();
  });
}

/**
 * Gère la soumission du formulaire.
 * @param {Event} event Événement de soumission.
 */
async function handleEditSubmit(event) {
  event.preventDefault();

  const username = document.getElementById('input-username').value.trim();
  const name = document.getElementById('input-name').value.trim();
  const bio = document.getElementById('input-bio').value.trim();
  const avatar = document.getElementById('input-avatar').value.trim();
  const errorEl = document.getElementById('edit-error');
  const submitBtn = event.target.querySelector('button[type="submit"]');

  errorEl.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enregistrement...';

  try {
    if (!username) {
      throw new Error("Le nom d'utilisateur est obligatoire");
    }
    if (!avatar) {
      throw new Error("La photo de profil est obligatoire (URL ou fichier)");
    }

    await updateProfile({username, name, bio, avatar});

    // Redirection vers le profil
    window.location.hash = '#/profile';
  } catch (error) {
    errorEl.textContent = error.message || 'Une erreur est survenue';
    errorEl.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enregistrer les modifications';
  }
}

/**
 * Monte la vue : installe les event listeners.
 */
export async function mount() {
  await loadUserData();

  document.getElementById('input-avatar').addEventListener('input', updateAvatarPreview);
  handleAvatarFileSelect();
  document.getElementById('edit-profile-form').addEventListener('submit', handleEditSubmit);
  document.getElementById('btn-cancel').addEventListener('click', () => {
    window.location.hash = '#/profile';
  });
}
