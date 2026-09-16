/**
 * @fileoverview Service d'interaction avec l'API REST.
 * Conforme au Google Coding Style (ES6 Modules).
 *
 * Double mode :
 *  - API réelle (MariaDB PhotoVideo via le serveur port 3001) :
 *    utilisateurs, publications, commentaires, likes, signalements,
 *    hashtags. Le jeton d'authentification est envoyé automatiquement.
 *  - Repli mock : si le serveur est arrêté (proxy Apache en 502/503)
 *    ou si aucune session n'est ouverte, le front retombe sur les
 *    données simulées — le site reste utilisable pour les démos.
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

/**
 * Active les appels vers l'API réelle (serveur MariaDB, port 3001).
 * Le repli mock reste automatique en cas d'indisponibilité.
 */
const USE_REAL_API = true;

const API_BASE_URL = '/api';

// Variable globale pour stocker l'utilisateur actuellement connecté
let currentUser = structuredClone(MOCK_USER);

// ============================================================
//  INFRASTRUCTURE API RÉELLE (MariaDB)
// ============================================================

/** Clé de stockage du jeton d'authentification. */
const TOKEN_KEY = 'instaclone-token';

/** Jeton d'authentification courant (ou null). */
let authToken = localStorage.getItem(TOKEN_KEY);

/** Cache de disponibilité de l'API (tri-state). */
let realApiAvailable = null;

/**
 * Erreur signalant que le serveur API est injoignable (proxy Apache
 * en échec) : le front doit retomber en mode mock.
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
  realApiAvailable = null;
}

/**
 * Vérifie si l'API réelle est joignable (avec cache).
 * @return {Promise<boolean>} true si le backend répond.
 */
async function isRealApiAvailable() {
  if (!USE_REAL_API) return false;
  if (realApiAvailable !== null) return realApiAvailable;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/ping`);
    realApiAvailable = response.ok;
  } catch (e) {
    realApiAvailable = false;
  }
  return realApiAvailable;
}

/**
 * Appelle l'API réelle et lève ApiUnavailable si le serveur est
 * absent (502/503/504 du proxy Apache ou échec réseau).
 * @param {string} path Chemin relatif (ex. '/auth/login').
 * @param {Object} options Options fetch.
 * @return {Promise<Response>} Réponse fetch.
 */
async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if ([502, 503, 504].includes(response.status)) {
    throw new ApiUnavailable('Serveur API indisponible');
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

/**
 * Convertit une date ISO en libellé relatif français.
 * @param {string} isoDate Date au format ISO.
 * @return {string} Libellé lisible ("Il y a 3 h"...).
 */
function timeAgo(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate || '';
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "À l'instant";
  if (diffSec < 3600) return `Il y a ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `Il y a ${Math.floor(diffSec / 3600)} h`;
  if (diffSec < 604800) return `Il y a ${Math.floor(diffSec / 86400)} j`;
  return date.toLocaleDateString('fr-FR');
}

/**
 * Convertit une publication renvoyée par l'API réelle vers le format
 * attendu par les vues du front.
 * @param {Object} row Publication au format serveur.
 * @return {Object} Publication au format front.
 */
function mapRealPost(row) {
  return {
    id: row.id,
    author: row.author,
    avatar: row.avatar || makeAvatar(row.author || 'user'),
    mediaUrl: row.mediaUrl,
    isVideo: Boolean(row.isVideo),
    caption: row.caption || '',
    likesCount: row.likesCount || 0,
    dislikesCount: row.dislikesCount || 0,
    liked: Boolean(row.liked),
    disliked: Boolean(row.disliked),
    visibility: row.visibility || 'public',
    comments: (row.comments || []).map((c) => ({
      id: c.id,
      author: c.author,
      text: c.text,
      createdAt: timeAgo(c.createdAt),
    })),
    createdAt: timeAgo(row.createdAt),
    hashtags: row.hashtags || [],
  };
}

