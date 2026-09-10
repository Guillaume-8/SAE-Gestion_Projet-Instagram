/**
 * @fileoverview Gestion de l'affichage du fil d'actualité.
 */

import { getFeedPosts } from './api.js';

/**
 * Génère le balisage HTML d'une publication.
 * @param {Object} post Objet représentant la publication.
 * @return {string} Chaîne HTML du composant post-card.
 */
function createPostElement(post) {
  const mediaHtml = post.isVideo
    ? `<video controls src="${post.mediaUrl}"></video>`
    : `<img src="${post.mediaUrl}" alt="Publication de ${post.author}">`;

  return `
    <article class="post-card" data-post-id="${post.id}">
      <header class="post-header">
        <div class="post-user">
          <img src="${post.avatar}" alt="${post.author}" class="avatar">
          <span class="username">${post.author}</span>
        </div>
        <button class="btn-report" title="Signaler la publication">Signaler</button>
      </header>

      <div class="post-media-container">
        ${mediaHtml}
      </div>

      <div class="post-actions">
        <button class="action-btn btn-like">👍 ${post.likesCount}</button>
        <button class="action-btn btn-dislike">👎 ${post.dislikesCount}</button>
        <button class="action-btn btn-share">↗ Partager</button>
      </div>

      <div class="post-body">
        <div class="post-likes">${post.likesCount} J'aime</div>
        <p class="post-caption"><strong>${post.author}</strong> ${post.caption}</p>
        <time class="post-time">${post.createdAt}</time>
      </div>
    </article>
  `;
}

/**
 * Initialise et injecte les publications dans le DOM.
 */
async function initFeed() {
  const container = document.getElementById('posts-container');
  if (!container) return;

  const posts = await getFeedPosts();
  container.innerHTML = posts.map(createPostElement).join('');
}

document.addEventListener('DOMContentLoaded', initFeed);
