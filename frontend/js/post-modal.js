/**
 * @fileoverview Modal pour afficher les détails d'une publication.
 */

import { toggleLike, toggleDislike, toggleSavedPost, sharePost, republishPost, reportPost, getPostById } from './api.js';
import { attachMediaFallback } from './media-fallback.js';

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
 * Construit le lien vers le profil d'un utilisateur.
 * @param {string} username Nom d'utilisateur.
 * @return {string} Hash de la route du profil.
 */
function getProfileHref(username) {
  return `#/profile?user=${encodeURIComponent(username)}`;
}

/**
 * Génère le HTML d'un commentaire du modal.
 * @param {Object} comment Données du commentaire.
 * @return {string} HTML du commentaire.
 */
function createModalCommentHtml(comment) {
  return `
    <div class="modal-comment" data-comment-id="${comment.id}">
      <a class="comment-author" href="${getProfileHref(comment.author)}">${escapeHtml(comment.author)}</a>
      <span class="comment-text">${escapeHtml(comment.text)}</span>
      <div class="comment-actions">
        <button class="btn-comment-like" data-comment-id="${comment.id}" title="J'aime">👍</button>
        <button class="btn-comment-dislike" data-comment-id="${comment.id}" title="Je n'aime pas">👎</button>
        <button class="btn-comment-report" data-comment-id="${comment.id}" title="Signaler">🚩</button>
      </div>
    </div>
  `;
}

/**
 * Ouvre le modal avec les détails d'une publication.
 * @param {Object} post Données de la publication.
 */
let modalOpenToken = 0;

export function showPostModal(partialPost) {
  // Protection anti-doublon : si un modal est déjà ouvert, on le ferme
  // d'abord. Cela évite les empilements quand on clique rapidement
  // sur plusieurs publications (IDs dupliqués, listeners qui
  // s'accumulent, impression de freeze).
  const existing = document.getElementById('post-modal-overlay');
  if (existing) {
    existing.remove();
  }

  const myToken = ++modalOpenToken;

  // Fetch full post data — profile/explore pass partial objects
  // (id/mediaUrl only) that lack comments, caption, likesCount, etc.
  // Falls back to the partial data if the fetch fails.
  getPostById(partialPost.id)
    .then((freshPost) => {
      if (myToken !== modalOpenToken) return;
      renderModal(freshPost);
    })
    .catch((error) => {
      if (myToken !== modalOpenToken) return;
      console.error('Impossible de récupérer le post complet:', error);
      renderModal(partialPost);
    });
}

/**
 * Génère et insère le HTML du modal avec les données complètes du post.
 * @param {Object} post Données complètes de la publication.
 */
