/**
 * @fileoverview Vue d'édition du profil utilisateur.
 */

import { getCurrentUser, updateProfile } from '../api.js';

/**
 * Échappe les caractères HTML.
 * @param {string} text Texte à échapper.
 * @return {string} Texte échappé.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

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
            <label for="input-avatar">Photo de profil (URL)</label>
            <input type="url" id="input-avatar" placeholder="https://example.com/photo.jpg" required>
          </div>

          <div class="form-group">
            <div class="avatar-preview-section">
              <label>Aperçu:</label>
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
    document.getElementById('input-avatar').value = user.avatar;
    document.getElementById('avatar-preview').src = user.avatar;
  } catch (error) {
    console.error('Erreur de chargement du profil:', error);
  }
}

/**
 * Met à jour l'aperçu de la photo de profil.
 */
function updateAvatarPreview() {
  const avatarUrl = document.getElementById('input-avatar').value;
  const preview = document.getElementById('avatar-preview');
  
  if (avatarUrl) {
    preview.src = avatarUrl;
    preview.onerror = function() {
      preview.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3E%3C/svg%3E';
    };
  }
}

/**
 * Gère la soumission du formulaire.
 * @param {Event} event Événement de soumission.
 */
async function handleEditSubmit(event) {
  event.preventDefault();

  const username = document.getElementById('input-username').value.trim();
  const avatar = document.getElementById('input-avatar').value.trim();
  const errorEl = document.getElementById('edit-error');
  const submitBtn = event.target.querySelector('button[type="submit"]');

  errorEl.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enregistrement...';

  try {
    if (!username || !avatar) {
      throw new Error('Veuillez remplir tous les champs');
    }

    await updateProfile(username, avatar);

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
  document.getElementById('edit-profile-form').addEventListener('submit', handleEditSubmit);
  document.getElementById('btn-cancel').addEventListener('click', () => {
    window.location.hash = '#/profile';
  });
}
