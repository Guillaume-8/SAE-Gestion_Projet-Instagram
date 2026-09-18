/**
 * @fileoverview Vue Notifications : suivi des likes, dislikes, commentaires,
 * messages et autres interactions.
 */
import {
  getNotifications,
  getTypeMeta,
  markAllAsRead,
  removeNotification,
  clearNotifications,
} from '../notification.js';
import {showPostModal} from '../post-modal.js';

/**
 * Échappe les caractères HTML.
 * @param {string} text Texte à échapper.
 * @return {string} Texte échappé.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text == null ? '' : text);
  return div.innerHTML;
}

/**
 * Formate une date ISO en libellé relatif court.
 * @param {string} iso Date au format ISO.
 * @return {string} Libellé du type « il y a 5 min ».
 */
function formatRelativeDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `il y a ${Math.floor(seconds / 86400)} j`;
  return date.toLocaleDateString('fr-FR');
}

/**
 * Construit le HTML de la liste des notifications.
 * @return {string} HTML de la liste.
 */
function buildListHtml() {
  const list = getNotifications();

  if (list.length === 0) {
    return `
      <div class="notif-empty">
        <div class="notif-empty-icon">🔔</div>
        <p class="empty-notif">Vous n'avez aucune notification.</p>
        <p class="notif-empty-hint">
          Vos likes, dislikes, commentaires et messages apparaîtront ici.
        </p>
      </div>
    `;
  }

  return list
    .map((item) => {
      const meta = getTypeMeta(item.type);
      return `
        <article class="notif-item ${item.read ? '' : 'unread'}"
                 data-notif-id="${escapeHtml(item.id)}"
                 ${item.postId != null ? `data-post-id="${escapeHtml(item.postId)}"` : ''}>
          <span class="notif-icon" title="${escapeHtml(meta.label)}">${meta.icon}</span>
          <div class="notif-body">
            <p class="notif-text">${escapeHtml(item.text)}</p>
            <span class="notif-date">${escapeHtml(formatRelativeDate(item.date))}</span>
          </div>
          <button class="notif-delete" data-notif-delete="${escapeHtml(item.id)}"
                  title="Supprimer" aria-label="Supprimer la notification">✕</button>
        </article>
      `;
    })
    .join('');
}

/**
 * Rend le squelette HTML de la vue Notifications.
 * @return {string} HTML de la vue.
 */
export function render() {
  return `
    <div class="notif-page">
      <div class="notif-header">
        <h1 class="notif-title">Notifications</h1>
        <button class="btn-secondary notif-clear-btn" id="notif-clear-btn">
          Tout effacer
        </button>
      </div>
      <div class="notif-list" id="notif-list">
        ${buildListHtml()}
      </div>
    </div>
  `;
}

/**
 * Redessine la liste sans recharger la vue.
 */
function refreshList() {
  const container = document.getElementById('notif-list');
  if (container) container.innerHTML = buildListHtml();
}

/**
 * Monte la vue : marque les notifications comme lues et installe les listeners.
 */
export function mount() {
  const container = document.getElementById('notif-list');
  if (!container) return;

  container.addEventListener('click', (event) => {
    const deleteBtn = event.target.closest('[data-notif-delete]');
    if (deleteBtn) {
      event.stopPropagation();
      removeNotification(deleteBtn.dataset.notifDelete);
      refreshList();
      return;
    }

    // Une notification liée à une publication ouvre celle-ci.
    const item = event.target.closest('.notif-item[data-post-id]');
    if (item) {
      showPostModal({id: Number(item.dataset.postId)});
    }
  });

  const clearBtn = document.getElementById('notif-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearNotifications();
      refreshList();
    });
  }

  // Mise à jour en direct si une notification arrive pendant l'affichage.
  window.addEventListener('notifications-changed', refreshList);

  // Consulter l'onglet vaut lecture : la pastille se remet à zéro.
  markAllAsRead();
}
