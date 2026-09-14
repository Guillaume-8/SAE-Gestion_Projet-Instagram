/**
 * @fileoverview Service d'interaction avec l'API REST.
 * Conforme au Google Coding Style (ES6 Modules).
 */

import {
  MOCK_POSTS,
  MOCK_USER,
  MOCK_CONVERSATIONS,
  MOCK_TRENDING_POSTS,
  MOCK_HASHTAGS,
  MOCK_SAVED_POSTS,
} from './mock-data.js';

const USE_MOCK = true;
const API_BASE_URL = '/api';

// ============================================================
//  FIL D'ACTUALITÉ
// ============================================================

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
    if (!response.ok) throw new Error(`Erreur réseau: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de récupération des publications :', error);
    return [];
  }
}

/**
 * Récupère les publications enregistrées de l'utilisateur.
 * @return {Promise<Array<Object>>} Liste des publications enregistrées.
 */
export async function getSavedPosts() {
  if (USE_MOCK) {
    return Promise.resolve(structuredClone(MOCK_SAVED_POSTS));
  }
  try {
    const response = await fetch(`${API_BASE_URL}/users/me/saved`);
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de récupération des publications enregistrées :', error);
    return [];
  }
}

/**
 * Crée une nouvelle publication.
 * @param {Object} postData Données de la publication.
 * @return {Promise<Object>} La publication créée.
 */
export async function createPost(postData) {
  if (USE_MOCK) {
    const newPost = {
      id: Date.now(),
      author: MOCK_USER.username,
      avatar: MOCK_USER.avatar,
      mediaUrl: postData.mediaFile
        ? URL.createObjectURL(postData.mediaFile)
        : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
      isVideo: postData.mediaType === 'video',
      caption: postData.caption,
      likesCount: 0,
      dislikesCount: 0,
      visibility: postData.visibility,
      comments: [],
      createdAt: "À l'instant",
    };
    MOCK_POSTS.unshift(newPost);
    return Promise.resolve(newPost);
  }
  try {
    const formData = new FormData();
    formData.append('media', postData.mediaFile);
    formData.append('caption', postData.caption);
    formData.append('visibility', postData.visibility);
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de la création de publication :', error);
    throw error;
  }
}

/**
 * Bascule le statut "j'aime" d'une publication.
 * @param {number} postId Identifiant de la publication.
 * @param {boolean} liked État souhaité.
 * @return {Promise<Object>} Nouvel état.
 */
export async function toggleLike(postId, liked) {
  if (USE_MOCK) {
    const post = MOCK_POSTS.find((p) => p.id === postId);
    if (!post) throw new Error('Publication introuvable');
    if (liked) {
      post.likesCount++;
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
 * @param {boolean} disliked État souhaité.
 * @return {Promise<Object>} Nouvel état.
 */
export async function toggleDislike(postId, disliked) {
  if (USE_MOCK) {
    const post = MOCK_POSTS.find((p) => p.id === postId);
    if (!post) throw new Error('Publication introuvable');
    if (disliked) {
      post.dislikesCount++;
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
 * @param {number} postId Identifiant de la publication.
 * @return {Promise<Object>} Résultat du partage.
 */
export async function sharePost(postId) {
  if (USE_MOCK) {
    return Promise.resolve({
      success: true,
      shareUrl: `${window.location.origin}/post/${postId}`,
    });
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
 * Signale une publication.
 * @param {number} postId Identifiant de la publication.
 * @param {string} reason Motif du signalement.
 * @return {Promise<Object>} Résultat du signalement.
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
      text: text,
      createdAt: "À l'instant",
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
    console.error("Échec de l'ajout de commentaire :", error);
    throw error;
  }
}

// ============================================================
//  AUTHENTIFICATION
// ============================================================

/**
 * Connecte un utilisateur.
 * @param {string} username Nom d'utilisateur.
 * @param {string} password Mot de passe.
 * @return {Promise<Object>} Utilisateur connecté.
 */
export async function loginUser(username, password) {
  if (USE_MOCK) {
    if (!username || !password) {
      throw new Error('Veuillez remplir tous les champs');
    }
    return Promise.resolve({
      success: true,
      user: {
        id: MOCK_USER.id,
        username: MOCK_USER.username,
        avatar: MOCK_USER.avatar,
      },
    });
  }
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username, password}),
    });
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de la connexion :', error);
    throw error;
  }
}

/**
 * Inscrit un nouvel utilisateur.
 * @param {string} username Nom d'utilisateur.
 * @param {string} email Adresse email.
 * @param {string} password Mot de passe.
 * @return {Promise<Object>} Utilisateur créé.
 */
export async function registerUser(username, email, password) {
  if (USE_MOCK) {
    if (!username || !email || !password) {
      throw new Error('Veuillez remplir tous les champs');
    }
    return Promise.resolve({
      success: true,
      user: {id: Date.now(), username, avatar: MOCK_USER.avatar},
    });
  }
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username, email, password}),
    });
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Échec de l'inscription :", error);
    throw error;
  }
}

// ============================================================
//  PROFIL
// ============================================================

/**
 * Récupère le profil de l'utilisateur connecté.
 * @return {Promise<Object>} Données du profil.
 */
export async function getCurrentUser() {
  if (USE_MOCK) {
    return Promise.resolve(structuredClone(MOCK_USER));
  }
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`);
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de récupération du profil :', error);
    throw error;
  }
}

// ============================================================
//  TENDANCES / EXPLORER
// ============================================================

/**
 * Récupère les publications tendance.
 * @return {Promise<Array<Object>>} Liste des publications tendance.
 */
export async function getTrendingPosts() {
  if (USE_MOCK) {
    return Promise.resolve(structuredClone(MOCK_TRENDING_POSTS));
  }
  try {
    const response = await fetch(`${API_BASE_URL}/posts/trending`);
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de récupération des tendances :', error);
    return [];
  }
}

/**
 * Récupère les hashtags populaires.
 * @return {Promise<Array<Object>>} Liste des hashtags.
 */
export async function getHashtags() {
  if (USE_MOCK) {
    return Promise.resolve(structuredClone(MOCK_HASHTAGS));
  }
  try {
    const response = await fetch(`${API_BASE_URL}/hashtags/trending`);
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de récupération des hashtags :', error);
    return [];
  }
}

// ============================================================
//  MESSAGERIE
// ============================================================

/**
 * Récupère la liste des conversations.
 * @return {Promise<Array<Object>>} Liste des conversations.
 */
export async function getConversations() {
  if (USE_MOCK) {
    return Promise.resolve(structuredClone(MOCK_CONVERSATIONS));
  }
  try {
    const response = await fetch(`${API_BASE_URL}/messages/conversations`);
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de récupération des conversations :', error);
    return [];
  }
}

/**
 * Envoie un message dans une conversation.
 * @param {number} conversationId Identifiant de la conversation.
 * @param {string} text Contenu du message.
 * @return {Promise<Object>} Le message envoyé.
 */
export async function sendMessage(conversationId, text) {
  if (USE_MOCK) {
    const conv = MOCK_CONVERSATIONS.find((c) => c.id === conversationId);
    if (!conv) throw new Error('Conversation introuvable');
    const newMessage = {
      id: Date.now(),
      sender: 'me',
      text: text,
      createdAt: "À l'instant",
    };
    conv.messages.push(newMessage);
    return Promise.resolve(newMessage);
  }
  try {
    const response = await fetch(
      `${API_BASE_URL}/messages/conversations/${conversationId}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text}),
      },
    );
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Échec de l'envoi du message :", error);
    throw error;
  }
}
