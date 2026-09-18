/**
 * @fileoverview Centre de notifications : historique persistant des
 * interactions (likes, dislikes, commentaires, messages…), compteur de
 * non-lues et pastille dans la barre de navigation.
 */

const SETTINGS_KEY = 'instaclone_notification_settings';
const LIST_KEY = 'lifeinvader_notifications';
const MAX_ITEMS = 60;

/** Références aux écouteurs Socket.io installés par ce module. */
let messageHandler = null;
let likeHandler = null;

/**
 * Métadonnées d'affichage par type de notification.
 * @type {Object<string, {icon: string, label: string}>}
 */
const TYPE_META = {
  like: {icon: '❤️', label: "J'aime"},
  dislike: {icon: '💔', label: "Je n'aime pas"},
  comment: {icon: '💬', label: 'Commentaire'},
  message: {icon: '✉️', label: 'Message'},
  republish: {icon: '🔁', label: 'Republication'},
  save: {icon: '🔖', label: 'Enregistrement'},
  report: {icon: '🚩', label: 'Signalement'},
  follow: {icon: '👤', label: 'Abonnement'},
  info: {icon: '🔔', label: 'Information'},
};

/**
 * Récupère les préférences de notification de l'utilisateur.
 * @return {{pauseAll: boolean, messagesOnly: boolean}}
 */
function getSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved
      ? {pauseAll: false, messagesOnly: false, ...JSON.parse(saved)}
      : {pauseAll: false, messagesOnly: false};
  } catch (error) {
    console.error('Préférences de notification illisibles :', error);
    return {pauseAll: false, messagesOnly: false};
  }
}

/**
 * Lit l'historique des notifications.
 * @return {Array<Object>} Notifications, de la plus récente à la plus ancienne.
 */
export function getNotifications() {
  try {
    const saved = localStorage.getItem(LIST_KEY);
    const list = saved ? JSON.parse(saved) : [];
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error('Historique de notifications illisible :', error);
    return [];
  }
}

/**
 * Enregistre l'historique et prévient le reste de l'application.
 * @param {Array<Object>} list Notifications à enregistrer.
 */
function saveNotifications(list) {
  try {
    localStorage.setItem(LIST_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch (error) {
    console.error("Impossible d'enregistrer les notifications :", error);
  }
  updateBadgeUI();
  window.dispatchEvent(new CustomEvent('notifications-changed'));
}

/**
 * Compte les notifications non lues.
 * @return {number} Nombre de notifications non lues.
 */
export function getUnreadCount() {
  return getNotifications().filter((item) => !item.read).length;
}

/**
 * Renvoie l'icône et le libellé associés à un type de notification.
 * @param {string} type Type de notification.
 * @return {{icon: string, label: string}} Métadonnées d'affichage.
 */
export function getTypeMeta(type) {
  return TYPE_META[type] || TYPE_META.info;
}

/**
 * Met à jour la pastille rouge dans la barre de navigation.
 */
export function updateBadgeUI() {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;

  const count = getUnreadCount();
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

/**
 * Ajoute une notification à l'historique, en respectant les préférences.
 * @param {string} type Type de notification (like, comment, message…).
 * @param {string} text Texte affiché dans la liste.
 * @param {Object=} extra Données complémentaires (postId, actor…).
 * @return {?Object} La notification créée, ou null si elle a été filtrée.
 */
export function addNotification(type, text, extra = {}) {
  const settings = getSettings();

  // L'utilisateur a mis toutes les notifications en pause.
  if (settings.pauseAll) return null;

  // Seuls les messages directs sont autorisés.
  if (settings.messagesOnly && type !== 'message') return null;

  const notification = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    text,
    date: new Date().toISOString(),
    read: false,
    ...extra,
  };

  saveNotifications([notification, ...getNotifications()]);
  return notification;
}

/**
 * Marque toutes les notifications comme lues (la pastille disparaît).
 */
export function markAllAsRead() {
  const list = getNotifications();
  if (!list.some((item) => !item.read)) {
    updateBadgeUI();
    return;
  }
  saveNotifications(list.map((item) => ({...item, read: true})));
}

/**
 * Supprime une notification précise.
 * @param {string} id Identifiant de la notification.
 */
export function removeNotification(id) {
  saveNotifications(getNotifications().filter((item) => item.id !== id));
}

/**
 * Vide entièrement l'historique des notifications.
 */
export function clearNotifications() {
  saveNotifications([]);
}

/**
 * Initialise les écouteurs Socket.io et la pastille.
 */
export function initNotifications() {
  updateBadgeUI();

  if (typeof window.io !== 'undefined' && !window.socket) {
    window.socket = window.io();
  }

  const socket = window.socket;
  if (!socket) return;

  const currentPseudo = localStorage.getItem('instaclone_user') || 'Moi';

  // On retire uniquement nos propres écouteurs : la vue Messages installe
  // les siens sur 'receive_message' et ne doit pas être désabonnée ici.
  if (messageHandler) socket.off('receive_message', messageHandler);
  if (likeHandler) socket.off('post_liked', likeHandler);

  // Nouveau message reçu (on ignore ses propres messages).
  messageHandler = (msg) => {
    if (!msg || msg.pseudonyme === currentPseudo) return;
    addNotification('message', `${msg.pseudonyme} vous a envoyé un message`, {
      actor: msg.pseudonyme,
    });
  };
  socket.on('receive_message', messageHandler);

  // Like reçu : le serveur rediffuse « like_post » sous le nom « post_liked ».
  likeHandler = (data) => {
    if (!data || data.likedBy === currentPseudo) return;
    addNotification('like', `${data.likedBy} a aimé une publication`, {
      actor: data.likedBy,
      postId: data.postId,
    });
  };
  socket.on('post_liked', likeHandler);
}
