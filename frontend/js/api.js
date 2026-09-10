/**
 * @fileoverview Service d'interaction avec l'API REST.
 * Conforme au Google Coding Style (ES6 Modules).
 */

import { MOCK_POSTS } from './mock-data.js';

const USE_MOCK = true;
const API_BASE_URL = '/api';

/**
 * Récupère le fil d'actualité.
 * @return {Promise<Array<Object>>} Liste des publications.
 */
export async function getFeedPosts() {
  if (USE_MOCK) {
    return Promise.resolve(structuredClone(MOCK_POSTS));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/posts`);
    if (!response.ok) {
      throw new Error(`Erreur réseau: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Échec de récupération des publications :', error);
    return [];
  }
}

/**
 * Bascule le statut "j'aime" d'une publication.
 * @param {number} postId Identifiant de la publication.
 * @param {boolean} liked État souhaité (true = aimer, false = ne plus aimer).
 * @return {Promise<{likesCount: number, liked: boolean}>} Nouvel état.
 */
export async function toggleLike(postId, liked) {
  if (USE_MOCK) {
    const post = MOCK_POSTS.find((p) => p.id === postId);
    if (!post) throw new Error('Publication introuvable');

    if (liked) {
      post.likesCount++;
      // Si l'utilisateur avait disliké, on retire le dislike
      if (post.disliked) {
        post.dislikesCount = Math.max(0, post.dislikesCount - 1);
        post.disliked = false;
      }
      post.liked = true;
    } else {
      post.likesCount = Math.max(0, post.likesCount - 1);
      post.liked = false;
    }
    return Promise.resolve({
      likesCount: post.likesCount,
      liked: post.liked,
      dislikesCount: post.dislikesCount,
      disliked: post.disliked,
    });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({liked}),
    });
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec du like :', error);
    throw error;
  }
}

/**
 * Bascule le statut "je n'aime pas" d'une publication.
 * @param {number} postId Identifiant de la publication.
 * @param {boolean} disliked État souhaité (true = ne pas aimer, false = retirer).
 * @return {Promise<{dislikesCount: number, disliked: boolean}>} Nouvel état.
 */
export async function toggleDislike(postId, disliked) {
  if (USE_MOCK) {
    const post = MOCK_POSTS.find((p) => p.id === postId);
    if (!post) throw new Error('Publication introuvable');

    if (disliked) {
      post.dislikesCount++;
      // Si l'utilisateur avait liké, on retire le like
      if (post.liked) {
        post.likesCount = Math.max(0, post.likesCount - 1);
        post.liked = false;
      }
      post.disliked = true;
    } else {
      post.dislikesCount = Math.max(0, post.dislikesCount - 1);
      post.disliked = false;
    }
    return Promise.resolve({
      likesCount: post.likesCount,
      liked: post.liked,
      dislikesCount: post.dislikesCount,
      disliked: post.disliked,
    });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/dislike`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({disliked}),
    });
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec du dislike :', error);
    throw error;
  }
}

/**
 * Repartage une publication.
 * @param {number} postId Identifiant de la publication à repartager.
 * @return {Promise<{success: boolean, shareUrl: string}>} Résultat du partage.
 */
export async function sharePost(postId) {
  if (USE_MOCK) {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    return Promise.resolve({success: true, shareUrl});
  }

  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/share`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec du partage :', error);
    throw error;
  }
}

/**
 * Signale une publication auprès de l'administration.
 * @param {number} postId Identifiant de la publication signalée.
 * @param {string} reason Motif du signalement.
 * @return {Promise<{success: boolean}>} Résultat du signalement.
 */
export async function reportPost(postId, reason) {
  if (USE_MOCK) {
    console.info(`[MOCK] Publication ${postId} signalée : ${reason}`);
    return Promise.resolve({success: true});
  }

  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/report`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({reason}),
    });
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec du signalement :', error);
    throw error;
  }
}

/**
 * Récupère les commentaires d'une publication.
 * @param {number} postId Identifiant de la publication.
 * @return {Promise<Array<Object>>} Liste des commentaires.
 */
export async function getComments(postId) {
  if (USE_MOCK) {
    const post = MOCK_POSTS.find((p) => p.id === postId);
    return Promise.resolve(post ? structuredClone(post.comments) : []);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de récupération des commentaires :', error);
    return [];
  }
}

/**
 * Ajoute un commentaire à une publication.
 * @param {number} postId Identifiant de la publication.
 * @param {string} text Contenu du commentaire.
 * @return {Promise<Object>} Le commentaire créé.
 */
export async function addComment(postId, text) {
  if (USE_MOCK) {
    const post = MOCK_POSTS.find((p) => p.id === postId);
    if (!post) throw new Error('Publication introuvable');

    const newComment = {
      id: Date.now(),
      author: 'moi',
      text,
      createdAt: 'À l\'instant',
    };
    post.comments.push(newComment);
    return Promise.resolve(newComment);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({text}),
    });
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de l\'ajout de commentaire :', error);
    throw error;
  }
}
