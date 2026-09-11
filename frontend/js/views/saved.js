/**
 * @fileoverview Vue des publications enregistrées (bookmarks).
 */

import { getSavedPosts } from '../api.js';

/**
 * Rend le squelette HTML de la vue Enregistrées.
 * @return {string} HTML de la vue.
 */
export function render() {
  return `
    <div class="saved-page">
      <div class="saved-container">
        <h1 class="saved-title">🔖 Enregistrées</h1>
        <p class="saved-subtitle">Vos publications enregistrées</p>
        <div class="saved-grid" id="saved-grid">
          <span class="skeleton-text">Chargement...</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Génère le HTML d'une publication enregistrée (thumbnail).
 * @param {Object} post Données de la publication.
 * @return {string} HTML du thumbnail.
 */
function createSavedTileHtml(post) {
  return `
    <div class="saved-tile" data-post-id="${post.id}">
      <img src="${post.mediaUrl}" alt="Publication de ${post.author}">
      ${post.isVideo ? '<span class="media-badge">🎬</span>' : ''}
      <div class="saved-tile-overlay">
        <span>❤️ ${post.likesCount}</span>
        <span>👤 ${post.author}</span>
      </div>
    </div>
  `;
}

/**
 * Monte la vue : récupère les données et installe les listeners.
 */
export async function mount() {
  const grid = document.getElementById('saved-grid');
  if (!grid) return;

  try {
    const posts = await getSavedPosts();

    if (!posts || posts.length === 0) {
      grid.innerHTML = `
        <div class="saved-empty">
          <span class="saved-empty-icon">🔖</span>
          <p>Aucune publication enregistrée</p>
          <span>Enregistrez des publications pour les retrouver ici</span>
        </div>
      `;
      return;
    }

    grid.innerHTML = posts.map(createSavedTileHtml).join('');

    // Clic sur une publication enregistrée
    grid.querySelectorAll('.saved-tile').forEach((tile) => {
      tile.addEventListener('click', () => {
        // TODO: ouvrir la publication en mode détail
        const postId = tile.dataset.postId;
        console.info(`[DEV] Ouverture de la publication #${postId}`);
      });
    });
  } catch (error) {
    grid.innerHTML = '<p class="error-message">Erreur de chargement.</p>';
    console.error('Erreur publications enregistrées :', error);
  }
}
