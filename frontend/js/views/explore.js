/**
 * @fileoverview Vue Explorer / Tendances.
 * Le clic sur un hashtag filtre la grille pour ne montrer que les
 * publications contenant exactement ce hashtag (correspondance par
 * mot entier, pas par sous-chaîne).
 *
 * Robustesse des interactions rapides :
 * - chips en <button> (aucune navigation),
 * - délégation d'événements (un seul listener par conteneur),
 * - filtrage regroupé via requestAnimationFrame,
 * - lookup des posts via Map plutôt qu'Array.find.
 */

import { getTrendingPosts, getHashtags } from '../api.js';
import { showPostModal } from '../post-modal.js';
import { attachMediaFallback } from '../media-fallback.js';

/** Débounce en ms pour la recherche temps réel. */
const SEARCH_DEBOUNCE_MS = 150;

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
        <div class="explore-search-wrapper">
          <span class="explore-search-icon">🔍</span>
          <input
            type="text"
            id="explore-search-input"
            placeholder="Rechercher un hashtag ou un auteur..."
            class="explore-search-input"
            autocomplete="off">
          <button type="button" id="btn-search-clear" class="explore-search-clear" hidden title="Effacer la recherche">✕</button>
        </div>
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
 * Génère le HTML d'un hashtag (button : pas de navigation).
 * @param {Object} hashtag Hashtag à afficher.
 * @return {string} HTML du hashtag.
 */
function createHashtagHtml(hashtag) {
  return `
    <button type="button" class="hashtag-chip" data-tag="${hashtag.tag}">
      <span class="hashtag-name">${hashtag.tag}</span>
      <span class="hashtag-count">${hashtag.count} publications</span>
    </button>
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
      <img src="${post.mediaUrl}" alt="Publication de ${escapeHtml(post.author)}" loading="lazy">
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
  const searchClearBtn = document.getElementById('btn-search-clear');
  const clearBtn = document.getElementById('btn-clear-filter');
  const emptyState = document.getElementById('explore-empty');
  const sectionTitle = document.getElementById('trending-title');
  if (!grid || !hashtagsList) return;

  try {
    const [trendingPosts, hashtags] = await Promise.all([
      getTrendingPosts(),
      getHashtags(),
    ]);

    // Lookup direct par id (O(1) au lieu de O(n) par tuile).
    const postsById = new Map(trendingPosts.map((p) => [p.id, p]));

    // Affichage des hashtags
    hashtagsList.innerHTML = hashtags.map(createHashtagHtml).join('');

    // Affichage des publications tendance
    grid.innerHTML = trendingPosts.map(createTrendingThumbHtml).join('');
    attachMediaFallback(grid);

    let filterScheduled = false;
    let lastAppliedQuery = null;

    /**
     * Filtre les publications affichées, regroupé dans une frame
     * d'animation : les clics rapprochés ne déclenchent qu'un seul
     * passage sur le DOM.
     * - Requête "#tag" : correspondance exacte sur un mot de la caption.
     * - Sinon : recherche par auteur ou texte de la caption.
     * @param {string} rawQuery Requête de filtrage.
     */
    const filterPosts = (rawQuery) => {
      if (filterScheduled) return;
      filterScheduled = true;
      requestAnimationFrame(() => {
        filterScheduled = false;
        const query = rawQuery.toLowerCase().trim();

        // Évite le travail si la requête n'a pas changé.
        if (query === lastAppliedQuery) return;
        lastAppliedQuery = query;

        let visibleCount = 0;
        for (const tile of grid.querySelectorAll('.explore-tile')) {
          const post = postsById.get(parseInt(tile.dataset.postId, 10));
          if (!post) continue;

          const caption = (post.caption || '').toLowerCase();
          let show = true;
          if (query !== '') {
            if (query.startsWith('#')) {
              // Hashtags liés en base (Contient_Tag) ou présents dans le texte.
              const postHashtags = (post.hashtags || [])
                .map((h) => h.toLowerCase());
              show = caption.split(/\s+/).includes(query) ||
                postHashtags.includes(query);
            } else {
              show = post.author.toLowerCase().includes(query) ||
                caption.includes(query);
            }
          }

          tile.style.display = show ? '' : 'none';
          if (show) visibleCount++;
        }

        // Titre de section + bouton d'effacement + état vide
        if (query.startsWith('#')) {
          sectionTitle.textContent = '📸 Publications ' + query;
        } else if (query !== '') {
          sectionTitle.textContent = '📸 Résultats de recherche';
        } else {
          sectionTitle.textContent = '📸 Publications populaires';
        }
        clearBtn.hidden = query === '';
        searchClearBtn.hidden = query === '';
        emptyState.hidden = visibleCount !== 0;
      });
    };

    /**
     * Synchronise l'état actif des chips avec la requête courante.
     * @param {string} query Requête courante (minuscules).
     */
    const syncActiveChip = (query) => {
      for (const chip of hashtagsList.querySelectorAll('.hashtag-chip')) {
        chip.classList.toggle('active', chip.dataset.tag === query);
      }
    };

    /**
     * Applique une requête : champ de recherche, chips et filtre.
     * @param {string} query Requête à appliquer.
     */
    const applyQuery = (query) => {
      if (searchInput) searchInput.value = query;
      syncActiveChip(query.toLowerCase().trim());
      filterPosts(query);
    };

    /**
     * Réinitialise la recherche et le filtre actif sur les chips.
     */
    const resetFilter = () => {
      applyQuery('');
    };

    // Dépend de la closure filterPosts ; déclaré après par lisibilité.
    const onChipClick = (chip) => {
      const tag = chip.dataset.tag;
      if (chip.classList.contains('active')) {
        resetFilter();
        return;
      }
      applyQuery(tag);
    };

    // Délégation : UN listener pour toutes les chips.
    hashtagsList.addEventListener('click', (e) => {
      const chip = e.target.closest('.hashtag-chip');
      if (chip) onChipClick(chip);
    });

    // Délégation : UN listener pour toutes les tuiles.
    grid.addEventListener('click', (e) => {
      const tile = e.target.closest('.explore-tile');
      if (!tile) return;
      const post = postsById.get(parseInt(tile.dataset.postId, 10));
      if (post) showPostModal(post);
    });

    // Bouton "Effacer le filtre"
    clearBtn.addEventListener('click', resetFilter);

    // Bouton ✕ dans le champ de recherche
    searchClearBtn.addEventListener('click', resetFilter);

    // Recherche temps réel (débouncée, par auteur, caption ou hashtag)
    if (searchInput) {
      let debounceTimer = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        debounceTimer = setTimeout(() => {
          syncActiveChip(query.toLowerCase());
          filterPosts(query);
        }, SEARCH_DEBOUNCE_MS);
      });
    }

    // Filtre en attente déposé par la vue Recherche (clic sur un
    // hashtag depuis #/search) : appliqué une seule fois puis effacé.
    const pending = sessionStorage.getItem('explore-pending-filter');
    if (pending) {
      sessionStorage.removeItem('explore-pending-filter');
      applyQuery(pending);
    }

    // Filtre directement dans l'URL (#/explore?tag=#xxx) : liens
    // cliquables depuis les légendes du fil et les puces hashtags.
    const queryString = window.location.hash.split('?')[1] || '';
    const initialTag = new URLSearchParams(queryString).get('tag');
    if (initialTag) {
      applyQuery(initialTag);
    }
  } catch (error) {
    grid.innerHTML = '<p class="error-message">Erreur lors du chargement des tendances.</p>';
    console.error('Erreur explore :', error);
  }
}
