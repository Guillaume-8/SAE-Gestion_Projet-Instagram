/**
 * @fileoverview Vue de messagerie instantanée temps réel.
 * Intégré du travail de Yanis & Enes.
 * Utilise Socket.io pour le temps réel, avec fallback mock si le
 * backend n'est pas disponible.
 */

import { getConversations, sendMessage } from '../api.js';

let currentConversationId = null;
let conversationsData = [];
let lastMessageDate = null;
let socket = null;
let socketConnected = false;
let allDbUsers = [];
let activeReactionMessageId = null;
let currentEmojiPage = 0;

const EMOJIS_PER_PAGE = 30;
const allEmojis = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","🥲","🥹","☺️","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😮‍💨","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🫣","🤗","🫡","🤔","🫢","🤭","🤫","🤥","😶","😶‍🌫️","😐","😑","😬","🫨","🫠","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","😵‍💫","🫥","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻","💀","☠️","👽","👾","🤖","🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾",
  "🫶","👐","🤲","🙌","👏","🤝","👍","👎","👊","✊","🤛","🤜","🤞","✌️","🫰","🤟","🤘","👌","🤌","🤏","🫳","🫴","👈","👉","👆","👇","☝️","✋","🤚","🖐️","🖖","👋","🤙","🫲","🫱","💪","🦾","🖕","✍️","🙏","🫵","🦶","🦵","🦿","💄","💋","👄","🫦","🦷","👅","👂","🦻","👃","👣","👁️","👀","🫀","🫁","🧠","🗣️","👤","👥","🫂",
  "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷️","🕸️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🦭","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔","🐾","🐉","🐲",
  "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🦴","🌭","🍔","🍟","🍕","🫓","🥪","🥙","🧆","🌮","🌯","🫔","🥗","🥘","🫕","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🫘","🍯","🥛","🍼","🫖","☕","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾","🧊","🥄","🍴","🍽️","🥣","🥡","🥢","🧂",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️","🉑","☢️","☣️","📴","📳","🈶","🈚","🈸","🈺","🈷️","✴️","🆚","💮","🉐","㊙️","㊗️","🈴","🈵","🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️","🆘","❌","⭕","🛑","⛔","📛","🚫","💯","💢","♨️","🚷","🚯","🚳","🚱","🔞","📵","🚭","❗","❕","❓","❔","‼️","⁉️","🔅","🔆","〽️","⚠️","🚸","🔱","⚜️","🔰","♻️","✅","🈯","💹","❇️","✳️","❎","🌐","💠","Ⓜ️","🌀","💤","🏧","🚾","♿","🅿️","🛗","🈳","🈂️","🛂","🛃","🛄","🛅","🚹","🚺","🚼","⚧️","🚻","🚮","🎦","📶","🈁","🆖","🆗","🆙","🆒","🆕","🆓","0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","🔢","#️⃣","*️⃣","⏏️","▶️","⏸️","⏯️","⏹️","⏺️","⏭️","⏮️","⏩","⏪","⏫","⏬","◀️","🔼","🔽","➡️","⬅️","⬆️","⬇️","↗️","↘️","↙️","↖️","↕️","↔️","↪️","↩️","⤴️","⤵️","🔀","🔁","🔂","🔄","🔃","🎵","🎶","➕","➖","➗","✖️","🟰","♾️","💲","💱","™️","©️","®️","〰️","➰","➿","🔚","🔙","🔛","🔝","🔜","✔️","☑️","🔘","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟤","🔺","🔻","🔸","🔹","🔶","🔷","🔳","🔲","▪️","▫️","◾","◽","◼️","◻️","🟥","🟧","🟨","🟩","🟦","🟪","⬛","⬜","🟫","🔈","🔇","🔉","🔊","🔔","🔕","📣","📢","👁️‍🗨️","💬","💭","🗯️","♠️","♣️","♥️","♦️","🃏","🎴","🀄","🕐","🕑","🕒","🕓","🕔","🕕","🕖","🕗","🕘","🕙","🕚","🕛","🕜","🕝","🕞","🕟","🕠","🕡","🕢","🕣","🕤","🕥","🕦","🕧","🚩","🏁","🏴‍☠️","🏳️‍🌈","🏳️‍⚧️"
];

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
 * Tente de connecter Socket.io au backend Node.js (port 3000).
 * @return {boolean} true si connecté.
 */