/**
 * Construit les en-têtes d'authentification si une session existe.
 * @return {Object} En-têtes fetch (éventuellement vides).
 */
function authHeaders() {
  return authToken ? {Authorization: `Bearer ${authToken}`} : {};
}

// ============================================================
//  FIL D'ACTUALITÉ
// ============================================================

/**
 * Récupère les publications du fil d'actualité.
 * @return {Promise<Array<Object>>} Liste des publications.
 */
export async function getFeedPosts() {
  // --- API réelle (MariaDB) ---
  if (await isRealApiAvailable()) {
    try {
      const response = await apiFetch('/posts', {headers: authHeaders()});
      if (response.ok) {
        const rows = await response.json();
        return rows.map(mapRealPost);
      }
      console.error('Échec de récupération des publications :', response.status);
    } catch (error) {
      if (error instanceof ApiUnavailable) {
        realApiAvailable = false;
      } else {
        console.error('Échec de récupération des publications :', error);
      }
    }
  }

  // --- Repli mock ---
  return Promise.resolve(structuredClone(MOCK_POSTS));
}

/**
 * Récupère les publications enregistrées de l'utilisateur.
 * (Pas de table dédiée en base : reste en mode mock.)
 * @return {Promise<Array<Object>>} Liste des publications enregistrées.
 */
export async function getSavedPosts() {
  return Promise.resolve(structuredClone(MOCK_SAVED_POSTS));
}

/**
 * Crée une nouvelle publication (upload du média vers le serveur).
 * @param {Object} postData Données de la publication.
 * @return {Promise<Object>} La publication créée.
 */
export async function createPost(postData) {
  // --- API réelle (MariaDB) : session requise ---
  if (authToken && (await isRealApiAvailable())) {
    try {
      const formData = new FormData();
      formData.append('media', postData.mediaFile);
      formData.append('caption', postData.caption);
      formData.append('visibility', postData.visibility);

      const response = await apiFetch('/posts', {
        method: 'POST',
        headers: authHeaders(), // Content-Type géré par FormData
        body: formData,
      });
      if (response.status === 401) {
        setAuthToken(null); // jeton expiré : repli mock
      } else if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Erreur: ${response.status}`);
      } else {
        return mapRealPost(await response.json());
      }
    } catch (error) {
      if (!(error instanceof ApiUnavailable)) throw error;
      console.warn('API indisponible — repli mock pour la publication');
      realApiAvailable = false;
    }
  }

  // --- Repli mock ---
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

/**
 * Bascule le statut "j'aime" d'une publication.
 * @param {number} postId Identifiant de la publication.
 * @param {boolean} liked État souhaité.
 * @return {Promise<Object>} Nouvel état.
 */
export async function toggleLike(postId, liked) {
  // --- API réelle (MariaDB) ---
  if (authToken && (await isRealApiAvailable())) {
    try {
      const response = await apiFetch(`/posts/${postId}/like`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', ...authHeaders()},
        body: JSON.stringify({like: liked}),
      });
      if (response.status === 401) {
        setAuthToken(null); // jeton expiré : repli mock
      } else if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Erreur: ${response.status}`);
      }
    } catch (error) {
      if (!(error instanceof ApiUnavailable)) throw error;
      console.warn('API indisponible — repli mock pour le like');
      realApiAvailable = false;
    }
  }

  // --- Repli mock ---
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

/**
 * Bascule le statut "je n'aime pas" d'une publication.
 * @param {number} postId Identifiant de la publication.
 * @param {boolean} disliked État souhaité.
 * @return {Promise<Object>} Nouvel état.
 */
