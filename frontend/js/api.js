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
  makeAvatar,
} from './mock-data.js';

const USE_MOCK = true;

/**
 * Authentification et profil via l'API réelle (MariaDB, port 3001).
 * Si le serveur est arrêté, le front retombe automatiquement en
 * mode mock : le site reste utilisable sans backend.
 */
const USE_REAL_USERS = true;

const API_BASE_URL = '/api';

// Variable globale pour stocker l'utilisateur actuellement connecté
let currentUser = structuredClone(MOCK_USER);

// ============================================================
//  AUTHENTIFICATION RÉELLE (MariaDB)
// ============================================================

/** Clé de stockage du jeton d'authentification. */
const TOKEN_KEY = 'instaclone-token';

/** Jeton d'authentification courant (ou null). */
let authToken = localStorage.getItem(TOKEN_KEY);

/** Cache de disponibilité de l'API utilisateurs (tri-state). */
let realUsersAvailable = null;

/**
 * Erreur signalant que le serveur API utilisateurs est injoignable
 * (proxy Apache en échec) : le front doit retomber en mode mock.
 */
class ApiUnavailable extends Error {}

/**
 * Mémorise (ou efface) le jeton d'authentification.
 * @param {?string} token Jeton signé renvoyé par le serveur.
 */
function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Déconnecte l'utilisateur : efface le jeton et réinitialise le cache
 * de disponibilité pour permettre une reconnexion au backend.
 */
export function logoutUser() {
  setAuthToken(null);
  realUsersAvailable = null;
}

/**
 * Vérifie si l'API utilisateurs réelle est joignable (avec cache).
 * @return {Promise<boolean>} true si le backend répond.
 */
