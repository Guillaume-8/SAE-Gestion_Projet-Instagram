/**
 * @fileoverview Vue de messagerie instantanée.
 */

import { getConversations, sendMessage } from '../api.js';

let currentConversationId = null;
let conversationsData = [];

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
 * Rend le squelette HTML de la vue Messages.
 * @return {string} HTML de la vue.
 */
export function render() {
  return `
    <div class="messages-page">
      <aside class="conversations-sidebar">
        <div class="sidebar-header">
          <h2>Messages</h2>
          <button class="btn-new-message" title="Nouveau message">✏️</button>
        </div>
        <div class="conversations-list" id="conversations-list">
          <span class="skeleton-text">Chargement des conversations...</span>
        </div>
      </aside>

      <section class="chat-area" id="chat-area">
        <div class="chat-empty">
          <div class="chat-empty-icon">💬</div>
          <p>Vos messages</p>
          <span>Selectionnez une conversation pour commencer à discuter.</span>
        </div>
      </section>
    </div>
  `;
}

/**
 * Génère le HTML d'un élément de la liste des conversations.
 * @param {Object} conv Données de la conversation.
 * @return {string} HTML de l'élément.
 */
function createConversationItemHtml(conv) {
  const unreadBadge = conv.unread
    ? '<span class="unread-badge"></span>'
    : '';

  return `
    <div class="conversation-item${conv.unread ? ' unread' : ''}" data-conv-id="${conv.id}">
      <img src="${conv.avatar}" alt="${escapeHtml(conv.name)}" class="conv-avatar">
      <div class="conv-info">
        <span class="conv-name">${escapeHtml(conv.name)}</span>
        <span class="conv-preview">${escapeHtml(conv.lastMessage)}</span>
      </div>
      <span class="conv-time">${escapeHtml(conv.lastTime)}</span>
      ${unreadBadge}
    </div>
  `;
}

/**
 * Génère le HTML de la zone de chat pour une conversation.
 * @param {Object} conv Données de la conversation.
 * @return {string} HTML de la zone de chat.
 */
function buildChatHtml(conv) {
  const messagesHtml = conv.messages
    .map((msg) => {
      const isMe = msg.sender === 'me';
      return `
        <div class="message-bubble${isMe ? ' message-mine' : ''}">
          <p>${escapeHtml(msg.text)}</p>
          <span class="message-time">${escapeHtml(msg.createdAt)}</span>
        </div>
      `;
    })
    .join('');

  return `
    <div class="chat-header">
      <img src="${conv.avatar}" alt="${escapeHtml(conv.name)}" class="chat-header-avatar">
      <div class="chat-header-info">
        <span class="chat-header-name">${escapeHtml(conv.name)}</span>
        <span class="chat-header-status">En ligne</span>
      </div>
    </div>
    <div class="chat-messages" id="chat-messages">
      ${messagesHtml}
    </div>
    <form class="chat-input-form" id="chat-input-form">
      <input
        type="text"
        id="chat-input"
        placeholder="Écrivez un message..."
        maxlength="1000"
        autocomplete="off">
      <button type="submit" class="btn-send-message">Envoyer</button>
    </form>
  `;
}

/**
 * Ouvre une conversation dans la zone de chat.
 * @param {number} convId Identifiant de la conversation.
 */
function openConversation(convId) {
  const conv = conversationsData.find((c) => c.id === convId);
  if (!conv) return;

  currentConversationId = convId;

  // Marquer comme lu
  conv.unread = false;
  const item = document.querySelector(`.conversation-item[data-conv-id="${convId}"]`);
  if (item) {
    item.classList.remove('unread');
    const badge = item.querySelector('.unread-badge');
    if (badge) badge.remove();
  }

  // Injecter le chat
  const chatArea = document.getElementById('chat-area');
  chatArea.innerHTML = buildChatHtml(conv);

  // Scroll en bas
  const messagesContainer = document.getElementById('chat-messages');
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Formulaire d'envoi de message
  const form = document.getElementById('chat-input-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const text = input.value.trim();
      if (!text) return;

      const sendBtn = form.querySelector('.btn-send-message');
      sendBtn.disabled = true;

      try {
        const newMessage = await sendMessage(convId, text);

        // Injecter le nouveau message
        const bubbleHtml = `
          <div class="message-bubble message-mine">
            <p>${escapeHtml(newMessage.text)}</p>
            <span class="message-time">${escapeHtml(newMessage.createdAt)}</span>
          </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', bubbleHtml);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        input.value = '';
      } catch (error) {
        console.error('Erreur d\'envoi de message :', error);
      } finally {
        sendBtn.disabled = false;
      }
    });
  }
}

/**
 * Monte la vue : récupère les conversations et installe les listeners.
 */
export async function mount() {
  const listContainer = document.getElementById('conversations-list');
  if (!listContainer) return;

  try {
    conversationsData = await getConversations();

    if (conversationsData.length === 0) {
      listContainer.innerHTML = '<p class="empty-text">Aucune conversation.</p>';
      return;
    }

    listContainer.innerHTML = conversationsData.map(createConversationItemHtml).join('');

    // Clic sur une conversation
    listContainer.querySelectorAll('.conversation-item').forEach((item) => {
      item.addEventListener('click', () => {
        const convId = parseInt(item.dataset.convId, 10);
        openConversation(convId);
      });
    });

    // Ouvrir automatiquement la première conversation
    if (conversationsData.length > 0) {
      openConversation(conversationsData[0].id);
    }
  } catch (error) {
    listContainer.innerHTML = '<p class="error-message">Erreur de chargement.</p>';
    console.error('Erreur messages :', error);
  }
}