function tryConnectSocket() {
  try {
    if (typeof io !== 'undefined') {
      socket = io();
      socketConnected = true;
      return true;
    }
  } catch (e) {
    console.info('Socket.io non disponible — mode mock actif');
  }
  socketConnected = false;
  return false;
}

/**
 * Récupère le pseudo de l'utilisateur courant.
 * @return {string} Pseudo.
 */
function getCurrentPseudo() {
  const input = document.getElementById('currentUserInput');
  if (input) return input.value.trim();
  return 'eren_rt';
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
          <button class="btn-new-message" id="btn-new-message" title="Nouveau message">✏️</button>
        </div>

        <div class="user-profile-box">
          <label>Ton pseudonyme</label>
          <input type="text" id="currentUserInput" value="eren_rt">
        </div>

        <div class="conversations-list" id="conversations-list">
          <span class="skeleton-text">Chargement des conversations...</span>
        </div>
      </aside>

      <section class="chat-area" id="chat-area">
        <div class="chat-empty" id="chat-empty">
          <div class="chat-empty-icon">💬</div>
          <p>Vos messages</p>
          <span>Sélectionnez une conversation pour commencer à discuter.</span>
        </div>

        <div id="active-chat" style="display:none; flex-direction:column; height:100%;">
          <div class="chat-header">
            <img src="" alt="" class="chat-header-avatar" id="chat-header-avatar">
            <div class="chat-header-info">
              <span class="chat-header-name" id="chat-header-name">Discussion</span>
              <span class="chat-header-status" id="chat-header-status">En ligne</span>
            </div>
          </div>

          <div class="chat-messages" id="chat-messages"></div>

          <div class="emoji-picker" id="emoji-picker">
            <div class="emoji-header">
              <button type="button" id="emoji-prev"><</button>
              <span id="emoji-page-info">1/1</span>
              <button type="button" id="emoji-next">></button>
            </div>
            <div class="emoji-grid" id="emoji-grid"></div>
            <div class="emoji-categories">
              <span data-page="0" title="Smileys">😀</span>
              <span data-page="3" title="Animaux">🐶</span>
              <span data-page="7" title="Nourriture">🍔</span>
              <span data-page="11" title="Symboles">❤️</span>
            </div>
          </div>

          <form class="chat-input-form" id="chat-input-form">
            <div class="chat-input-wrapper">
              <button type="button" class="btn-emoji" id="btn-emoji" title="Ajouter un émoji">😊</button>
              <input type="text" id="chat-input" placeholder="Écrivez un message..." autocomplete="off">
              <button type="button" id="btn-upload-image" title="Envoyer une image" style="background:none;border:none;font-size:20px;cursor:pointer;padding:4px;color:var(--text-secondary)">📎</button>
              <input type="file" id="image-upload-input" accept="image/*" style="display:none;">
              <button type="submit" class="btn-send-message">Envoyer</button>
            </div>
          </form>
        </div>
      </section>

      <div class="modal-overlay" id="modal-new-chat">
        <div class="modal-content">
          <div class="modal-header">
            <span>Nouveau message</span>
            <span class="modal-close" id="modal-close">&times;</span>
          </div>
          <div class="modal-body">
            <label style="font-size:11px;color:var(--text-secondary)">DM (1 personne)</label>
            <div style="position:relative;display:flex;flex-direction:column;">
              <input type="text" id="target-user-input" placeholder="Pseudo du destinataire" autocomplete="off" style="width:100%;box-sizing:border-box;">
              <div id="users-dropdown-dm" class="users-dropdown"></div>
            </div>
            <button id="btn-start-dm" class="btn-primary">Démarrer le DM</button>

            <hr style="border-color:var(--border-color);margin:5px 0;">

            <label style="font-size:11px;color:var(--text-secondary)">Groupe (3+)</label>
            <div style="position:relative;display:flex;flex-direction:column;">
              <input type="text" id="group-members-input" placeholder="Membres (ex: Lucas, Ines)" autocomplete="off" style="width:100%;box-sizing:border-box;">
              <div id="users-dropdown-group" class="users-dropdown"></div>
            </div>
            <button id="btn-start-group" class="btn-secondary">Créer le groupe</button>
          </div>
        </div>
      </div>

      <div class="lightbox-overlay" id="image-lightbox">
        <span class="lightbox-close" id="lightbox-close">&times;</span>
        <img src="" class="lightbox-img" id="lightbox-img">
      </div>
    </div>
  `;
}

/**
 * Retourne le nom d'affichage d'une conversation.
 * @param {Object} conv Données de la conversation.
 * @return {string} Nom d'affichage.
 */
function getConvDisplayName(conv) {
  const myPseudo = getCurrentPseudo().toLowerCase();
  if (conv.type === 'DM' && Array.isArray(conv.members)) {
    const other = conv.members.find((m) => m.toLowerCase() !== myPseudo);
    if (other) return other;
  }
  if (conv.name && conv.type !== 'DM') return conv.name;
  if (conv.members && conv.members.length === 2) {
    const other = conv.members.find((m) => m.toLowerCase() !== myPseudo);
    if (other) return other;
  }
  return conv.name || 'Groupe #' + conv.id;
}

/**
 * Génère un avatar pour une conversation.
 * @param {Object} conv Données de la conversation.
 * @return {string} URL de l'avatar.
 */
function getConvAvatar(conv) {
  const name = getConvDisplayName(conv);
  return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=random';
}

/**
 * Affiche la liste des conversations.
 */
function renderConversationsList() {
  const listContainer = document.getElementById('conversations-list');
  const myPseudo = getCurrentPseudo().toLowerCase();

  if (conversationsData.length === 0) {
    listContainer.innerHTML = '<span class="skeleton-text">Aucune conversation</span>';
    return;
  }

  listContainer.innerHTML = conversationsData
    .map((conv) => {
      const displayName = getConvDisplayName(conv);
      const avatarUrl = getConvAvatar(conv);
      const isActive = conv.id === currentConversationId ? ' active' : '';

      let dateDisplay = '';
      if (conv.lastMessageDate || conv.lastTime) {
        const d = conv.lastMessageDate ? new Date(conv.lastMessageDate) : null;
        if (d) {
          dateDisplay = d.toLocaleDateString('fr-FR', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          });
        } else {
          dateDisplay = escapeHtml(conv.lastTime || '');
        }
      }

      const previewText = (conv.lastMessage || '').startsWith('[IMAGE]:')
        ? '📷 Image'
        : escapeHtml(conv.lastMessage || '');

      const senderPrefix = conv.lastMessageSender
        ? escapeHtml(conv.lastMessageSender) + ': '
        : '';

      return '<div class="conversation-item' + isActive + '" data-conv-id="' + conv.id + '">' +
        '<img src="' + avatarUrl + '" alt="' + escapeHtml(displayName) + '" class="conv-avatar">' +
        '<div class="conv-info">' +
        '<span class="conv-name">' + escapeHtml(displayName) + '</span>' +
        '<span class="conv-preview">' + senderPrefix + previewText +
        (dateDisplay ? '<br><small style="font-size:10px;opacity:0.6;">' + dateDisplay + '</small>' : '') +
        '</span>' +
        '</div>' +
        '<button class="btn-delete-conv" title="Supprimer">🗑️</button>' +
        '</div>';
    })
    .join('');

  listContainer.querySelectorAll('.conversation-item').forEach((item) => {
    const id = parseInt(item.dataset.convId, 10);

    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('btn-delete-conv')) {
        openConversation(id);
      }
    });

    const btnDelete = item.querySelector('.btn-delete-conv');
    if (btnDelete) {
      btnDelete.addEventListener('click', async (e) => {
        e.stopPropagation();
        await supprimerConversation(id);
      });
    }
  });
}

/**
 * Supprime une conversation.
 * @param {number} convId Identifiant de la conversation.
 */
async function supprimerConversation(convId) {
  const myPseudo = getCurrentPseudo();
  if (!confirm('Voulez-vous supprimer cette conversation ?')) return;

  if (socketConnected) {
    try {
      const res = await fetch('/api/conversations/' + convId, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({pseudonyme: myPseudo}),
      });
      if (!res.ok) throw new Error('Échec');
    } catch (e) {
      console.error('Erreur suppression:', e);
    }
  }

  conversationsData = conversationsData.filter((c) => c.id !== convId);
  if (currentConversationId === convId) {
    currentConversationId = null;
    document.getElementById('active-chat').style.display = 'none';
    document.getElementById('chat-empty').style.display = 'flex';
  }
  renderConversationsList();
}

/**
 * Ouvre une conversation et charge ses messages.
 * @param {number} convId Identifiant de la conversation.
 */
async function openConversation(convId) {
  const conv = conversationsData.find((c) => c.id === convId);
  if (!conv) return;

  currentConversationId = convId;
  const displayName = getConvDisplayName(conv);
  const avatarUrl = getConvAvatar(conv);

  document.getElementById('chat-empty').style.display = 'none';
  document.getElementById('active-chat').style.display = 'flex';
  document.getElementById('chat-header-name').innerText = displayName;
  document.getElementById('chat-header-status').innerText = 'En ligne';
  document.getElementById('chat-header-avatar').src = avatarUrl;

  localStorage.setItem('read_date_' + convId, new Date().toISOString());
  renderConversationsList();

  const box = document.getElementById('chat-messages');
  box.innerHTML = '';
  lastMessageDate = null;

  if (socketConnected && socket) {
    socket.emit('join_group', convId);
    try {
      const res = await fetch('/api/messages/' + convId);
      const messages = await res.json();
      messages.forEach((msg) => {
        appendMessage(
          msg.id_message,
          msg.Pseudonyme_utilisateur,
          msg.Contenu_message,
          msg.Date_message,
          msg.reactions || [],
        );
      });
    } catch (e) {
      console.error('Erreur chargement messages:', e);
    }
  } else {
    // Mode mock : afficher les messages de la conversation
    const mockMessages = conv.messages || [];
    mockMessages.forEach((msg) => {
      appendMessage(
        msg.id,
        msg.sender === 'me' ? getCurrentPseudo() : (conv.name || 'Autre'),
        msg.text,
        null,
        [],
      );
    });
  }
}

/**
 * Ajoute un message à la zone de chat.
 * @param {number} idMessage ID du message.
 * @param {string} sender Pseudo de l'expéditeur.
 * @param {string} text Contenu du message.
 * @param {string} dateString Date du message.
 * @param {Array} reactions Réactions du message.
 */
function appendMessage(idMessage, sender, text, dateString, reactions) {
  const currentUser = getCurrentPseudo();
  const box = document.getElementById('chat-messages');
  const isMe = sender.toLowerCase() === currentUser.toLowerCase();

  const dateObj = dateString ? new Date(dateString) : new Date();

  if (lastMessageDate) {
    const diffHours = (dateObj - lastMessageDate) / (1000 * 60 * 60);
    if (diffHours >= 2) {
      const separator = document.createElement('div');
      separator.style.cssText = 'text-align:center;margin:15px 0;color:var(--text-secondary);font-size:12px;font-weight:bold;';
      separator.innerText = dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      box.appendChild(separator);
    }
  }
  lastMessageDate = dateObj;

  const div = document.createElement('div');
  div.className = 'message-container ' + (isMe ? 'mine' : 'other');
  div.id = 'msg-container-' + idMessage;

  const timeStr = dateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});

  const reactCounts = {};
  reactions.forEach((r) => {
    reactCounts[r.emoji] = (reactCounts[r.emoji] || 0) + 1;
  });
  const reactionsHtml = Object.keys(reactCounts)
    .map((emoji) => '<span class="reaction-badge">' + emoji + (reactCounts[emoji] > 1 ? ' ' + reactCounts[emoji] : '') + '</span>')
    .join('');

  const isImage = text && text.startsWith('[IMAGE]:');
  const imageHtml = isImage
    ? '<img src="' + text.substring(8) + '" class="msg-image" data-src="' + text.substring(8) + '">'
    : '';
  const contentHtml = isImage ? imageHtml : '<p>' + escapeHtml(text) + '</p>';

  const actionsHtml = isMe ? '' :
    '<div class="message-actions">' +
    '<span data-msg="' + idMessage + '" data-emoji="❤️">❤️</span>' +
    '<span data-msg="' + idMessage + '" data-emoji="👍">👍</span>' +
    '<span data-msg="' + idMessage + '" data-emoji="👎">👎</span>' +
    '<span data-msg="' + idMessage + '" data-emoji="➕">➕</span>' +
    '</div>';

  div.innerHTML =
    actionsHtml +
    '<div class="message-bubble">' +
    contentHtml +
    '<span class="message-time" style="display:flex;justify-content:space-between;gap:10px;">' +
    '<span>' + escapeHtml(sender) + '</span>' +
    '<span>' + timeStr + '</span>' +
    '</span>' +
    '</div>' +
    '<div class="message-reactions" id="reactions-' + idMessage + '">' + reactionsHtml + '</div>';

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/**
 * Envoie une réaction sur un message.
 * @param {number} idMessage ID du message.
 * @param {string} emoji Emoji de la réaction.
 */
function sendReaction(idMessage, emoji) {
  if (!currentConversationId) return;
  const currentUser = getCurrentPseudo();

  if (socketConnected && socket) {
    socket.emit('send_reaction', {
      idMessage: idMessage,
      pseudonyme: currentUser,
      emoji: emoji,
      idGroupe: currentConversationId,
    });
  } else {
    // Mode mock : mettre à jour visuellement
    const container = document.getElementById('reactions-' + idMessage);
    if (container) {
      const badge = document.createElement('span');
      badge.className = 'reaction-badge';
      badge.innerText = emoji;
      container.appendChild(badge);
    }
  }
}

/**
 * Affiche une page d'emojis.
 */
function renderEmojiPage() {
  const emojiGrid = document.getElementById('emoji-grid');
  const emojiPageInfo = document.getElementById('emoji-page-info');
  if (!emojiGrid) return;

  emojiGrid.innerHTML = '';
  const start = currentEmojiPage * EMOJIS_PER_PAGE;
  const end = start + EMOJIS_PER_PAGE;
  const pageEmojis = allEmojis.slice(start, end);
  const totalEmojiPages = Math.ceil(allEmojis.length / EMOJIS_PER_PAGE);

  pageEmojis.forEach((emoji) => {
    const span = document.createElement('span');
    span.innerText = emoji;
    span.addEventListener('click', () => {
      if (activeReactionMessageId) {
        sendReaction(activeReactionMessageId, emoji);
        document.getElementById('emoji-picker').classList.remove('active');
        activeReactionMessageId = null;
      } else {
        const chatInput = document.getElementById('chat-input');
        chatInput.value += emoji;
        chatInput.focus();
      }
    });
    emojiGrid.appendChild(span);
  });

  emojiPageInfo.innerText = (currentEmojiPage + 1) + '/' + totalEmojiPages;
}

/**
 * Charge les conversations de l'utilisateur.
 */
async function chargerConversations() {
  const currentUser = getCurrentPseudo();
  if (!currentUser) return;

  if (socketConnected) {
    try {
      const res = await fetch('/api/conversations/' + encodeURIComponent(currentUser));
      conversationsData = await res.json();
    } catch (e) {
      console.error('Erreur chargement conversations:', e);
      conversationsData = [];
    }
  } else {
    // Mode mock
    conversationsData = await getConversations();
  }

  renderConversationsList();
}

/**
 * Récupère la liste des utilisateurs depuis l'API.
 */
async function fetchDbUsers() {
  if (!socketConnected) return;
  try {
    const res = await fetch('/api/utilisateurs');
    allDbUsers = await res.json();
  } catch (e) {
    console.error(e);
  }
}

/**
 * Configure un dropdown d'autocomplétion d'utilisateurs.
 * @param {string} inputId ID de l'input.
 * @param {string} dropdownId ID du dropdown.
 * @param {boolean} multi Sélection multiple.
 */
function setupUsersDropdown(inputId, dropdownId, multi) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  const showDropdown = () => {
    const myPseudo = getCurrentPseudo().toLowerCase();
    dropdown.innerHTML = '';

    let currentSelected = [];
    if (multi) {
      currentSelected = input.value.split(',').map((s) => s.trim().toLowerCase()).filter((s) => s);
    }

    const availableUsers = allDbUsers.filter((u) => {
      const lowerU = u.toLowerCase();
      return lowerU !== myPseudo && !currentSelected.includes(lowerU);
    });

    if (availableUsers.length === 0) {
      dropdown.innerHTML = '<div style="padding:8px 12px;font-size:11px;color:var(--text-secondary);">Aucun utilisateur</div>';
    } else {
      availableUsers.forEach((u) => {
        const item = document.createElement('div');
        item.className = 'users-dropdown-item';
        item.innerText = u;
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          if (multi) {
            let current = input.value.split(',').map((s) => s.trim()).filter((s) => s);
            if (current.length < 10) {
              if (!current.includes(u)) {
                current.push(u);
                input.value = current.join(', ') + (current.length < 9 ? ', ' : '');
              }
            } else {
              alert('Limite de 10 utilisateurs atteinte.');
            }
          } else {
            input.value = u;
          }
          dropdown.style.display = 'none';
        });
        dropdown.appendChild(item);
      });
    }
    dropdown.style.display = 'flex';
  };

  input.addEventListener('focus', showDropdown);
  input.addEventListener('click', showDropdown);
  input.addEventListener('blur', () => {
    dropdown.style.display = 'none';
  });
}

/**
 * Ouvre la lightbox pour une image.
 * @param {string} src URL de l'image.
 */
function openLightbox(src) {
  const lightbox = document.getElementById('image-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  lightboxImg.src = src;
  lightbox.style.display = 'flex';
}

/**
 * Monte la vue : installe tous les event listeners.
 */
export async function mount() {
  // Tenter la connexion Socket.io
  tryConnectSocket();

  // Charger les conversations
  await chargerConversations();

  // Si Socket.io est connecté, configurer les listeners temps réel
  if (socketConnected && socket) {
    socket.on('receive_message', (msg) => {
      const conv = conversationsData.find((c) => c.id === msg.id_groupe);
      if (conv) {
        conv.lastMessage = msg.Contenu_message;
        conv.lastMessageSender = msg.Pseudonyme_utilisateur;
        conv.lastMessageDate = msg.Date_message;

        if (msg.id_groupe === currentConversationId) {
          localStorage.setItem('read_date_' + msg.id_groupe, new Date().toISOString());
          appendMessage(msg.id_message, msg.Pseudonyme_utilisateur, msg.Contenu_message, msg.Date_message, msg.reactions || []);
        }
        renderConversationsList();
      }
    });

    socket.on('receive_reaction', (data) => {
      const reactionsContainer = document.getElementById('reactions-' + data.idMessage);
      if (!reactionsContainer) return;

      let badge = Array.from(reactionsContainer.children).find((b) => b.innerText.includes(data.emoji));

      if (data.action === 'added') {
        if (badge) {
          const match = badge.innerText.match(/\d+/);
          const count = match ? parseInt(match[0]) + 1 : 2;
          badge.innerText = data.emoji + ' ' + count;
        } else {
          const newBadge = document.createElement('span');
          newBadge.className = 'reaction-badge';
          newBadge.innerText = data.emoji;
          reactionsContainer.appendChild(newBadge);
        }
      } else if (data.action === 'removed') {
        if (badge) {
          const match = badge.innerText.match(/\d+/);
          const count = match ? parseInt(match[0]) : 1;
          if (count > 2) {
            badge.innerText = data.emoji + ' ' + (count - 1);
          } else if (count === 2) {
            badge.innerText = data.emoji;
          } else {
            badge.remove();
          }
        }
      }
    });

    socket.on('group_created', (newConv) => {
      const myPseudo = getCurrentPseudo().toLowerCase();
      const isMember = Array.isArray(newConv.members) &&
        newConv.members.some((m) => m.toLowerCase() === myPseudo);

      if (isMember && !conversationsData.some((c) => c.id === newConv.id)) {
        conversationsData.unshift(newConv);
        renderConversationsList();
      }
    });
  }

  // Ouvrir la première conversation automatiquement
  if (conversationsData.length > 0) {
    openConversation(conversationsData[0].id);
  }

  // --- Event listeners ---

  // Changement de pseudo
  const currentUserInput = document.getElementById('currentUserInput');
  currentUserInput.addEventListener('change', chargerConversations);

  // Formulaire d'envoi de message
  document.getElementById('chat-input-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const currentUser = getCurrentPseudo();

    if (!text || !currentConversationId) return;

    if (socketConnected && socket) {
      socket.emit('send_message', {
        pseudonyme: currentUser,
        idGroupe: currentConversationId,
        contenu: text,
      });
    } else {
      // Mode mock
      appendMessage(Date.now(), currentUser, text, null, []);
      const conv = conversationsData.find((c) => c.id === currentConversationId);
      if (conv) {
        conv.lastMessage = text;
        conv.lastMessageSender = currentUser;
        renderConversationsList();
      }
    }

    input.value = '';
    document.getElementById('emoji-picker').classList.remove('active');
  });

  // Upload d'image
  const imageUploadInput = document.getElementById('image-upload-input');
  const btnUploadImage = document.getElementById('btn-upload-image');

  btnUploadImage.addEventListener('click', () => imageUploadInput.click());
  imageUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !currentConversationId) return;

    const currentUser = getCurrentPseudo();

    if (socketConnected && socket) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        const extension = '.' + file.name.split('.').pop();
        socket.emit('send_image', {
          pseudonyme: currentUser,
          idGroupe: currentConversationId,
          imageBase64: base64,
          extension: extension,
        });
      };
      reader.readAsDataURL(file);
    }
    imageUploadInput.value = '';
  });

  // --- Emoji picker ---
  const emojiBtn = document.getElementById('btn-emoji');
  const emojiPicker = document.getElementById('emoji-picker');
  const emojiGrid = document.getElementById('emoji-grid');
  const emojiPrev = document.getElementById('emoji-prev');
  const emojiNext = document.getElementById('emoji-next');

  emojiBtn.addEventListener('click', () => {
    activeReactionMessageId = null;
    emojiPicker.classList.toggle('active');
    if (emojiPicker.classList.contains('active') && emojiGrid.innerHTML === '') {
      renderEmojiPage();
    }
  });

  emojiPrev.addEventListener('click', () => {
    if (currentEmojiPage > 0) {
      currentEmojiPage--;
      renderEmojiPage();
    }
  });

  emojiNext.addEventListener('click', () => {
    const totalEmojiPages = Math.ceil(allEmojis.length / EMOJIS_PER_PAGE);
    if (currentEmojiPage < totalEmojiPages - 1) {
      currentEmojiPage++;
      renderEmojiPage();
    }
  });

  document.querySelectorAll('.emoji-categories span').forEach((catBtn) => {
    catBtn.addEventListener('click', () => {
      currentEmojiPage = parseInt(catBtn.dataset.page, 10);
      renderEmojiPage();
    });
  });

  // --- Réactions sur messages (délégation) ---
  document.getElementById('chat-messages').addEventListener('click', (e) => {
    const actionSpan = e.target.closest('.message-actions span');
    if (actionSpan) {
      const msgId = parseInt(actionSpan.dataset.msg, 10);
      const emoji = actionSpan.dataset.emoji;

      if (emoji === '➕') {
        activeReactionMessageId = msgId;
        emojiPicker.classList.add('active');
        if (emojiGrid.innerHTML === '') {
          renderEmojiPage();
        }
      } else {
        sendReaction(msgId, emoji);
      }
    }

    // Lightbox pour les images
    const msgImg = e.target.closest('.msg-image');
    if (msgImg) {
      openLightbox(msgImg.dataset.src || msgImg.src);
    }
  });

  // --- Lightbox ---
  document.getElementById('lightbox-close').addEventListener('click', () => {
    document.getElementById('image-lightbox').style.display = 'none';
  });
  document.getElementById('image-lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'image-lightbox') {
      e.target.style.display = 'none';
    }
  });

  // --- Modale nouveau message ---
  const modal = document.getElementById('modal-new-chat');

  document.getElementById('btn-new-message').addEventListener('click', () => {
    modal.style.display = 'flex';
    fetchDbUsers();
  });

  document.getElementById('modal-close').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Autocomplétion utilisateurs
  setupUsersDropdown('target-user-input', 'users-dropdown-dm', false);
  setupUsersDropdown('group-members-input', 'users-dropdown-group', true);

  // Démarrer un DM
  document.getElementById('btn-start-dm').addEventListener('click', async () => {
    const myPseudo = getCurrentPseudo();
    const target = document.getElementById('target-user-input').value.trim();
    if (!target) return;

    if (socketConnected) {
      try {
        const res = await fetch('/api/dm', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({pseudo1: myPseudo, pseudo2: target}),
        });
        const data = await res.json();
        if (!conversationsData.some((c) => c.id === data.conv.id)) {
          conversationsData.unshift(data.conv);
        }
        modal.style.display = 'none';
        openConversation(data.idGroupe);
      } catch (e) {
        console.error('Erreur création DM:', e);
      }
    } else {
      // Mode mock
      const newConv = {
        id: Date.now(),
        name: target,
        type: 'DM',
        members: [myPseudo, target],
        lastMessage: 'Discussion démarrée',
        lastTime: 'Maintenant',
        messages: [],
      };
      conversationsData.unshift(newConv);
      modal.style.display = 'none';
      renderConversationsList();
      openConversation(newConv.id);
    }
  });

  // Créer un groupe
  document.getElementById('btn-start-group').addEventListener('click', async () => {
    const myPseudo = getCurrentPseudo();
    const input = document.getElementById('group-members-input').value.trim();
    if (!input) return;

    const membres = input.split(',').map((m) => m.trim());

    if (socketConnected) {
      try {
        const res = await fetch('/api/groupe', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({createur: myPseudo, membres}),
        });
        const data = await res.json();
        if (!conversationsData.some((c) => c.id === data.conv.id)) {
          conversationsData.unshift(data.conv);
        }
        modal.style.display = 'none';
        openConversation(data.idGroupe);
      } catch (e) {
        console.error('Erreur création groupe:', e);
      }
    } else {
      const newConv = {
        id: Date.now(),
        name: 'Groupe (' + (membres.length + 1) + ')',
        type: 'GROUPE',
        members: [myPseudo, ...membres],
        lastMessage: 'Groupe créé',
        lastTime: 'Maintenant',
        messages: [],
      };
      conversationsData.unshift(newConv);
      modal.style.display = 'none';
      renderConversationsList();
      openConversation(newConv.id);
    }
  });
}
