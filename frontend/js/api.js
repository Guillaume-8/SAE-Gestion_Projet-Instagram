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
  MOCK_REPORTS,
} from './mock-data.js';

const USE_MOCK = true;
const API_BASE_URL = '/api';

// Variable globale pour stocker l'utilisateur actuellement connecté
let currentUser = structuredClone(MOCK_USER);

/**
 * Indique si une publication signalée peut être montrée à l'utilisateur courant.
 *
 * Une publication signalée (automatiquement par l'analyse d'image, ou par un
 * utilisateur) reste visible pour son auteur et pour les modérateurs, mais
 * disparaît pour tous les autres tant qu'un modérateur ne l'a pas approuvée.
 *
 * @param {Object} post Publication à filtrer.
 * @return {boolean} true si la publication peut être affichée.
 */
function isVisibleToCurrentUser(post) {
  if (post.moderationStatus !== 'pending' && post.moderationStatus !== 'rejected') {
    return true;
  }
  return currentUser.isModerator === true || post.author === currentUser.username;
}

/**
 * Enregistre un signalement et masque la publication en attendant un modérateur.
 *
 * @param {Object} post Publication concernée.
 * @param {string} reason Motif affiché au modérateur.
 * @param {Object=} details Informations complémentaires (zones détectées…).
 * @return {Object} Le signalement créé.
 */
function addReport(post, reason, details = {}) {
  post.moderationStatus = 'pending';
  const report = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    postId: post.id,
    postAuthor: post.author,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...details,
  };
  MOCK_REPORTS.push(report);
  return report;
}

// ============================================================
//  FIL D'ACTUALITÉ
// ============================================================

/**
 * Récupère le fil d'actualité.
 * @return {Promise<Array<Object>>} Liste des publications.
 */