async function isRealUsersApiAvailable() {
  if (!USE_REAL_USERS) return false;
  if (realUsersAvailable !== null) return realUsersAvailable;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/ping`);
    realUsersAvailable = response.ok;
  } catch (e) {
    realUsersAvailable = false;
  }
  return realUsersAvailable;
}

/**
 * Appelle l'API utilisateurs réelle et lève ApiUnavailable si le
 * serveur est absent (502/503 du proxy Apache ou échec réseau).
 * @param {string} path Chemin relatif (ex. '/auth/login').
 * @param {Object} options Options fetch.
 * @return {Promise<Response>} Réponse fetch.
 */
async function usersFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if ([502, 503, 504].includes(response.status)) {
    throw new ApiUnavailable('Serveur API utilisateurs indisponible');
  }
  return response;
}

/**
 * Normalise un utilisateur renvoyé par l'API réelle vers le format du
 * front (avatar par défaut si absent).
 * @param {Object} user Utilisateur au format serveur.
 * @return {Object} Utilisateur au format front.
 */
function normalizeRealUser(user) {
  return {
    ...user,
    avatar: user.avatar || makeAvatar(user.username || 'user'),
    bio: user.bio || '',
  };
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
  // --- API réelle (MariaDB) ---
  if (await isRealUsersApiAvailable()) {
    try {
      const response = await usersFetch('/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({identifiant: username, motDePasse: password}),
      });
      if (response.status === 401) {
        throw new Error('Identifiants incorrects');
      }
      if (!response.ok) throw new Error(`Erreur: ${response.status}`);
      const data = await response.json();
      setAuthToken(data.token);
      currentUser = normalizeRealUser(data.user);
      return {success: true, user: structuredClone(currentUser)};
    } catch (error) {
      if (!(error instanceof ApiUnavailable)) throw error;
      console.warn('API indisponible — repli mock pour la connexion');
      realUsersAvailable = false;
    }
  }

  // --- Repli mock ---
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

/**
 * Inscrit un nouvel utilisateur.
 * @param {string} username Nom d'utilisateur.
 * @param {string} email Adresse email.
 * @param {string} password Mot de passe.
 * @return {Promise<Object>} Utilisateur créé.
 */
export async function registerUser(username, name, password, email) {
  // --- API réelle (MariaDB) ---
  if (await isRealUsersApiAvailable()) {
    try {
      // Découpe "Prenom Nom" en deux colonnes distinctes.
      const parts = (name || '').trim().split(/\s+/);
      const prenom = parts.shift() || username;
      const nom = parts.join(' ');

      const response = await usersFetch('/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          pseudonyme: username,
          email,
          motDePasse: password,
          prenom,
          nom,
        }),
      });
      if (response.status === 409) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Pseudonyme ou email déjà utilisé');
      }
      if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Champs invalides');
      }
      if (!response.ok) throw new Error(`Erreur: ${response.status}`);
      const data = await response.json();
      setAuthToken(data.token);
      currentUser = normalizeRealUser(data.user);
      return {success: true, user: structuredClone(currentUser)};
    } catch (error) {
      if (!(error instanceof ApiUnavailable)) throw error;
      console.warn('API indisponible — repli mock pour l\u2019inscription');
      realUsersAvailable = false;
    }
  }

  // --- Repli mock ---
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

// ============================================================
//  PROFIL
// ============================================================

/**
 * Récupère le profil de l'utilisateur connecté.
 * @return {Promise<Object>} Données du profil.
 */
export async function getCurrentUser() {
  // --- API réelle (MariaDB) : jeton présent + serveur joignable ---
  if (authToken && (await isRealUsersApiAvailable())) {
    try {
      const response = await usersFetch('/users/me', {
        headers: {Authorization: `Bearer ${authToken}`},
      });
      if (response.status === 401) {
        // Jeton expiré ou invalide : on l'efface et on retombe en mock.
        setAuthToken(null);
      } else if (response.ok) {
        const user = await response.json();
        currentUser = normalizeRealUser(user);
        return structuredClone(currentUser);
      }
    } catch (error) {
      if (error instanceof ApiUnavailable) {
        realUsersAvailable = false;
      } else {
        console.error('Échec de récupération du profil :', error);
      }
    }
  }

  // --- Repli mock ---
  return Promise.resolve(structuredClone(currentUser));
}

/**
 * Récupère un post spécifique par son ID (données fraîches).
 * @param {number} postId Identifiant de la publication.
 * @return {Promise<Object>} Les données fraîches du post.
 */
export async function getPostById(postId) {
  if (USE_MOCK) {
    const post = MOCK_POSTS.find((p) => p.id === postId);
    if (!post) throw new Error('Publication introuvable');
    return Promise.resolve(structuredClone(post));
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
 * @param {string=} profileData.bio Biographie.
 * @param {string} profileData.avatar URL ou data URL de la photo.
 * @return {Promise<Object>} Utilisateur mis à jour.
 */
export async function updateProfile(profileData) {
  // --- API réelle (MariaDB) ---
  if (authToken && (await isRealUsersApiAvailable())) {
    try {
      // Découpe le nom complet en prénom + nom pour la base.
      const parts = (profileData.name || '').trim().split(/\s+/);
      const prenom = parts.shift() || profileData.username;
      const nom = parts.join(' ');

      const response = await usersFetch('/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          pseudonyme: profileData.username,
          prenom,
          nom,
          bio: profileData.bio || '',
          photoProfil: profileData.avatar,
        }),
      });
      if (response.status === 401) {
        setAuthToken(null); // jeton expiré : repli mock
      } else if (response.status === 409) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Ce nom d\u2019utilisateur est déjà pris');
      } else if (response.ok) {
        const data = await response.json();
        currentUser = normalizeRealUser(data.user);
        return {success: true, user: structuredClone(currentUser)};
      } else {
        throw new Error(`Erreur: ${response.status}`);
      }
    } catch (error) {
      if (!(error instanceof ApiUnavailable)) throw error;
      console.warn('API indisponible — repli mock pour la mise à jour');
      realUsersAvailable = false;
    }
  }

  // --- Repli mock ---
  if (!profileData.username || !profileData.avatar) {
    throw new Error('Veuillez remplir tous les champs obligatoires');
  }
  currentUser.username = profileData.username;
  currentUser.avatar = profileData.avatar;
  if (profileData.name !== undefined) currentUser.name = profileData.name;
  if (profileData.bio !== undefined) currentUser.bio = profileData.bio;
  return Promise.resolve({
    success: true,
    user: structuredClone(currentUser),
  });
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

/**
 * Recherche globale : profils, hashtags et publications.
 * @param {string} query Terme de recherche (texte libre ou #hashtag).
 * @return {Promise<Object>} Résultats {users, hashtags, posts}.
 */
export async function searchAll(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    return Promise.resolve({users: [], hashtags: [], posts: []});
  }

  // --- Utilisateurs : API réelle (MariaDB) avec repli mock ---
  let users = null;
  if (await isRealUsersApiAvailable()) {
    try {
      const response = await usersFetch(
        `/users/search?q=${encodeURIComponent(q)}`,
      );
      if (response.ok) {
        const data = await response.json();
        users = data.users.map((u) => ({
          ...u,
          avatar: u.avatar || makeAvatar(u.username),
        }));
      }
    } catch (error) {
      if (error instanceof ApiUnavailable) {
        realUsersAvailable = false;
      } else {
        console.error('Échec de la recherche utilisateurs :', error);
      }
    }
  }

  // Profils : auteurs uniques des publications (repli mock).
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
  if (users === null) {
    users = [...usersMap.values()].filter((u) =>
      u.username.toLowerCase().includes(q.replace(/^#/, '')),
    );
  }

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

  return {users, hashtags, posts};
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
