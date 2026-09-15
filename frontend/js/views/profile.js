/**
 * @fileoverview Vue de profil utilisateur.
 */

import { getCurrentUser } from '../api.js';
import { showPostModal } from '../post-modal.js';
import { attachMediaFallback } from '../media-fallback.js';

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
 * Rend le squelette HTML de la vue Profil.
 * @return {string} HTML de la vue.
 */
export function render() {
  return `
    <div class="profile-page" id="profile-page">
      <div class="profile-loading">Chargement du profil...</div>
    </div>
  `;
}

/**
 * Génère le HTML complet du profil à partir des données utilisateur.
 * @param {Object} user Données de l'utilisateur.
 * @return {string} HTML du profil.
 */
function buildProfileHtml(user) {
  const postsGrid = user.posts
    .map(
      (post) => `
      <div class="profile-post-thumb" data-post-id="${post.id}">
        <img src="${post.mediaUrl}" alt="Publication de ${escapeHtml(user.username)}">
        ${post.isVideo ? '<span class="media-badge">🎬</span>' : ''}
      </div>
    `,
    )
    .join('');

  return `
    <div class="profile-header">
      <div class="profile-avatar-section">
        <img src="${user.avatar}" alt="${escapeHtml(user.username)}" class="profile-avatar">
      </div>
      <div class="profile-info">
        <div class="profile-top-row">
          <div class="profile-names">
            <h2 class="profile-name">${escapeHtml(user.name)}</h2>
            <h2 class="profile-username">${escapeHtml(user.username)}</h2>
          </div>
          <button class="btn-edit-profile">Modifier le profil</button>
        </div>
        <div class="profile-stats">
          <span><strong>${user.postsCount}</strong> publications</span>
          <span><strong>${user.followersCount}</strong> abonnés</span>
          <span><strong>${user.followingCount}</strong> abonnements</span>
        </div>
        <div class="profile-bio">
          <p>${escapeHtml(user.bio)}</p>
        </div>
      </div>
    </div>

    <div class="profile-tabs">
      <button class="profile-tab active" data-tab="posts">
        📷 Publications
      </button>
      <button class="profile-tab" data-tab="saved">
        🔖 Enregistrés
      </button>
      <button class="profile-tab" data-tab="tagged">
        🏷é Identifié
      </button>
    </div>

    <div class="profile-grid">
      ${postsGrid}
    </div>
  `;
}

/**
 * Monte la vue : récupère les données et installe les listeners.
 */
export async function mount() {
  const container = document.getElementById('profile-page');
  if (!container) return;

  try {
    const user = await getCurrentUser();
    container.innerHTML = buildProfileHtml(user);

    // Dégradé de remplacement si une image locale est manquante
    attachMediaFallback(container);

    // Onglets du profil
    const tabs = container.querySelectorAll('.profile-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        // TODO: charger le contenu de l'onglet quand l'API sera prête
      });
    });

    // Bouton "Modifier le profil"
    const editBtn = container.querySelector('.btn-edit-profile');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        window.location.hash = '#/edit-profile';
      });
    }

    // Thumbnails cliquables pour ouvrir le modal
    const thumbs = container.querySelectorAll('.profile-post-thumb');
    thumbs.forEach((thumb) => {
      thumb.style.cursor = 'pointer';
      thumb.addEventListener('click', () => {
        const postId = parseInt(thumb.dataset.postId);
        const post = user.posts.find((p) => p.id === postId);
        if (post) {
          showPostModal(post);
        }
      });
    });
  } catch (error) {
    container.innerHTML = `<p class="error-message">Erreur lors du chargement du profil.</p>`;
    console.error('Erreur profil :', error);
  }
}