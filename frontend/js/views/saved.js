/**
 * @fileoverview Vue des publications enregistrées (bookmarks).
 */

import { getSavedPosts } from '../api.js';
import { showPostModal } from '../post-modal.js';
import { attachMediaFallback } from '../media-fallback.js';

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

    // Dégradé de remplacement si une image locale est manquante
    attachMediaFallback(grid);

    grid.querySelectorAll('.saved-tile').forEach((tile) => {
      tile.addEventListener('click', () => {
        const postId = parseInt(tile.dataset.postId, 10);
        const post = posts.find((p) => p.id === postId);
        if (post) {
          showPostModal(post);
        }
      });
    });
  } catch (error) {
    grid.innerHTML = '<p class="error-message">Erreur de chargement.</p>';
    console.error('Erreur publications enregistrées :', error);
  }
}
