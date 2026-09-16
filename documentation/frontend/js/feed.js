/**
 * @fileoverview Gestion de l'affichage du fil d'actualité et des interactions.
 * Fonctionne comme une "vue" importée par le routeur SPA.
 */

import {
  getFeedPosts,
  toggleLike,
  toggleDislike,
  sharePost,
  reportPost,
  addComment,
} from './api.js';

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
 * Génère le balisage HTML d'un commentaire.
 * @param {Object} comment Objet représentant le commentaire.
 * @return {string} Chaîne HTML du commentaire.
 */
function createCommentElement(comment) {
  return `
    <div class="comment-item" data-comment-id="${comment.id}">
      <span class="comment-author">${escapeHtml(comment.author)}</span>
      <span class="comment-text">${escapeHtml(comment.text)}</span>
      <button class="btn-comment-like" title="J'aime ce commentaire">👍</button>
      <button class="btn-comment-dislike" title="Je n'aime pas ce commentaire">👎</button>
    </div>
  `;
}

/**
 * Génère le balisage HTML d'une publication.
 * @param {Object} post Objet représentant la publication.
 * @return {string} Chaîne HTML du composant post-card.
 */
function createPostElement(post) {
  const mediaHtml = post.isVideo
    ? `<video controls src="${post.mediaUrl}"></video>`
    : `<img src="${post.mediaUrl}" alt="Publication de ${post.author}">`;

  const commentsHtml = post.comments.map(createCommentElement).join('');
  const commentsCount = post.comments.length;

  const likedClass = post.liked ? ' active' : '';
  const dislikedClass = post.disliked ? ' active' : '';

  return `
    <article class="post-card" data-post-id="${post.id}">
      <header class="post-header">
        <div class="post-user">
          <img src="${post.avatar}" alt="${post.author}" class="avatar">
          <span class="username">${escapeHtml(post.author)}</span>
        </div>
        <button class="btn-report" title="Signaler la publication">Signaler</button>
      </header>

      <div class="post-media-container">
        ${mediaHtml}
      </div>

      <div class="post-actions">
        <button class="action-btn btn-like${likedClass}" title="J'aime">
          <span class="action-icon">👍</span>
          <span class="like-count">${post.likesCount}</span>
        </button>
        <button class="action-btn btn-dislike${dislikedClass}" title="Je n'aime pas">
          <span class="action-icon">👎</span>
          <span class="dislike-count">${post.dislikesCount}</span>
        </button>
        <button class="action-btn btn-share" title="Partager">↗ Partager</button>
        <button class="action-btn btn-comments-toggle" title="Commentaires">
          💬 <span class="comments-count">${commentsCount}</span>
        </button>
      </div>

      <div class="post-body">
        <div class="post-likes"><span class="like-count">${post.likesCount}</span> J'aime</div>
        <p class="post-caption">
          <strong>${escapeHtml(post.author)}</strong> ${escapeHtml(post.caption)}
        </p>
        <button class="btn-view-comments">
          Voir les ${commentsCount} commentaire${commentsCount > 1 ? 's' : ''}
        </button>
        <time class="post-time">${post.createdAt}</time>
      </div>

      <section class="comments-section hidden">
        <div class="comments-list">
          ${commentsHtml}
        </div>
        <form class="comment-form" data-post-id="${post.id}">
          <input
            type="text"
            class="comment-input"
            placeholder="Ajouter un commentaire..."
            maxlength="500"
            required>
          <button type="submit" class="btn-send-comment">Publier</button>
        </form>
      </section>
    </article>
  `;
}

/**
 * Gère le clic sur le bouton "J'aime" d'une publication.
 * @param {HTMLElement} article Élément <article> de la publication.
 * @param {number} postId Identifiant de la publication.
 */
