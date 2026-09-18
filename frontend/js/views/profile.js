/**
 * @fileoverview Vue de profil utilisateur.
 * Affiche le profil de l'utilisateur connecté (#/profile) ou celui d'un autre
 * utilisateur (#/profile?user=nom_utilisateur).
 */

import { getCurrentUser, getUserProfile, getSavedPosts, getTaggedPosts } from '../api.js';
import { showPostModal } from '../post-modal.js';

const PRIVACY_KEY = 'instaclone_privacy_settings';

/**
 * Récupère le statut de confidentialité depuis le localStorage.
 * @return {{isPrivate: boolean}}
 */
function getPrivacySettings() {
  const saved = localStorage.getItem(PRIVACY_KEY);
  return saved ? JSON.parse(saved) : { isPrivate: false };
}

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
 * Libellés affichés pour chaque genre.
 * @type {Object<string, string>}
 */
const GENDER_LABELS = {
  female: 'Femme',
  male: 'Homme',
  other: 'Autre',
};

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
 * Génère le HTML de la grille de publications.
 * @param {Array<Object>} posts Publications à afficher.
 * @param {string} username Nom d'utilisateur du profil.
 * @return {string} HTML de la grille.
 */
function buildPostsGridHtml(posts, username) {
  if (posts.length === 0) {
    return '<p class="empty-text">Aucune publication</p>';
  }

  return posts
    .map(
      (post) => `
      <div class="profile-post-thumb" data-post-id="${post.id}">
        ${post.isVideo
          ? `<video src="${post.mediaUrl}" muted preload="metadata"></video>`
          : `<img src="${post.mediaUrl}" alt="Publication de ${escapeHtml(username)}">`
        }
        ${post.isVideo ? '<span class="media-badge">🎬</span>' : ''}
      </div>
    `,
    )
    .join('');
}

/**
 * Génère le HTML complet du profil à partir des données utilisateur.
 * @param {Object} user Données de l'utilisateur.
 * @param {boolean} isOwnProfile Indique s'il s'agit du profil de l'utilisateur connecté.
 * @return {string} HTML du profil.
 */
function buildProfileHtml(user, isOwnProfile) {
  const genderLabel = user.showGender ? GENDER_LABELS[user.gender] : null;
  const {isPrivate} = getPrivacySettings();

  // Compte privé consulté par quelqu'un d'autre : on masque les publications.
  if (isPrivate && !isOwnProfile) {
    return `
      <div class="profile-header">
        <div class="profile-avatar-section">
          <img src="${user.avatar}" alt="${escapeHtml(user.username)}" class="profile-avatar">
        </div>
        <div class="profile-info">
          <div class="profile-top-row">
            <div class="profile-names">
              ${user.name ? `<h2 class="profile-name">${escapeHtml(user.name)}</h2>` : ''}
              <h2 class="profile-username">${escapeHtml(user.username)}</h2>
            </div>
            <button class="btn-follow">S'abonner</button>
          </div>
          <div class="profile-stats">
            <span><strong>${user.postsCount}</strong> publications</span>
            <span><strong>${user.followersCount}</strong> abonnés</span>
            <span><strong>${user.followingCount}</strong> abonnements</span>
          </div>
          ${user.bio ? `<div class="profile-bio"><p>${escapeHtml(user.bio)}</p></div>` : ''}
        </div>
      </div>

      <div class="private-account-container">
        <div class="private-account-icon">🔒</div>
        <h3>Ce compte est privé</h3>
        <p>Abonnez-vous pour voir ses photos et vidéos.</p>
      </div>
    `;
  }

  return `
    <div class="profile-header">
      <div class="profile-avatar-section">
        <img src="${user.avatar}" alt="${escapeHtml(user.username)}" class="profile-avatar">
      </div>
      <div class="profile-info">
        <div class="profile-top-row">
          <div class="profile-names">
            ${user.name ? `<h2 class="profile-name">${escapeHtml(user.name)}</h2>` : ''}
            <h2 class="profile-username">${escapeHtml(user.username)}</h2>
            ${genderLabel ? `<span class="profile-gender">${genderLabel}</span>` : ''}
          </div>
          ${
            isOwnProfile
              ? '<button class="btn-edit-profile">Modifier le profil</button>'
              : '<button class="btn-follow">S\'abonner</button>'
          }
        </div>
        <div class="profile-stats">
          <span><strong>${user.postsCount}</strong> publications</span>
          <span><strong>${user.followersCount}</strong> abonnés</span>
          <span><strong>${user.followingCount}</strong> abonnements</span>
        </div>
        ${user.bio ? `<div class="profile-bio"><p>${escapeHtml(user.bio)}</p></div>` : ''}
      </div>
    </div>

    <div class="profile-tabs">
      <button class="profile-tab active" data-tab="posts">
        📷 Publications
      </button>
      ${isOwnProfile
        ? `<button class="profile-tab" data-tab="saved">
        🔖 Enregistrés
      </button>`
        : ''
      }
      <button class="profile-tab" data-tab="tagged">
        🏷 Identifié
      </button>
    </div>

    <div class="profile-grid">
      ${buildPostsGridHtml(user.posts, user.username)}
    </div>
  `;
}