export async function getFeedPosts() {
  if (USE_MOCK) {
    return Promise.resolve(
      structuredClone(
        MOCK_POSTS.filter(isVisibleToCurrentUser).map((post) => ({
          ...post,
          saved: MOCK_SAVED_POSTS.some((savedPost) => savedPost.id === post.id),
        })),
      ),
    );
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
    return Promise.resolve(
      structuredClone(
        MOCK_SAVED_POSTS.filter(isVisibleToCurrentUser)
          .map((post) => ({...post, saved: true})),
      ),
    );
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
 * Récupère les publications qui mentionnent l'utilisateur connecté.
 * @param {string} username Nom d'utilisateur à rechercher.
 * @return {Promise<Array<Object>>} Publications mentionnant l'utilisateur.
 */
export async function getTaggedPosts(username) {
  if (USE_MOCK) {
    const mention = new RegExp(`(^|\\s)@${username}(?=\\s|$|[.,!?])`, 'i');
    return Promise.resolve(
      structuredClone(
        MOCK_POSTS.filter(
          (post) => mention.test(post.caption || '') && isVisibleToCurrentUser(post),
        ),
      ),
    );
  }
  try {
    const response = await fetch(
      `${API_BASE_URL}/users/${encodeURIComponent(username)}/tagged`,
    );
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de récupération des publications identifiées :', error);
    return [];
  }
}

/**
 * Enregistre ou retire une publication des publications enregistrées.
 * @param {number} postId Identifiant de la publication.
 * @param {boolean} saved État souhaité.
 * @return {Promise<Object>} Nouvel état d'enregistrement.
 */
export async function toggleSavedPost(postId, saved) {
  if (USE_MOCK) {
    const post = MOCK_POSTS.find((item) => item.id === postId);
    const savedIndex = MOCK_SAVED_POSTS.findIndex((item) => item.id === postId);

    if (saved && savedIndex === -1) {
      const source = post || currentUser.posts.find((item) => item.id === postId);
      if (!source) throw new Error('Publication introuvable');
      MOCK_SAVED_POSTS.push(structuredClone(source));
    } else if (!saved && savedIndex !== -1) {
      MOCK_SAVED_POSTS.splice(savedIndex, 1);
    }

    if (post) post.saved = saved;
    return Promise.resolve({saved});
  }
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/saved`, {
      method: saved ? 'POST' : 'DELETE',
    });
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Échec de l'enregistrement de la publication :", error);
    throw error;
  }
}

/**
 * Crée une nouvelle publication.
 *
 * Si l'analyse d'image a repéré quelque chose (voir js/moderation.js), la
 * publication est créée quand même mais signalée automatiquement : elle n'est
 * alors visible que par son auteur et les modérateurs (voir addReport).
 *
 * @param {Object} postData Données de la publication.
 * @param {Array<Object>=} postData.moderationDetections Zones repérées à
 *     l'analyse ; une liste non vide déclenche le signalement automatique.
 * @return {Promise<Object>} La publication créée.
 */
export async function createPost(postData) {
  if (USE_MOCK) {
    const detections = postData.moderationDetections || [];
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
    if (detections.length > 0) {
      addReport(newPost, 'Détection automatique à la publication', {
        automatic: true,
        labels: detections.map((zone) => zone.label),
      });
    }
    MOCK_POSTS.unshift(newPost);
    return Promise.resolve(newPost);
  }
  try {
    const formData = new FormData();
    formData.append('media', postData.mediaFile);
    formData.append('caption', postData.caption);
    formData.append('visibility', postData.visibility);
    // Le serveur doit refaire l'analyse de son côté : ce champ n'est qu'une
    // indication, un client modifié pourrait l'omettre.
    formData.append(
      'moderationLabels',
      JSON.stringify((postData.moderationDetections || []).map((z) => z.label)),
    );
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
    const post = MOCK_POSTS.find((p) => p.id === postId);
    if (!post) throw new Error('Publication introuvable');
    const report = addReport(post, reason, {
      automatic: false,
      reportedBy: currentUser.username,
    });
    console.info('[MOCK] Signalement enregistré :', report);
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
      author: currentUser.username,
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
export async function registerUser(username, name, password, email) {
  if (USE_MOCK) {
    if (!username || !name || !password) {
      throw new Error('Veuillez remplir tous les champs');
    }
    currentUser.username = username;
    currentUser.avatar = MOCK_USER.avatar;
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
    return Promise.resolve(structuredClone(currentUser));
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

/**
 * Récupère le profil public d'un utilisateur à partir de son nom d'utilisateur.
 * @param {string} username Nom d'utilisateur.
 * @return {Promise<Object>} Données du profil.
 */
export async function getUserProfile(username) {
  if (USE_MOCK) {
    const authoredPosts = [...MOCK_POSTS, ...MOCK_TRENDING_POSTS].filter(
      (post) => post.author === username && isVisibleToCurrentUser(post),
    );
    // Un même post peut figurer à la fois dans le fil et dans les tendances.
    const posts = authoredPosts.filter(
      (post, index) => authoredPosts.findIndex((item) => item.id === post.id) === index,
    );
    const conversation = MOCK_CONVERSATIONS.find((conv) => conv.name === username);
    const hasCommented = MOCK_POSTS.some((post) =>
      post.comments.some((comment) => comment.author === username),
    );

    if (posts.length === 0 && !conversation && !hasCommented) {
      throw new Error('Utilisateur introuvable');
    }

    const postWithAvatar = posts.find((post) => post.avatar);
    const avatar =
      (postWithAvatar && postWithAvatar.avatar) ||
      (conversation && conversation.avatar) ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;

    return Promise.resolve(
      structuredClone({
        username,
        name: '',
        avatar,
        bio: '',
        postsCount: posts.length,
        followersCount: 0,
        followingCount: 0,
        posts,
      }),
    );
  }
  try {
    const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(username)}`);
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de récupération du profil utilisateur :', error);
    throw error;
  }
}

/**
 * Récupère un post spécifique par son ID (données fraîches).
 * @param {number} postId Identifiant de la publication.
 * @return {Promise<Object>} Les données fraîches du post.
 */
