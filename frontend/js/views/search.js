/**
 * @fileoverview Vue Recherche globale : profils, hashtags et publications.
 * Accessible depuis l'icône 🔍 du header (route #/search).
 * - Clic sur un compte → profil.
 * - Clic sur un hashtag → Tendances avec le filtre pré-appliqué.
 * - Clic sur une publication → modal de détail.
 */

import { searchAll } from '../api.js';
import { showPostModal } from '../post-modal.js';
import { attachMediaFallback } from '../media-fallback.js';

/** Débounce en ms pour la recherche temps réel. */
const SEARCH_DEBOUNCE_MS = 200;

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
 * Rend le squelette HTML de la vue Recherche.
 * @return {string} HTML de la vue.
 */
export function render() {
  return `
    <div class="search-page" id="search-page">
      <div class="search-bar-row">
        <div class="explore-search-wrapper search-main-wrapper">
          <span class="explore-search-icon">🔍</span>
          <input
            type="text"
            id="search-input"
            placeholder="Rechercher des profils, hashtags, publications..."
            class="explore-search-input"
            autocomplete="off"
            autofocus>
          <button type="button" id="btn-search-input-clear" class="explore-search-clear" hidden title="Effacer la recherche">✕</button>
        </div>
      </div>

      <div id="search-results" class="search-results">
        <div class="search-idle">
          <span class="search-idle-icon">🔍</span>
          <p>Recherchez des comptes, des hashtags ou des publications</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Génère le HTML d'un résultat de type compte.
 * @param {Object} user Utilisateur {username, avatar, postsCount}.
 * @return {string} HTML du résultat.
 */
function createUserResultHtml(user) {
  return `
    <div class="search-result-user" data-username="${escapeHtml(user.username)}">
      <img src="${user.avatar}" alt="${escapeHtml(user.username)}" class="search-result-avatar">
      <div class="search-result-user-info">
        <span class="search-result-username">${escapeHtml(user.username)}</span>
        <span class="search-result-subtitle">${user.postsCount} publication${user.postsCount > 1 ? 's' : ''}</span>
      </div>
    </div>
  `;
}

/**
 * Génère le HTML d'un résultat de type hashtag.
 * @param {Object} hashtag Hashtag {tag, count}.
 * @return {string} HTML du résultat.
 */
function createHashtagResultHtml(hashtag) {
  return `
    <div class="search-result-hashtag" data-tag="${hashtag.tag}">
      <span class="search-result-hashtag-icon">#</span>
      <div class="search-result-user-info">
        <span class="search-result-username">${hashtag.tag}</span>
        <span class="search-result-subtitle">${hashtag.count} publication${hashtag.count > 1 ? 's' : ''}</span>
      </div>
    </div>
  `;
}

/**
 * Génère le HTML d'un résultat de type publication (thumbnail).
 * @param {Object} post Publication.
 * @return {string} HTML du résultat.
 */
function createPostResultHtml(post) {
  return `
    <div class="search-result-tile" data-post-id="${post.id}">
      <img src="${post.mediaUrl}" alt="Publication de ${escapeHtml(post.author)}" loading="lazy">
      <div class="explore-tile-overlay">
        <span>❤️ ${post.likesCount}</span>
        <span>👤 ${escapeHtml(post.author)}</span>
      </div>
    </div>
  `;
}

/**
 * Génère le HTML complet des résultats groupés par section.
 * @param {Object} results Résultats {users, hashtags, posts}.
 * @return {string} HTML des résultats.
 */
function createResultsHtml(results) {
  const hasUsers = results.users.length > 0;
  const hasHashtags = results.hashtags.length > 0;
  const hasPosts = results.posts.length > 0;

  if (!hasUsers && !hasHashtags && !hasPosts) {
    return `
      <div class="search-idle">
        <span class="search-idle-icon">🤷</span>
        <p>Aucun résultat. Essayez un autre terme de recherche.</p>
      </div>
    `;
  }

  let html = '';

  if (hasUsers) {
    html += '<h2 class="section-title search-section-title">👤 Comptes</h2>';
    html += '<div class="search-users-list">' +
      results.users.map(createUserResultHtml).join('') + '</div>';
  }

  if (hasHashtags) {
    html += '<h2 class="section-title search-section-title">#️⃣ Hashtags</h2>';
    html += '<div class="search-users-list">' +
      results.hashtags.map(createHashtagResultHtml).join('') + '</div>';
  }

  if (hasPosts) {
    html += '<h2 class="section-title search-section-title">📸 Publications</h2>';
    html += '<div class="explore-grid search-posts-grid">' +
      results.posts.map(createPostResultHtml).join('') + '</div>';
  }

  return html;
}

/**
 * Monte la vue : installe la recherche temps réel et les interactions.
 */
export async function mount() {
  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('btn-search-input-clear');
  const resultsContainer = document.getElementById('search-results');
  if (!input || !resultsContainer) return;

  /** Cache des derniers résultats pour les interactions par délégation. */
  let latestResults = {users: [], hashtags: [], posts: []};

  /**
   * Lance la recherche et affiche les résultats.
   * @param {string} query Terme de recherche.
   */
  const runSearch = async (query) => {
    clearBtn.hidden = query === '';
    if (!query.trim()) {
      latestResults = {users: [], hashtags: [], posts: []};
      resultsContainer.innerHTML = `
        <div class="search-idle">
          <span class="search-idle-icon">🔍</span>
          <p>Recherchez des comptes, des hashtags ou des publications</p>
        </div>
      `;
      return;
    }

    latestResults = await searchAll(query);
    resultsContainer.innerHTML = createResultsHtml(latestResults);
    attachMediaFallback(resultsContainer);
  };

  // Recherche temps réel débouncée
  let debounceTimer = null;
  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    debounceTimer = setTimeout(() => runSearch(query), SEARCH_DEBOUNCE_MS);
  });

  // Bouton ✕ dans le champ
  clearBtn.addEventListener('click', () => {
    input.value = '';
    runSearch('');
    input.focus();
  });

  // Interactions par délégation (un seul listener)
  resultsContainer.addEventListener('click', (e) => {
    // Clic sur un compte → profil
    const userRow = e.target.closest('.search-result-user');
    if (userRow) {
      window.location.hash = '#/profile';
      return;
    }

    // Clic sur un hashtag → Tendances avec filtre pré-appliqué
    const tagRow = e.target.closest('.search-result-hashtag');
    if (tagRow) {
      sessionStorage.setItem('explore-pending-filter', tagRow.dataset.tag);
      window.location.hash = '#/explore';
      return;
    }

    // Clic sur une publication → modal de détail
    const tile = e.target.closest('.search-result-tile');
    if (tile) {
      const post = latestResults.posts.find(
        (p) => p.id === parseInt(tile.dataset.postId, 10),
      );
      if (post) showPostModal(post);
    }
  });

  input.focus();
}