export async function toggleDislike(postId, disliked) {
  // --- API réelle (MariaDB) ---
  if (authToken && (await isRealApiAvailable())) {
    try {
      const response = await apiFetch(`/posts/${postId}/dislike`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', ...authHeaders()},
        body: JSON.stringify({dislike: disliked}),
      });
      if (response.status === 401) {
        setAuthToken(null); // jeton expiré : repli mock
      } else if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Erreur: ${response.status}`);
      }
    } catch (error) {
      if (!(error instanceof ApiUnavailable)) throw error;
      console.warn('API indisponible — repli mock pour le dislike');
      realApiAvailable = false;
    }
  }

  // --- Repli mock ---
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

/**
 * Repartage une publication (partage externe).
 * @param {number} postId Identifiant de la publication.
 * @return {Promise<Object>} Résultat du partage.
 */
export async function sharePost(postId) {
  // --- API réelle (MariaDB) ---
  if (await isRealApiAvailable()) {
    try {
      const response = await apiFetch(`/posts/${postId}/share`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      if (error instanceof ApiUnavailable) {
        realApiAvailable = false;
      } else {
        console.error('Échec du partage :', error);
      }
    }
  }

  // --- Repli mock ---
  return Promise.resolve({
    success: true,
    shareUrl: `${window.location.origin}/post/${postId}`,
  });
}

/**
 * Signale une publication.
 * @param {number} postId Identifiant de la publication.
 * @param {string} reason Motif du signalement.
 * @return {Promise<Object>} Résultat du signalement.
 */
export async function reportPost(postId, reason) {
  // --- API réelle (MariaDB) : session requise ---
  if (authToken && (await isRealApiAvailable())) {
    try {
      const response = await apiFetch(`/posts/${postId}/report`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', ...authHeaders()},
        body: JSON.stringify({motif: reason}),
      });
      if (response.status === 401) {
        setAuthToken(null); // jeton expiré : repli mock
      } else if (response.ok) {
        return await response.json();
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Erreur: ${response.status}`);
      }
    } catch (error) {
      if (!(error instanceof ApiUnavailable)) throw error;
      console.warn('API indisponible — repli mock pour le signalement');
      realApiAvailable = false;
    }
  }

  // --- Repli mock ---
  console.info(`[MOCK] Publication ${postId} signalée : ${reason}`);
  return Promise.resolve({success: true});
}

/**
 * Récupère les commentaires d'une publication.
 * @param {number} postId Identifiant de la publication.
 * @return {Promise<Array<Object>>} Liste des commentaires.
 */
export async function getComments(postId) {
  // --- API réelle (MariaDB) ---
  if (await isRealApiAvailable()) {
    try {
      const response = await apiFetch(`/posts/${postId}/comments`);
      if (response.ok) {
        const rows = await response.json();
        return rows.map((c) => ({
          id: c.id,
          author: c.author,
          text: c.text,
          createdAt: timeAgo(c.createdAt),
        }));
      }
    } catch (error) {
      if (error instanceof ApiUnavailable) {
        realApiAvailable = false;
      } else {
        console.error('Échec de récupération des commentaires :', error);
      }
    }
  }

  // --- Repli mock ---
  const post = MOCK_POSTS.find((p) => p.id === postId);
  return Promise.resolve(post ? structuredClone(post.comments) : []);
}

/**
 * Ajoute un commentaire à une publication.
 * @param {number} postId Identifiant de la publication.
 * @param {string} text Contenu du commentaire.
 * @return {Promise<Object>} Le commentaire créé.
 */