async function handleLike(article, postId) {
  const likeBtn = article.querySelector('.btn-like');
  const isCurrentlyLiked = likeBtn.classList.contains('active');
  const newLikedState = !isCurrentlyLiked;

  likeBtn.classList.toggle('active', newLikedState);
  likeBtn.disabled = true;

  try {
    const result = await toggleLike(postId, newLikedState);
    article.querySelector('.like-count').textContent = result.likesCount;
    const dislikeBtn = article.querySelector('.btn-dislike');
    dislikeBtn.classList.toggle('active', result.disliked);
    article.querySelector('.dislike-count').textContent = result.dislikesCount;
  } catch (error) {
    likeBtn.classList.toggle('active', isCurrentlyLiked);
    console.error('Erreur lors du like :', error);
  } finally {
    likeBtn.disabled = false;
  }
}

/**
 * Gère le clic sur le bouton "Je n'aime pas" d'une publication.
 * @param {HTMLElement} article Élément <article> de la publication.
 * @param {number} postId Identifiant de la publication.
 */
async function handleDislike(article, postId) {
  const dislikeBtn = article.querySelector('.btn-dislike');
  const isCurrentlyDisliked = dislikeBtn.classList.contains('active');
  const newDislikedState = !isCurrentlyDisliked;

  dislikeBtn.classList.toggle('active', newDislikedState);
  dislikeBtn.disabled = true;

  try {
    const result = await toggleDislike(postId, newDislikedState);
    article.querySelector('.dislike-count').textContent = result.dislikesCount;
    const likeBtn = article.querySelector('.btn-like');
    likeBtn.classList.toggle('active', result.liked);
    article.querySelector('.like-count').textContent = result.likesCount;
  } catch (error) {
    dislikeBtn.classList.toggle('active', isCurrentlyDisliked);
    console.error('Erreur lors du dislike :', error);
  } finally {
    dislikeBtn.disabled = false;
  }
}

/**
 * Gère le clic sur le bouton "Partager" d'une publication.
 * @param {number} postId Identifiant de la publication.
 */
async function handleShare(postId) {
  try {
    const result = await sharePost(postId);
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(result.shareUrl);
    }
    showNotification('Lien copié dans le presse-papiers !');
  } catch (error) {
    console.error('Erreur lors du partage :', error);
    showNotification('Échec du partage', true);
  }
}

/**
 * Gère le clic sur le bouton "Signaler" d'une publication.
 * @param {HTMLElement} article Élément <article> de la publication.
 * @param {number} postId Identifiant de la publication.
 */
