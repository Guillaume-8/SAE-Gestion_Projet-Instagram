/**
 * @fileoverview Vue Explorer / Tendances.
 */

import { getTrendingPosts, getHashtags } from '../api.js';
import { showPostModal } from '../post-modal.js';

/**
 * Rend le squelette HTML de la vue Explorer.
 * @return {string} HTML de la vue.
 */
export function render() {
  return `
    <div class="explore-page" id="explore-page">
      <div class="explore-search-bar">
        <input
          type="text"
          id="explore-search-input"
          placeholder="Rechercher un hashtag, un utilisateur..."
          class="explore-search-input">
      </div>

      <section class="hashtags-section">
        <h2 class="section-title">🔥 Hashtags tendance</h2>
        <div class="hashtags-list" id="hashtags-list">
          <span class="hashtag-skeleton">Chargement...</span>
        </div>
      </section>

      <section class="trending-grid-section">
        <h2 class="section-title">📸 Publications populaires</h2>
        <div class="explore-grid" id="explore-grid">
          <span class="grid-skeleton">Chargement...</span>
        </div>
      </section>
    </div>
  `;
}

/**
 * Génère le HTML d'un hashtag.
 * @param {Object} hashtag Hashtag à afficher.
 * @return {string} HTML du hashtag.
 */
function createHashtagHtml(hashtag) {
  return `
    <a href="#/explore" class="hashtag-chip" data-tag="${hashtag.tag}">
      <span class="hashtag-name">${hashtag.tag}</span>
      <span class="hashtag-count">${hashtag.count} publications</span>
    </a>
  `;
}

/**
 * Génère le HTML d'une publication tendance (thumbnail carré).
 * @param {Object} post Publication à afficher.
 * @return {string} HTML du thumbnail.
 */
function createTrendingThumbHtml(post) {
  return `
    <div class="explore-tile" data-post-id="${post.id}">
      <img src="${post.mediaUrl}" alt="Publication de ${post.author}">
      <div class="explore-tile-overlay">
        <span>❤️ ${post.likesCount}</span>
        <span>👤 ${post.author}</span>
      </div>
      ${post.isVideo ? '<span class="media-badge">🎬</span>' : ''}
    </div>
  `;
}

/**
 * Monte la vue : récupère les données et installe les listeners.
 */
export async function mount() {
  const grid = document.getElementById('explore-grid');
  const hashtagsList = document.getElementById('hashtags-list');
  const searchInput = document.getElementById('explore-search-input');
  if (!grid || !hashtagsList) return;

  try {
    const [trendingPosts, hashtags] = await Promise.all([
      getTrendingPosts(),
      getHashtags(),
    ]);

    // Affichage des hashtags
    hashtagsList.innerHTML = hashtags.map(createHashtagHtml).join('');

    // Affichage des publications tendance
    grid.innerHTML = trendingPosts.map(createTrendingThumbHtml).join('');

    // Fonction pour filtrer les posts par hashtag ou recherche
    const filterPosts = (query) => {
      const tiles = grid.querySelectorAll('.explore-tile');
      query = query.toLowerCase().trim();

      tiles.forEach((tile) => {
        const postId = parseInt(tile.dataset.postId);
        const post = trendingPosts.find((p) => p.id === postId);
        if (!post) return;

        // Vérifier si le post correspond à la requête
        const authorMatch = post.author.toLowerCase().includes(query);
        const captionMatch = post.caption.toLowerCase().includes(query);
        const hashtagMatch = query.startsWith('#') 
          ? post.caption.includes(query)
          : false;

        tile.style.display = 
          (query === '' || authorMatch || captionMatch || hashtagMatch) ? '' : 'none';
      });
    };

    // Clic sur un hashtag → filtrage
    hashtagsList.querySelectorAll('.hashtag-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const tag = chip.dataset.tag;
        if (searchInput) {
          searchInput.value = tag;
          filterPosts(tag);
        }
      });
    });

    // Clic sur une publication → ouvrir le détail
    grid.querySelectorAll('.explore-tile').forEach((tile) => {
      tile.style.cursor = 'pointer';
      tile.addEventListener('click', () => {
        const postId = parseInt(tile.dataset.postId);
        const post = trendingPosts.find((p) => p.id === postId);
        if (post) {
          showPostModal(post);
        }
      });
    });

    // Recherche en temps réel (par auteur, caption ou hashtag)
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        filterPosts(query);
      });
    }
  } catch (error) {
    grid.innerHTML = '<p class="error-message">Erreur lors du chargement des tendances.</p>';
    console.error('Erreur explore :', error);
  }
}