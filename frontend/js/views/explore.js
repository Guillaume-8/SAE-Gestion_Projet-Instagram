/**
 * @fileoverview Vue Explorer / Tendances.
 * Le clic sur un hashtag filtre la grille pour ne montrer que les
 * publications contenant exactement ce hashtag (correspondance par
 * mot entier, pas par sous-chaîne).
 */

import { getTrendingPosts, getHashtags } from '../api.js';
import { showPostModal } from '../post-modal.js';
import { attachMediaFallback } from '../media-fallback.js';

/**
 * Échappe les caractères HTML pour éviter les injections XSS.
 * @param {string} text Texte à échapper.
 * @return {string} Texte échappé.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

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
        <div class="trending-title-row">
          <h2 class="section-title" id="trending-title">📸 Publications populaires</h2>
          <button type="button" id="btn-clear-filter" class="explore-clear-btn" hidden>✕ Effacer le filtre</button>
        </div>
        <div class="explore-grid" id="explore-grid">
          <span class="grid-skeleton">Chargement...</span>
        </div>
        <div id="explore-empty" class="explore-empty" hidden>
          <span class="explore-empty-icon">🔍</span>
          <p>Aucune publication ne correspond à cette recherche.</p>
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
      <img src="${post.mediaUrl}" alt="Publication de ${escapeHtml(post.author)}">
      <div class="explore-tile-overlay">
        <span>❤️ ${post.likesCount}</span>
        <span>👤 ${escapeHtml(post.author)}</span>
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
  const clearBtn = document.getElementById('btn-clear-filter');
  const emptyState = document.getElementById('explore-empty');
  const sectionTitle = document.getElementById('trending-title');
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
    attachMediaFallback(grid);

    /**
     * Filtre les publications affichées.
     * - Requête "#tag" : correspondance exacte sur un mot de la caption.
     * - Sinon : recherche par auteur ou texte de la caption.
     * Met à jour le titre de section, l'état vide et le bouton d'effacement.
     * @param {string} rawQuery Requête de filtrage.
     */
    const filterPosts = (rawQuery) => {
      const query = rawQuery.toLowerCase().trim();
      let visibleCount = 0;

      grid.querySelectorAll('.explore-tile').forEach((tile) => {
        const postId = parseInt(tile.dataset.postId, 10);
        const post = trendingPosts.find((p) => p.id === postId);
        if (!post) return;

        const caption = (post.caption || '').toLowerCase();
        let show = true;
        if (query !== '') {
          if (query.startsWith('#')) {
            // Correspondance exacte : le hashtag doit être un mot complet.
            show = caption.split(/\s+/).includes(query);
          } else {
            show = post.author.toLowerCase().includes(query) ||
              caption.includes(query);
          }
        }

        tile.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });

      // Titre de section + bouton d'effacement + état vide
      if (query.startsWith('#')) {
        sectionTitle.textContent = '📸 Publications ' + query;
      } else if (query !== '') {
        sectionTitle.textContent = '📸 Résultats de recherche';
      } else {
        sectionTitle.textContent = '📸 Publications populaires';
      }
      clearBtn.hidden = query === '';
      emptyState.hidden = visibleCount !== 0;
    };

    // Réinitialise la recherche et le filtre actif sur les chips.
    const resetFilter = () => {
      if (searchInput) searchInput.value = '';
      hashtagsList.querySelectorAll('.hashtag-chip').forEach((chip) => {
        chip.classList.remove('active');
      });
      filterPosts('');
    };

    // Clic sur un hashtag → filtrage + état actif sur la chip
    hashtagsList.querySelectorAll('.hashtag-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const tag = chip.dataset.tag;
        const wasActive = chip.classList.contains('active');
        if (wasActive) {
          resetFilter();
          return;
        }
        hashtagsList.querySelectorAll('.hashtag-chip').forEach((c) => {
          c.classList.remove('active');
        });
        chip.classList.add('active');
        if (searchInput) searchInput.value = tag;
        filterPosts(tag);
      });
    });

    // Bouton "Effacer le filtre"
    clearBtn.addEventListener('click', resetFilter);

    // Clic sur une publication → ouvrir le détail
    grid.querySelectorAll('.explore-tile').forEach((tile) => {
      tile.style.cursor = 'pointer';
      tile.addEventListener('click', () => {
        const postId = parseInt(tile.dataset.postId, 10);
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
        hashtagsList.querySelectorAll('.hashtag-chip').forEach((chip) => {
          chip.classList.toggle('active', chip.dataset.tag === query.toLowerCase());
        });
        filterPosts(query);
      });
    }
  } catch (error) {
    grid.innerHTML = '<p class="error-message">Erreur lors du chargement des tendances.</p>';
    console.error('Erreur explore :', error);
  }
}