export async function addComment(postId, text) {
  // --- API réelle (MariaDB) : session requise ---
  if (authToken && (await isRealApiAvailable())) {
    try {
      const response = await apiFetch(`/posts/${postId}/comments`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', ...authHeaders()},
        body: JSON.stringify({text}),
      });
      if (response.status === 401) {
        setAuthToken(null); // jeton expiré : repli mock
      } else if (response.ok) {
        const c = await response.json();
        return {id: c.id, author: c.author, text: c.text, createdAt: timeAgo(c.createdAt)};
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Erreur: ${response.status}`);
      }
    } catch (error) {
      if (!(error instanceof ApiUnavailable)) throw error;
      console.warn('API indisponible — repli mock pour le commentaire');
      realApiAvailable = false;
    }
  }

  // --- Repli mock ---
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

// ============================================================
//  AUTHENTIFICATION
// ============================================================

/**
 * Connecte un utilisateur.
 * @param {string} username Nom d'utilisateur ou email.
 * @param {string} password Mot de passe.
 * @return {Promise<Object>} Utilisateur connecté.
 */
export async function loginUser(username, password) {
  // --- API réelle (MariaDB) ---
  if (await isRealApiAvailable()) {
    try {
      const response = await apiFetch('/auth/login', {
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
      realApiAvailable = false;
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
 * @param {string} username Nom d'utilisateur (pseudonyme).
 * @param {string} name Nom complet (prénom + nom).
 * @param {string} password Mot de passe.
 * @param {string} email Adresse email.
 * @return {Promise<Object>} Utilisateur créé.
 */
export async function registerUser(username, name, password, email) {
  // --- API réelle (MariaDB) ---
  if (await isRealApiAvailable()) {
    try {
      // Découpe "Prenom Nom" en deux colonnes distinctes.
      const parts = (name || '').trim().split(/\s+/);
      const prenom = parts.shift() || username;
      const nom = parts.join(' ');

      const response = await apiFetch('/auth/register', {
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
      realApiAvailable = false;
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
 * Récupère l'utilisateur actuellement connecté.
 * @return {Promise<Object>} Données du profil.
 */
export async function getCurrentUser() {
  // --- API réelle (MariaDB) : jeton présent + serveur joignable ---
  if (authToken && (await isRealApiAvailable())) {
    try {
      const response = await apiFetch('/users/me', {
        headers: authHeaders(),
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
        realApiAvailable = false;
      } else {
        console.error('Échec de récupération du profil :', error);
      }
    }
  }

  // --- Repli mock ---
  return Promise.resolve(structuredClone(currentUser));
}

/**
 * Récupère une publication par son identifiant.
 * @param {number} postId Identifiant de la publication.
 * @return {Promise<Object>} Les données fraîches du post.
 */
export async function getPostById(postId) {
  // --- API réelle (MariaDB) ---
  if (await isRealApiAvailable()) {
    try {
      const response = await apiFetch(`/posts/${postId}`, {
        headers: authHeaders(),
      });
      if (response.ok) {
        return mapRealPost(await response.json());
      }
      if (response.status === 404) {
        throw new Error('Publication introuvable');
      }
      throw new Error(`Erreur: ${response.status}`);
    } catch (error) {
      if (!(error instanceof ApiUnavailable)) throw error;
      realApiAvailable = false;
    }
  }

  // --- Repli mock ---
  const post = MOCK_POSTS.find((p) => p.id === postId);
  if (!post) throw new Error('Publication introuvable');
  return Promise.resolve(structuredClone(post));
}

/**
 * Republier une publication sur le profil de l'utilisateur actuel.
 * @param {number} postId Identifiant de la publication à republier.
 * @return {Promise<Object>} La nouvelle publication créée.
 */
export async function republishPost(postId) {
  // --- API réelle (MariaDB) : session requise ---
  if (authToken && (await isRealApiAvailable())) {
    try {
      const response = await apiFetch(`/posts/${postId}/republish`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (response.status === 401) {
        setAuthToken(null); // jeton expiré : repli mock
      } else if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Erreur: ${response.status}`);
      }
    } catch (error) {
      if (!(error instanceof ApiUnavailable)) throw error;
      console.warn('API indisponible — repli mock pour la republication');
      realApiAvailable = false;
    }
  }

  // --- Repli mock ---
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
  if (authToken && (await isRealApiAvailable())) {
    try {
      // Découpe le nom complet en prénom + nom pour la base.
      const parts = (profileData.name || '').trim().split(/\s+/);
      const prenom = parts.shift() || profileData.username;
      const nom = parts.join(' ');

      const response = await apiFetch('/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
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
      realApiAvailable = false;
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
  // --- API réelle (MariaDB) ---
  if (await isRealApiAvailable()) {
    try {
      const response = await apiFetch('/posts/trending', {
        headers: authHeaders(),
      });
      if (response.ok) {
        const rows = await response.json();
        return rows.map(mapRealPost);
      }
      console.error('Échec de récupération des tendances :', response.status);
    } catch (error) {
      if (error instanceof ApiUnavailable) {
        realApiAvailable = false;
      } else {
        console.error('Échec de récupération des tendances :', error);
      }
    }
  }

  // --- Repli mock ---
  return Promise.resolve(structuredClone(MOCK_TRENDING_POSTS));
}

/**
 * Récupère les hashtags populaires.
 * @return {Promise<Array<Object>>} Liste des hashtags.
 */
export async function getHashtags() {
  // --- API réelle (MariaDB) ---
  if (await isRealApiAvailable()) {
    try {
      const response = await apiFetch('/hashtags');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      if (error instanceof ApiUnavailable) {
        realApiAvailable = false;
      } else {
        console.error('Échec de récupération des hashtags :', error);
      }
    }
  }

  // --- Repli mock ---
  return Promise.resolve(structuredClone(MOCK_HASHTAGS));
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

  const realAvailable = await isRealApiAvailable();

  // --- Utilisateurs : API réelle (MariaDB) avec repli mock ---
  let users = null;
  if (realAvailable) {
    try {
      const response = await apiFetch(
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
        realApiAvailable = false;
      } else {
        console.error('Échec de la recherche utilisateurs :', error);
      }
    }
  }

  // --- Publications : API réelle (MariaDB) avec repli mock ---
  let posts = null;
  if (realAvailable) {
    try {
      const response = await apiFetch(
        `/posts/search?q=${encodeURIComponent(q)}`,
        {headers: authHeaders()},
      );
      if (response.ok) {
        posts = (await response.json()).map(mapRealPost);
      }
    } catch (error) {
      if (error instanceof ApiUnavailable) {
        realApiAvailable = false;
      } else {
        console.error('Échec de la recherche publications :', error);
      }
    }
  }

  // --- Hashtags : API réelle (MariaDB) avec repli mock ---
  let hashtags = null;
  if (realAvailable) {
    try {
      const response = await apiFetch('/hashtags');
      if (response.ok) {
        const all = await response.json();
        const tagQuery = q.replace(/^#/, '');
        hashtags = all.filter((h) =>
          h.tag.toLowerCase().includes(tagQuery),
        );
      }
    } catch (error) {
      if (error instanceof ApiUnavailable) {
        realApiAvailable = false;
      } else {
        console.error('Échec de la recherche hashtags :', error);
      }
    }
  }

  // --- Replis mock ---
  if (users === null) {
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
    users = [...usersMap.values()].filter((u) =>
      u.username.toLowerCase().includes(q.replace(/^#/, '')),
    );
  }

  if (hashtags === null) {
    const tagQuery = q.replace(/^#/, '');
    hashtags = MOCK_HASHTAGS.filter((h) =>
      h.tag.toLowerCase().includes(tagQuery),
    );
  }

  if (posts === null) {
    posts = MOCK_POSTS.filter((p) =>
      p.author.toLowerCase().includes(q) ||
      (p.caption || '').toLowerCase().includes(q),
    );
  }

  return {users, hashtags, posts};
}

// ============================================================
//  MESSAGERIE
// ============================================================

/**
 * Récupère la liste des conversations (repli hors Socket.io).
 * @return {Promise<Array<Object>>} Liste des conversations.
 */
export async function getConversations() {
  return Promise.resolve(structuredClone(MOCK_CONVERSATIONS));
}

/**
 * Envoie un message dans une conversation (repli hors Socket.io).
 * @param {number} conversationId Identifiant de la conversation.
 * @param {string} text Contenu du message.
 * @return {Promise<Object>} Le message envoyé.
 */
export async function sendMessage(conversationId, text) {
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