async function handleReport(article, postId) {
  const reasons = [
    'Contenu inapproprié',
    'Spam ou arnaque',
    'Harcèlement ou discours haineux',
    'Faux compte ou usurpation d\'identité',
  ];

  const overlay = document.createElement('div');
  overlay.className = 'report-overlay';
  overlay.innerHTML = `
    <div class="report-dialog">
      <h3>Signaler cette publication</h3>
      <p class="report-subtitle">Indiquez le motif du signalement :</p>
      <div class="report-reasons">
        ${reasons
          .map(
            (reason, index) => `
          <label class="report-reason">
            <input type="radio" name="report-reason" value="${escapeHtml(reason)}" ${index === 0 ? 'checked' : ''}>
            <span>${escapeHtml(reason)}</span>
          </label>
        `,
          )
          .join('')}
      </div>
      <div class="report-actions">
        <button class="btn-report-cancel">Annuler</button>
        <button class="btn-report-confirm">Confirmer le signalement</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeDialog = () => overlay.remove();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDialog();
  });

  overlay.querySelector('.btn-report-cancel').addEventListener('click', closeDialog);

  overlay.querySelector('.btn-report-confirm').addEventListener('click', async () => {
    const selectedReason = overlay.querySelector(
      'input[name="report-reason"]:checked',
    ).value;

    closeDialog();

    try {
      await reportPost(postId, selectedReason);
      showNotification('Publication signalée. Merci pour votre contribution.');
      article.querySelector('.btn-report').textContent = 'Signalée ✓';
      article.querySelector('.btn-report').disabled = true;
    } catch (error) {
      console.error('Erreur lors du signalement :', error);
      showNotification('Échec du signalement', true);
    }
  });
}

/**
 * Affiche ou masque la section des commentaires d'une publication.
 * @param {HTMLElement} article Élément <article> de la publication.
 */
function toggleComments(article) {
  const section = article.querySelector('.comments-section');
  section.classList.toggle('hidden');
}

/**
 * Gère la soumission du formulaire d'ajout de commentaire.
 * @param {HTMLElement} article Élément <article> de la publication.
 * @param {number} postId Identifiant de la publication.
 * @param {string} text Contenu du commentaire.
 */
async function handleAddComment(article, postId, text) {
  const form = article.querySelector('.comment-form');
  const input = article.querySelector('.comment-input');
  const commentsList = article.querySelector('.comments-list');
  const countSpan = article.querySelector('.comments-count');

  form.querySelector('.btn-send-comment').disabled = true;

  try {
    const newComment = await addComment(postId, text);
    const commentHtml = createCommentElement(newComment);
    commentsList.insertAdjacentHTML('beforeend', commentHtml);

    const currentCount = parseInt(countSpan.textContent, 10) || 0;
    const newCount = currentCount + 1;
    countSpan.textContent = newCount;

    const viewBtn = article.querySelector('.btn-view-comments');
    if (viewBtn) {
      viewBtn.textContent = `Voir les ${newCount} commentaire${newCount > 1 ? 's' : ''}`;
    }

    input.value = '';
  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire :', error);
    showNotification('Échec de l\'ajout du commentaire', true);
  } finally {
    form.querySelector('.btn-send-comment').disabled = false;
  }
}

/**
 * Affiche une notification temporaire à l'utilisateur.
 * @param {string} message Message à afficher.
 * @param {boolean} isError Indique s'il s'agit d'une erreur.
 */
function showNotification(message, isError = false) {
  const notif = document.createElement('div');
  notif.className = `toast-notification${isError ? ' toast-error' : ''}`;
  notif.textContent = message;
  document.body.appendChild(notif);

  requestAnimationFrame(() => notif.classList.add('toast-visible'));

  setTimeout(() => {
    notif.classList.remove('toast-visible');
    notif.addEventListener('transitionend', () => notif.remove(), {
      once: true,
    });
  }, 3000);
}

/**
 * Met en place la délégation d'événements sur le conteneur des publications.
 * @param {HTMLElement} container Élément conteneur des publications.
 */
function setupEventDelegation(container) {
  container.addEventListener('click', async (event) => {
    const article = event.target.closest('.post-card');
    if (!article) return;

    const postId = parseInt(article.dataset.postId, 10);

    if (event.target.closest('.btn-like')) {
      handleLike(article, postId);
      return;
    }

    if (event.target.closest('.btn-dislike')) {
      handleDislike(article, postId);
      return;
    }

    if (event.target.closest('.btn-share')) {
      handleShare(postId);
      return;
    }

    if (event.target.closest('.btn-report')) {
      handleReport(article, postId);
      return;
    }

    if (
      event.target.closest('.btn-comments-toggle') ||
      event.target.closest('.btn-view-comments')
    ) {
      toggleComments(article);
      return;
    }

    if (event.target.closest('.btn-comment-like')) {
      event.target.closest('.btn-comment-like').classList.toggle('active');
      return;
    }

    if (event.target.closest('.btn-comment-dislike')) {
      event.target.closest('.btn-comment-dislike').classList.toggle('active');
      return;
    }
  });

  container.addEventListener('submit', (event) => {
    if (!event.target.classList.contains('comment-form')) return;

    event.preventDefault();
    const article = event.target.closest('.post-card');
    const postId = parseInt(article.dataset.postId, 10);
    const input = event.target.querySelector('.comment-input');
    const text = input.value.trim();

    if (text) {
      handleAddComment(article, postId, text);
    }
  });
}

/**
 * Rend le squelette HTML de la vue Fil d'actualité.
 * @return {string} HTML de la vue.
 */
export function render() {
  return `<div class="feed-container"><section id="posts-container" class="posts-list"></section></div>`;
}

/**
 * Monte la vue : récupère les publications et installe les listeners.
 */
export async function mount() {
  const container = document.getElementById('posts-container');
  if (!container) return;

  const posts = await getFeedPosts();
  container.innerHTML = posts.map(createPostElement).join('');

  setupEventDelegation(container);
}