function renderModal(post) {
  // Crée le HTML du modal
  const modalHtml = `
    <div class="post-modal-overlay" id="post-modal-overlay">
      <div class="post-modal-content" id="post-modal-content">
        <button class="post-modal-close" id="post-modal-close" title="Fermer">✕</button>
        
        <div class="post-modal-body">
          <div class="post-modal-media">
            ${post.isVideo
              ? `<video controls src="${post.mediaUrl}" class="modal-media"></video>`
              : `<img src="${post.mediaUrl}" alt="Publication" class="modal-media">`
            }
          </div>
          
          <div class="post-modal-sidebar">
            <div class="post-modal-header">
              ${post.author
                ? `<a class="modal-user-link" href="${getProfileHref(post.author)}" title="Voir le profil de ${escapeHtml(post.author)}">
                    <img src="${post.avatar || ''}" alt="${escapeHtml(post.author)}" class="modal-avatar">
                    <span class="modal-author">${escapeHtml(post.author)}</span>
                  </a>`
                : ''
              }
            </div>

            <div class="post-modal-caption">
              <p>${escapeHtml(post.caption || '')}</p>
            </div>

            <div class="post-modal-comments" id="post-modal-comments">
              ${(post.comments || []).map(createModalCommentHtml).join('')}
            </div>
            
            <div class="post-modal-actions">
              <button class="btn-modal-like" data-post-id="${post.id}" title="J'aime">
                ❤️ <span class="modal-like-count">${post.likesCount || 0}</span>
              </button>
              <button class="btn-modal-dislike" data-post-id="${post.id}" title="Je n'aime pas">
                👎 <span class="modal-dislike-count">${post.dislikesCount || 0}</span>
              </button>
              <button class="btn-modal-save${post.saved ? ' active' : ''}" data-post-id="${post.id}" title="Enregistrer">
                🔖 Enregistrer
              </button>
              <button class="btn-modal-republish" data-post-id="${post.id}" title="Republier">
                🔄 Republier
              </button>
              <button class="btn-modal-report" data-post-id="${post.id}" title="Signaler">
                🚩 Signaler
              </button>
            </div>
            
            <div class="post-modal-meta">
              <span>${escapeHtml(post.createdAt || '')}</span>
              <span>${post.visibility || ''}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Ajoute le modal au DOM
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Dégradé de remplacement si le média local est manquant
  const modalContent = document.getElementById('post-modal-content');
  if (modalContent) attachMediaFallback(modalContent);
  
  // Fonction pour mettre à jour le modal avec les données fraîches
  async function updateModalData() {
    try {
      const freshPost = await getPostById(post.id);
      post = freshPost;
      
      // Mettre à jour les compteurs
      const likeCountSpan = document.querySelector('.modal-like-count');
      const dislikeCountSpan = document.querySelector('.modal-dislike-count');
      if (likeCountSpan) likeCountSpan.textContent = post.likesCount;
      if (dislikeCountSpan) dislikeCountSpan.textContent = post.dislikesCount;
      
      // Mettre à jour les états des boutons like/dislike
      const likeBtn = document.querySelector('.btn-modal-like');
      const dislikeBtn = document.querySelector('.btn-modal-dislike');
      const saveBtn = document.querySelector('.btn-modal-save');
      if (likeBtn) likeBtn.classList.toggle('active', post.liked);
      if (dislikeBtn) dislikeBtn.classList.toggle('active', post.disliked);
      if (saveBtn) saveBtn.classList.toggle('active', post.saved);
      
      // Mettre à jour les commentaires
      const commentsContainer = document.getElementById('post-modal-comments');
      if (commentsContainer) {
        commentsContainer.innerHTML = (post.comments || []).map(createModalCommentHtml).join('');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du modal:', error);
    }
  }
  
  // Fermer le modal au clic sur le fond
  const overlay = document.getElementById('post-modal-overlay');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closePostModal();
    }
  });
  
  // Fermer le modal au clic sur le bouton X
  document.getElementById('post-modal-close').addEventListener('click', closePostModal);
  
  // Fermer au clavier (Escape)
  document.addEventListener('keydown', handleEscapeKey);

  // Fermer lors d'un changement de page (ex. clic sur un profil) :
  // le modal est attaché au <body> et survivrait sinon au changement de vue.
  window.addEventListener('hashchange', closePostModal);
  
  // Event listeners pour les boutons d'actions
  document.getElementById('post-modal-content').addEventListener('click', async (e) => {
    const likeBtn = e.target.closest('.btn-modal-like');
    const dislikeBtn = e.target.closest('.btn-modal-dislike');
    const saveBtn = e.target.closest('.btn-modal-save');
    const republishBtn = e.target.closest('.btn-modal-republish');
    const reportBtn = e.target.closest('.btn-modal-report');
    const commentLikeBtn = e.target.closest('.btn-comment-like');
    const commentDislikeBtn = e.target.closest('.btn-comment-dislike');
    const commentReportBtn = e.target.closest('.btn-comment-report');
    
    if (likeBtn) {
      try {
        const newLikeState = !post.liked;
        await toggleLike(post.id, newLikeState);
        await updateModalData();
      } catch (error) {
        console.error('Erreur like:', error);
      }
    }
    
    if (dislikeBtn) {
      try {
        const newDislikeState = !post.disliked;
        await toggleDislike(post.id, newDislikeState);
        await updateModalData();
      } catch (error) {
        console.error('Erreur dislike:', error);
      }
    }
    
    if (saveBtn) {
      try {
        const saved = !saveBtn.classList.contains('active');
        await toggleSavedPost(post.id, saved);
        saveBtn.classList.toggle('active', saved);
        post.saved = saved;
        window.dispatchEvent(
          new CustomEvent('saved-post-changed', {
            detail: {postId: post.id, saved},
          }),
        );
      } catch (error) {
        console.error("Erreur lors de l'enregistrement :", error);
      }
    }

    if (republishBtn) {
      try {
        await republishPost(post.id);
        alert('Publication republié avec succès !');
        await updateModalData();
      } catch (error) {
        console.error('Erreur republication:', error);
      }
    }
    
    if (reportBtn) {
      try {
        await reportPost(post.id, 'Signalement depuis le modal');
        alert('Publication signalée!');
      } catch (error) {
        console.error('Erreur signalement:', error);
      }
    }
    
    // Actions sur les commentaires
    if (commentLikeBtn) {
      const commentId = parseInt(commentLikeBtn.dataset.commentId);
      const comment = post.comments.find(c => c.id === commentId);
      if (comment) {
        comment.liked = !comment.liked;
        if (comment.liked) {
          comment.likesCount = (comment.likesCount || 0) + 1;
          commentLikeBtn.style.opacity = '1';
        } else {
          comment.likesCount = Math.max(0, (comment.likesCount || 1) - 1);
          commentLikeBtn.style.opacity = '0.6';
        }
      }
    }
    
    if (commentDislikeBtn) {
      const commentId = parseInt(commentDislikeBtn.dataset.commentId);
      const comment = post.comments.find(c => c.id === commentId);
      if (comment) {
        comment.disliked = !comment.disliked;
        if (comment.disliked) {
          comment.dislikesCount = (comment.dislikesCount || 0) + 1;
          commentDislikeBtn.style.opacity = '1';
        } else {
          comment.dislikesCount = Math.max(0, (comment.dislikesCount || 1) - 1);
          commentDislikeBtn.style.opacity = '0.6';
        }
      }
    }
    
    if (commentReportBtn) {
      const commentId = parseInt(commentReportBtn.dataset.commentId);
      await reportPost(post.id, `Signalement de commentaire #${commentId}`);
      alert('Commentaire signalé!');
    }
  });
}

/**
 * Ferme le modal.
 */
export function closePostModal() {
  const modal = document.getElementById('post-modal-overlay');
  if (modal) {
    modal.remove();
    // Nettoyer les écouteurs globaux
    document.removeEventListener('keydown', handleEscapeKey);
    window.removeEventListener('hashchange', closePostModal);
  }
}

/**
 * Gestionnaire pour la touche Escape.
 * @param {KeyboardEvent} event Événement clavier.
 */
function handleEscapeKey(event) {
  if (event.key === 'Escape') {
    closePostModal();
  }
}