export async function getPostById(postId) {
  if (USE_MOCK) {
    const post = MOCK_POSTS.find((p) => p.id === postId);
    // Une publication signalée n'existe pas pour les autres utilisateurs.
    if (!post || !isVisibleToCurrentUser(post)) {
      throw new Error('Publication introuvable');
    }
    return Promise.resolve(
      structuredClone({
        ...post,
        saved: MOCK_SAVED_POSTS.some((savedPost) => savedPost.id === postId),
      }),
    );
  }
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`);
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de récupération du post :', error);
    throw error;
  }
}

/**
 * Republier une publication sur le profil de l'utilisateur actuel.
 * @param {number} postId Identifiant de la publication à republier.
 * @return {Promise<Object>} La nouvelle publication créée.
 */
export async function republishPost(postId) {
  if (USE_MOCK) {
    const originalPost = MOCK_POSTS.find((p) => p.id === postId);
    if (!originalPost) throw new Error('Publication introuvable');
    const newPost = {
      id: Date.now(),
      author: currentUser.username,
      avatar: currentUser.avatar,
      mediaUrl: originalPost.mediaUrl,
      isVideo: originalPost.isVideo,
      caption: '🔄 Republié de ' + originalPost.author + ': ' + originalPost.caption,
      likesCount: 0,
      dislikesCount: 0,
      visibility: 'public',
      comments: [],
      createdAt: "À l'instant",
    };
    MOCK_POSTS.unshift(newPost);
    currentUser.posts.unshift(structuredClone(newPost));
    return Promise.resolve({
      success: true,
      post: newPost,
    });
  }
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/republish`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de la republication :', error);
    throw error;
  }
}

/**
 * Met à jour le profil de l'utilisateur connecté.
 * @param {Object} profileData Données à mettre à jour.
 * @param {string} profileData.username Nom d'utilisateur.
 * @param {string=} profileData.name Nom complet.
 * @param {string=} profileData.gender Genre ('unspecified', 'female', 'male' ou 'other').
 * @param {boolean=} profileData.showGender Afficher le genre sur le profil.
 * @param {string=} profileData.bio Biographie.
 * @param {string} profileData.avatar URL ou data URL de la photo.
 * @return {Promise<Object>} Utilisateur mis à jour.
 */
export async function updateProfile(profileData) {
  if (USE_MOCK) {
    if (!profileData.username || !profileData.avatar) {
      throw new Error('Veuillez remplir tous les champs obligatoires');
    }
    currentUser.username = profileData.username;
    currentUser.avatar = profileData.avatar;
    if (profileData.name !== undefined) currentUser.name = profileData.name;
    if (profileData.gender !== undefined) currentUser.gender = profileData.gender;
    if (profileData.showGender !== undefined) currentUser.showGender = profileData.showGender;
    if (profileData.bio !== undefined) currentUser.bio = profileData.bio;
    return Promise.resolve({
      success: true,
      user: structuredClone(currentUser),
    });
  }
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(profileData),
    });
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de mise à jour du profil :', error);
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
    return Promise.resolve(
      structuredClone(MOCK_TRENDING_POSTS.filter(isVisibleToCurrentUser)),
    );
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

/**
 * Recherche globale : profils, hashtags et publications.
 * @param {string} query Terme de recherche (texte libre ou #hashtag).
 * @return {Promise<Object>} Résultats {users, hashtags, posts}.
 */
export async function searchAll(query) {
  if (USE_MOCK) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      return Promise.resolve({users: [], hashtags: [], posts: []});
    }

    // Profils : auteurs uniques des publications.
    const usersMap = new Map();
    for (const post of MOCK_POSTS) {
      if (!usersMap.has(post.author)) {
        usersMap.set(post.author, {
          username: post.author,
          avatar: post.avatar,
          postsCount: MOCK_POSTS.filter((p) => p.author === post.author).length,
        });
      }
    }
    const users = [...usersMap.values()].filter((u) =>
      u.username.toLowerCase().includes(q.replace(/^#/, '')),
    );

    // Hashtags : tags contenant la requête (sans le # initial).
    const tagQuery = q.replace(/^#/, '');
    const hashtags = MOCK_HASHTAGS.filter((h) =>
      h.tag.toLowerCase().includes(tagQuery),
    );

    // Publications : par auteur ou par caption.
    const posts = MOCK_POSTS.filter((p) =>
      p.author.toLowerCase().includes(q) ||
      (p.caption || '').toLowerCase().includes(q),
    );

    return Promise.resolve({users, hashtags, posts});
  }
  try {
    const response = await fetch(
      `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`,
    );
    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Échec de la recherche :', error);
    return {users: [], hashtags: [], posts: []};
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