/**
 * Lit le nom d'utilisateur demandé dans le hash (#/profile?user=...).
 * @return {?string} Nom d'utilisateur, ou null pour le profil connecté.
 */
function getRequestedUsername() {
  const queryString = window.location.hash.split('?')[1] || '';
  return new URLSearchParams(queryString).get('user');
}

/**
 * Monte la vue : récupère les données et installe les listeners.
 */
export async function mount() {
  const container = document.getElementById('profile-page');
  if (!container) return;

  try {
    const requestedUsername = getRequestedUsername();
    const currentUser = await getCurrentUser();
    const isOwnProfile =
      !requestedUsername || requestedUsername === currentUser.username;
    const user = isOwnProfile
      ? currentUser
      : await getUserProfile(requestedUsername);

    container.innerHTML = buildProfileHtml(user, isOwnProfile);

    // Compte privé consulté par un tiers : aucun contenu à rendre interactif.
    const {isPrivate} = getPrivacySettings();
    if (isPrivate && !isOwnProfile) return;

    if (!isOwnProfile) {
      // Le lien « Profil » du menu désigne le profil de l'utilisateur connecté.
      const profileNavLink = document.querySelector('.nav-menu .btn-nav[data-route="profile"]');
      if (profileNavLink) profileNavLink.classList.remove('active');
    }

    const bindPostThumbs = (posts) => {
      const thumbs = container.querySelectorAll('.profile-post-thumb');
      thumbs.forEach((thumb) => {
        thumb.style.cursor = 'pointer';
        thumb.addEventListener('click', () => {
          const postId = parseInt(thumb.dataset.postId, 10);
          const post = posts.find((item) => item.id === postId);
          if (post) showPostModal(post);
        });
      });
    };

    bindPostThumbs(user.posts);

    // Onglets du profil
    const tabs = container.querySelectorAll('.profile-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', async () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        let posts = user.posts;
        if (tab.dataset.tab === 'saved') {
          posts = await getSavedPosts();
        } else if (tab.dataset.tab === 'tagged') {
          posts = await getTaggedPosts(user.username);
        }

        const grid = container.querySelector('.profile-grid');
        grid.innerHTML = buildPostsGridHtml(posts, user.username);

        bindPostThumbs(posts);
      });
    });

    // Bouton "Modifier le profil"
    const editBtn = container.querySelector('.btn-edit-profile');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        window.location.hash = '#/edit-profile';
      });
    }

  } catch (error) {
    container.innerHTML = `<p class="error-message">Erreur lors du chargement du profil.</p>`;
    console.error('Erreur profil :', error);
  }
}
