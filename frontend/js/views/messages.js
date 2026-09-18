/**
 * @fileoverview Vue de messagerie instantanée temps réel.
 * Intégré du travail de Yanis & Enes (version 2 : réactions, réponses,
 * édition avec historique, médias photo/vidéo, messages vocaux, GIFs,
 * indicateur de saisie, détails de groupe).
 * Utilise Socket.io ; repli mock si le backend n'est pas disponible.
 */

import { getConversations } from '../api.js';
import {showToast} from '../toast.js';
import {addNotification} from '../notification.js';

let currentConversationId = null;
let conversationsData = [];
let lastMessageDate = null;
let socket = null;
let socketConnected = false;
let allDbUsers = [];
let activeReactionMessageId = null;
let activeOptionsMessageId = null;
let currentEmojiPage = 0;
let replyingTo = null;
let unreadCount = 0;
let toastTimer = null;
let typingTimeout = null;
let activeTypers = new Set();
let mediaRecorder = null;
let audioChunks = [];
let recordTimerInterval = null;
let recordSeconds = 0;
let cancelRecording = false;
let gifSearchTimeout = null;

const EMOJIS_PER_PAGE = 30;
const allEmojis = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","🥲","🥹","☺️","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😮‍💨","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🫣","🤗","🫡","🤔","🫢","🤭","🤫","🤥","😶","😶‍🌫️","😐","😑","😬","🫨","🫠","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","😵‍💫","🫥","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻","💀","☠️","👽","👾","🤖","🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾",
  "🫶","👐","🤲","🙌","👏","🤝","👍","👎","👊","✊","🤛","🤜","🤞","✌️","🫰","🤟","🤘","👌","🤌","🤏","🫳","🫴","👈","👉","👆","👇","☝️","✋","🤚","🖐️","🖖","👋","🤙","🫲","🫱","💪","🦾","✍️","🙏","🫵","🦶","🦵","🦿","💄","💋","👄","🫦","🦷","👅","👂","🦻","👃","👣","👁️","👀","🫀","🫁","🧠","🗣️","👤","👥","🫂",
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
 * Le socket est partagé avec le centre de notifications.
 * @return {boolean} true si connecté.
 */
function tryConnectSocket() {
  try {
    if (typeof io !== 'undefined' || typeof window.io !== 'undefined') {
      const ioFn = typeof io !== 'undefined' ? io : window.io;
      if (!window.socket) {
        window.socket = ioFn();
      }
      socket = window.socket;
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
  return input ? input.value.trim() : '';
}

/**
 * Joue un son discret de notification (Web Audio, sans fichier).
 */
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

/**
 * Affiche le toast interne de la messagerie (nouveau message).
 * @param {string} title Titre du toast.
 * @param {string} body Aperçu du message.
 * @param {number} groupId Conversation concernée.
 */
function showMessengerToast(title, body, groupId) {
  const toast = document.getElementById('notification-toast');
  if (!toast) return;
  document.getElementById('toast-title').innerText = title;
  document.getElementById('toast-body').innerText = body;
  toast.onclick = () => {
    openConversation(groupId);
    toast.classList.remove('show');
  };
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}

/**
 * Retire le préfixe [REPLY:…] d'un contenu de message.
 * @param {string} raw Contenu brut.
 * @return {string} Contenu sans le préfixe de réponse.
 */
function stripReplyPrefix(raw) {
  if (raw && raw.startsWith('[REPLY:')) {
    const idx = raw.indexOf(']');
    if (idx > -1) return raw.substring(idx + 1);
  }
  return raw || '';
}

/**
 * Rend le squelette HTML de la vue Messagerie.
 * @return {string} HTML de la vue.
 */
export function render() {
  return `
    <div id="notification-toast">
      <span id="toast-title">Nouveau message</span>
      <span id="toast-body">...</span>
    </div>

    <div id="history-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <span>Historique des modifications</span>
          <span class="modal-close" id="history-modal-close">&times;</span>
        </div>
        <div class="modal-body" id="history-modal-body" style="max-height:350px;overflow-y:auto;color:white;font-size:13px;display:flex;flex-direction:column;gap:10px;"></div>
      </div>
    </div>

    <div class="messages-page">
      <aside class="conversations-sidebar" id="conversations-sidebar">
        <div class="sidebar-header">
          <h2>Messages</h2>
          <button class="btn-new-message" id="btn-new-message" title="Nouveau message">+</button>
        </div>

        <div class="user-profile-box">
          <label>Ton pseudonyme</label>
          <input type="text" id="currentUserInput" value="${escapeHtml(localStorage.getItem('instaclone_user') || 'eren_rt')}">
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
          <div class="chat-header" id="chat-header" style="cursor:pointer;">
            <img src="" alt="" class="chat-header-avatar" id="chat-header-avatar">
            <div class="chat-header-info">
              <span class="chat-header-name" id="chat-header-name">Discussion</span>
              <span class="chat-header-status" id="chat-header-status">En ligne</span>
            </div>
          </div>

          <div class="chat-messages" id="chat-messages"></div>

          <div class="gif-picker" id="gif-picker" style="display:none; flex-direction:column; position:absolute; bottom:70px; right:20px; background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:10px; width:300px; z-index:50;">
            <div style="display:flex; margin-bottom:8px;">
              <input type="text" id="gif-search-input" placeholder="Rechercher un GIF..." style="flex:1; background:var(--bg-color); border:1px solid var(--border-color); color:white; padding:6px 10px; border-radius:6px; font-size:12px; outline:none;">
            </div>
            <div class="gif-grid" id="gif-grid" style="display:grid; grid-template-columns:repeat(2,1fr); gap:6px; overflow-y:auto; max-height:250px;"></div>
          </div>

          <div class="emoji-picker" id="emoji-picker">
            <div class="emoji-header">
              <button type="button" id="emoji-prev"><</button>
              <span id="emoji-page-info">1/1</span>
              <button type="button" id="emoji-next">></button>
            </div>
            <div class="emoji-grid" id="emoji-grid"></div>
            <div class="emoji-categories">
              <span data-page="0" title="Smileys & Personnes">😀</span>
              <span data-page="3" title="Animaux & Nature">🐶</span>
              <span data-page="7" title="Nourriture & Boissons">🍔</span>
              <span data-page="11" title="Symboles & Objets">❤️</span>
            </div>
          </div>

          <form class="chat-input-form" id="chat-input-form">
            <div id="reply-preview-container" style="display:none; background:var(--card-bg); padding:8px 12px; border-left:4px solid var(--accent-color); margin-bottom:5px; border-radius:8px; position:relative;">
              <span style="font-weight:bold; font-size:12px; color:var(--accent-color);" id="reply-preview-sender"></span>
              <p style="font-size:12px; color:var(--text-secondary); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:15px;" id="reply-preview-text"></p>
              <span id="btn-cancel-reply" style="position:absolute; right:10px; top:10px; cursor:pointer; color:var(--text-secondary); font-size:14px; font-weight:bold;">&times;</span>
            </div>

            <div id="upload-progress-container" style="display:none; background:var(--card-bg); padding:10px; border-radius:8px; margin-bottom:5px;">
              <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:5px; color:var(--text-secondary);">
                <span>Envoi du fichier...</span>
                <span id="upload-progress-text">0%</span>
              </div>
              <div style="background:var(--bg-color); border-radius:10px; width:100%; height:6px; overflow:hidden;">
                <div id="upload-progress-bar" style="background:var(--accent-color); width:0%; height:100%; transition:width 0.1s;"></div>
              </div>
            </div>

            <div class="chat-input-wrapper">
              <button type="button" class="btn-emoji" id="btn-emoji" title="Ajouter un émoji">😊</button>
              <input type="text" id="chat-input" placeholder="Écrivez un message..." autocomplete="off">
              <button type="button" id="btn-gif" title="Envoyer un GIF" style="background:white; border:none; font-size:10px; cursor:pointer; padding:4px; color:black; border-radius:4px; font-weight:bold; margin-right:4px; height:20px; width:28px;">GIF</button>
              <button type="button" id="btn-attachment" title="Pièces jointes" style="background:none; border:none; font-size:20px; cursor:pointer; padding:4px; color:var(--text-secondary);">+</button>

              <div id="attachment-menu" style="display:none; position:absolute; bottom:60px; right:80px; background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:8px; flex-direction:column; gap:4px; z-index:60; width:120px;">
                <div class="users-dropdown-item" id="btn-menu-image" style="border-radius:6px;">Photo / Vidéo</div>
                <div class="users-dropdown-item" id="btn-menu-vocal" style="border-radius:6px;">Message vocal</div>
              </div>

              <input type="file" id="image-upload-input" accept="image/*,video/*" style="display:none;">
              <button type="submit" class="btn-send-message" id="btn-send-message" disabled style="color:#545454; cursor:default;">Envoyer</button>
            </div>

            <div id="recording-ui" style="display:none; flex:1; align-items:center; justify-content:space-between; background:#ff4040; border-radius:22px; padding:8px 15px; color:white;">
              <span style="font-size:13px; font-weight:bold;">🔴 Enregistrement... (<span id="recording-time">0:00</span>)</span>
              <div style="display:flex; gap:10px;">
                <button type="button" id="btn-cancel-record" style="background:transparent; border:none; color:white; cursor:pointer; font-size:13px;">Annuler</button>
                <button type="button" id="btn-stop-record" style="background:white; border:none; color:#ff4040; cursor:pointer; font-size:13px; font-weight:bold; padding:4px 10px; border-radius:12px;">Envoyer</button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <aside class="group-details-sidebar" id="group-details-sidebar">
        <div class="group-details-header">
          Détails
          <span id="group-details-close">&times;</span>
        </div>
        <div class="group-details-body">
          <div class="group-photo-edit-container" id="group-photo-edit">
            <img id="group-details-photo" src="" alt="Photo du groupe">
            <div class="group-photo-overlay">Modifier</div>
          </div>
          <input type="file" id="group-photo-input" accept="image/*" style="display:none;">

          <div class="group-details-section" id="group-name-section">
            <div class="group-details-title">Nom du groupe</div>
            <div class="group-name-input-container">
              <input type="text" id="group-name-input" placeholder="Nom du groupe...">
              <button type="button" id="btn-save-group-name" title="Enregistrer">Enregistrer</button>
            </div>
          </div>

          <div class="group-details-section" id="group-media-section">
            <div style="display:flex; gap:5px; margin-bottom:10px;">
              <button type="button" id="tab-media-imgvid" style="flex:1; padding:6px; background:#363636; border:none; color:white; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;">Images & Vidéos</button>
              <button type="button" id="tab-media-gifs" style="flex:1; padding:6px; background:var(--bg-color); border:none; color:var(--text-secondary); border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;">GIFs</button>
            </div>
            <div>
              <div id="media-images-videos" style="display:grid; grid-template-columns:repeat(3,1fr); gap:4px; max-height:250px; overflow-y:auto;"></div>
              <div id="media-gifs" style="display:none; grid-template-columns:repeat(3,1fr); gap:4px; max-height:250px; overflow-y:auto;"></div>
            </div>
          </div>

          <div class="group-details-section">
            <div class="group-details-title" id="group-members-count">Membres</div>
            <div id="group-members-list"></div>
          </div>
        </div>
      </aside>

      <div class="modal-overlay" id="modal-new-chat">
        <div class="modal-content">
          <div class="modal-header">
            <span>Nouveau message</span>
            <span class="modal-close" id="modal-close">&times;</span>
          </div>
          <div class="modal-body">
            <label style="font-size:11px; color:var(--text-secondary);">DM (1 personne)</label>
            <div style="position:relative; display:flex; flex-direction:column;">
              <input type="text" id="target-user-input" placeholder="Pseudo du destinataire" autocomplete="off" style="width:100%; box-sizing:border-box;">
              <div id="users-dropdown-dm" class="users-dropdown"></div>
            </div>
            <button id="btn-start-dm" class="btn-primary">Démarrer le DM</button>

            <hr style="border-color:var(--border-color); margin:5px 0;">

            <label style="font-size:11px; color:var(--text-secondary);">Groupe (3+)</label>
            <div style="position:relative; display:flex; flex-direction:column;">
              <input type="text" id="group-members-input" placeholder="Membres (ex: Lucas, Ines)" autocomplete="off" style="width:100%; box-sizing:border-box;">
              <div id="users-dropdown-group" class="users-dropdown"></div>
            </div>
            <button id="btn-start-group" class="btn-secondary">Créer le groupe</button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" id="modal-message-options">
        <div class="modal-content" style="width:250px;">
          <div class="modal-header">
            <span>Options du message</span>
            <span class="modal-close" id="modal-options-close">&times;</span>
          </div>
          <div class="modal-body" style="padding:10px;">
            <button id="btn-reply-message" class="btn-secondary" style="width:100%; margin-bottom:8px;">Répondre</button>
            <button id="btn-edit-message" class="btn-primary" style="width:100%; margin-bottom:8px;">Modifier</button>
            <button id="btn-delete-message" class="btn-secondary" style="width:100%; background:#ed4956;">Supprimer</button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" id="modal-edit-message">
        <div class="modal-content" style="width:300px;">
          <div class="modal-header">
            <span>Modifier le message</span>
            <span class="modal-close" id="modal-edit-close">&times;</span>
          </div>
          <div class="modal-body" style="padding:10px;">
            <input type="text" id="edit-message-input" style="width:100%; margin-bottom:10px;" autocomplete="off">
            <button id="btn-save-edit" class="btn-primary" style="width:100%;">Enregistrer</button>
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
  return conv.name || 'Groupe #' + conv.id;
}

/**
 * Génère un avatar pour une conversation.
 * @param {Object} conv Données de la conversation.
 * @return {string} URL de l'avatar.
 */
function getConvAvatar(conv) {
  if (conv.photo_groupe) return conv.photo_groupe;
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

      const isUnread = conv.lastMessageSender
        && conv.lastMessageSender.toLowerCase() !== myPseudo
        && (!localStorage.getItem('read_date_' + conv.id) ||
            new Date(conv.lastMessageDate) > new Date(localStorage.getItem('read_date_' + conv.id)));
      const unreadClass = isUnread ? 'font-weight:700; color:#fff;' : '';

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

      const rawText = stripReplyPrefix(conv.lastMessage || '');
      const previewText = rawText.startsWith('[IMAGE]:') ? '📷 Image'
        : (rawText.startsWith('[VIDEO]:') ? '🎥 Vidéo'
          : (rawText.startsWith('[AUDIO]:') ? 'Message vocal' : escapeHtml(rawText)));

      const senderPrefix = conv.lastMessageSender
        ? escapeHtml(conv.lastMessageSender) + ': '
        : '';

      return '<div class="conversation-item' + isActive + '" data-conv-id="' + conv.id + '">' +
        '<img src="' + avatarUrl + '" alt="' + escapeHtml(displayName) + '" class="conv-avatar">' +
        '<div class="conv-info">' +
        '<span class="conv-name">' + escapeHtml(displayName) + '</span>' +
        '<span class="conv-preview" style="' + unreadClass + '">' + senderPrefix + previewText +
        (dateDisplay ? '<br><small style="font-size:10px; opacity:0.6;">' + dateDisplay + '</small>' : '') +
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

  activeTypers.clear();
  updateTypingStatus();

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
          msg.est_modifie === 1,
        );
      });
    } catch (e) {
      console.error('Erreur chargement messages:', e);
    }
  } else {
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

  closeGroupDetails();
}

/**
 * Ajoute un message à la zone de chat.
 * @param {number} idMessage ID du message.
 * @param {string} sender Pseudo de l'expéditeur.
 * @param {string} text Contenu du message (préfixes [REPLY:] [IMAGE:] [VIDEO:] [AUDIO]:).
 * @param {string} dateString Date du message.
 * @param {Array} reactions Réactions du message.
 * @param {boolean} isEdited Message déjà modifié.
 */
function appendMessage(idMessage, sender, text, dateString, reactions = [], isEdited = false) {
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

  // Réponse citée : [REPLY:base64]
  let replyHtml = '';
  let parsedText = text || '';
  if (parsedText.startsWith('[REPLY:')) {
    const closingIdx = parsedText.indexOf(']');
    if (closingIdx > -1) {
      try {
        const replyData = JSON.parse(atob(parsedText.substring(7, closingIdx)));
        parsedText = parsedText.substring(closingIdx + 1);
        let previewText = replyData.text;
        if (previewText && previewText.startsWith('[IMAGE]:')) previewText = '📷 Image';
        if (previewText && previewText.startsWith('[VIDEO]:')) previewText = '🎥 Vidéo';
        if (previewText && previewText.startsWith('[AUDIO]:')) previewText = 'Message vocal';
        replyHtml =
          '<div class="reply-quote" data-target="msg-container-' + replyData.id + '"' +
          ' style="cursor:pointer; background:var(--bg-color); padding:10px 14px; border-left:4px solid rgba(255,255,255,0.4);' +
          ' border-radius:14px; margin-bottom:8px; font-size:12px; width:100%; box-sizing:border-box; overflow:hidden;">' +
          '<strong style="color:#fff; font-size:13px;">' + escapeHtml(replyData.sender) + '</strong><br>' +
          '<span style="color:rgba(255,255,255,0.85); white-space:nowrap;">' + escapeHtml(previewText) + '</span></div>';
      } catch (e) {}
    }
  }

  const contentHtml = parsedText.startsWith('[IMAGE]:')
    ? '<img src="' + parsedText.substring(8) + '" class="msg-image" data-src="' + parsedText.substring(8) + '" style="max-width:100%; max-height:250px; border-radius:8px; margin-bottom:5px; cursor:pointer;" title="Cliquez pour agrandir">'
    : (parsedText.startsWith('[VIDEO]:')
      ? '<video controls src="' + parsedText.substring(8) + '" style="max-width:100%; max-height:250px; border-radius:8px; margin-bottom:5px;"></video>'
      : (parsedText.startsWith('[AUDIO]:')
        ? '<audio controls src="' + parsedText.substring(8) + '" style="height:35px; max-width:200px; outline:none; margin-bottom:5px; border-radius:20px;"></audio>'
        : '<p id="msg-text-' + idMessage + '">' + escapeHtml(parsedText) + '</p>'));

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
    replyHtml +
    contentHtml +
    '<span class="message-time" style="display:flex; justify-content:space-between; gap:10px;">' +
    '<span>' + escapeHtml(sender) + '</span>' +
    '<span style="display:flex; gap:5px; align-items:center;">' +
    (isEdited ? '<span class="edited-badge" data-history="' + idMessage + '" title="Voir l\'historique">(Modifié)</span>' : '') +
    '<span>' + timeStr + '</span>' +
    '</span>' +
    '</span>' +
    '</div>' +
    '<div class="message-reactions" id="reactions-' + idMessage + '">' + reactionsHtml + '</div>';

  div.dataset.text = text || '';
  div.dataset.date = dateString || '';

  // Long-press (souris + tactile) → options du message
  const isTextMsg = !(parsedText.startsWith('[IMAGE]:') || parsedText.startsWith('[VIDEO]:') || parsedText.startsWith('[AUDIO]:'));
  let pressTimer;
  const startPress = () => {
    pressTimer = setTimeout(() => {
      openMessageOptions(idMessage, isTextMsg, div.dataset.date, div.dataset.text, isMe, sender);
    }, 800);
  };
  const clearPress = () => clearTimeout(pressTimer);
  div.addEventListener('mousedown', startPress);
  div.addEventListener('mouseup', clearPress);
  div.addEventListener('mouseleave', clearPress);
  div.addEventListener('touchstart', startPress);
  div.addEventListener('touchend', clearPress);
  div.addEventListener('touchmove', clearPress);

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
 * Affiche l'historique des modifications d'un message.
 * @param {number} idMessage ID du message.
 */
async function showEditHistory(idMessage) {
  try {
    const res = await fetch('/api/message-history/' + idMessage);
    if (!res.ok) throw new Error("Impossible de charger l'historique");
    const history = await res.json();

    const body = document.getElementById('history-modal-body');
    if (history.length === 0) {
      body.innerHTML = '<span>Aucun historique disponible.</span>';
    } else {
      body.innerHTML = history.map((h) => {
        const d = new Date(h.date_modification);
        const dateStr = d.toLocaleDateString('fr-FR', {day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'});
        return '<div style="background:var(--bg-color); padding:10px; border-radius:8px; border:1px solid var(--border-color);">' +
          '<div style="font-size:11px; color:var(--text-secondary); margin-bottom:4px;">' + dateStr + '</div>' +
          '<div>' + escapeHtml(h.ancien_contenu) + '</div></div>';
      }).join('');
    }
    document.getElementById('history-modal').style.display = 'flex';
  } catch (e) {
    showToast(e.message, 'error');
  }
}

/**
 * Met à jour l'indicateur de saisie dans l'en-tête du chat.
 */
function updateTypingStatus() {
  const statusEl = document.getElementById('chat-header-status');
  const box = document.getElementById('chat-messages');
  if (!statusEl || !box) return;
  let typingBubble = document.getElementById('typing-bubble');

  if (activeTypers.size > 0) {
    const typers = Array.from(activeTypers);
    if (typers.length === 1) {
      statusEl.innerText = typers[0] + " est en train d'écrire...";
    } else {
      statusEl.innerText = 'Plusieurs personnes écrivent...';
    }

    if (!typingBubble) {
      typingBubble = document.createElement('div');
      typingBubble.id = 'typing-bubble';
      typingBubble.className = 'message-container other';
      typingBubble.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
      box.appendChild(typingBubble);
      box.scrollTop = box.scrollHeight;
    }
  } else {
    statusEl.innerText = 'En ligne';
    if (typingBubble) {
      typingBubble.remove();
    }
  }
}

/**
 * Ouvre la modale d'options d'un message (répondre / modifier / supprimer).
 * @param {number} idMessage ID du message.
 * @param {boolean} isText Message textuel (modifiable).
 * @param {string} sentDateStr Date d'envoi.
 * @param {string} currentText Contenu brut actuel.
 * @param {boolean} isMe Message envoyé par l'utilisateur courant.
 * @param {string} senderName Nom de l'expéditeur.
 */
function openMessageOptions(idMessage, isText, sentDateStr, currentText, isMe, senderName) {
  activeOptionsMessageId = idMessage;
  const modalOptions = document.getElementById('modal-message-options');
  const btnEdit = document.getElementById('btn-edit-message');
  const btnDelete = document.getElementById('btn-delete-message');
  const btnReply = document.getElementById('btn-reply-message');

  btnReply.onclick = () => {
    const originalText = stripReplyPrefix(currentText);
    replyingTo = {id: idMessage, sender: senderName, text: originalText};

    let pText = originalText;
    if (pText.startsWith('[IMAGE]:')) pText = '📷 Image';
    if (pText.startsWith('[VIDEO]:')) pText = '🎥 Vidéo';
    if (pText.startsWith('[AUDIO]:')) pText = 'Message vocal';

    document.getElementById('reply-preview-sender').innerText = senderName;
    document.getElementById('reply-preview-text').innerText = pText;
    document.getElementById('reply-preview-container').style.display = 'block';
    modalOptions.style.display = 'none';
  };

  if (!isMe || !socketConnected) {
    btnEdit.style.display = 'none';
    btnDelete.style.display = 'none';
  } else {
    btnDelete.style.display = 'block';
    if (isText) {
      const sentDate = new Date(sentDateStr);
      const diffMin = (new Date() - sentDate) / 60000;
      if (diffMin <= 10) {
        btnEdit.style.display = 'block';
        btnEdit.onclick = () => {
          modalOptions.style.display = 'none';
          let prefix = '';
          let textToEdit = currentText;
          if (currentText.startsWith('[REPLY:')) {
            const closingIdx = currentText.indexOf(']');
            if (closingIdx > -1) {
              prefix = currentText.substring(0, closingIdx + 1);
              textToEdit = currentText.substring(closingIdx + 1);
            }
          }
          const input = document.getElementById('edit-message-input');
          input.value = textToEdit;
          input.dataset.replyPrefix = prefix;
          document.getElementById('modal-edit-message').style.display = 'flex';
        };
      } else {
        btnEdit.style.display = 'none';
      }
    } else {
      btnEdit.style.display = 'none';
    }

    btnDelete.onclick = () => {
      socket.emit('delete_message', {
        idMessage: idMessage,
        pseudonyme: getCurrentPseudo(),
        idGroupe: currentConversationId,
      });
      modalOptions.style.display = 'none';
    };
  }

  modalOptions.style.display = 'flex';
}

/**
 * Efface la réponse en cours.
 */
function clearReply() {
  replyingTo = null;
  document.getElementById('reply-preview-container').style.display = 'none';
}

/**
 * Ouvre le panneau de détails du groupe courant.
 */
async function openGroupDetails() {
  if (!currentConversationId) return;

  try {
    const res = await fetch('/api/groupe/' + currentConversationId + '/details');
    if (!res.ok) return;
    const details = await res.json();

    if (details.membres.length <= 2) {
      return; // Pas de panneau de détails pour les DMs
    }

    const conv = conversationsData.find((c) => c.id === currentConversationId);
    const isDM = conv && conv.type === 'DM';

    if (isDM) {
      document.getElementById('group-name-section').style.display = 'none';
    } else {
      document.getElementById('group-name-section').style.display = 'block';
      document.getElementById('group-name-input').value = details.nom_groupe;
    }

    document.getElementById('group-members-count').innerText = 'Membres (' + details.membres.length + ')';
    document.getElementById('group-members-list').innerHTML = details.membres.map((m) =>
      '<div class="group-member-item">' +
      '<img src="https://ui-avatars.com/api/?name=' + encodeURIComponent(m) + '&background=random" alt="">' +
      '<span>' + escapeHtml(m) + '</span></div>',
    ).join('');

    switchMediaTab('imgvid');

    const containerImgVid = document.getElementById('media-images-videos');
    const containerGifs = document.getElementById('media-gifs');
    containerImgVid.innerHTML = '';
    containerGifs.innerHTML = '';
    (details.media || []).forEach((m) => {
      const content = stripReplyPrefix(m);
      if (content.startsWith('[IMAGE]:')) {
        const url = content.replace('[IMAGE]:', '');
        const img = document.createElement('img');
        img.src = url;
        img.style.cssText = 'width:100%; height:60px; object-fit:cover; border-radius:4px; cursor:pointer;';
        img.onclick = () => openLightbox(url);
        if (url.includes('giphy.com')) {
          containerGifs.appendChild(img);
        } else {
          containerImgVid.appendChild(img);
        }
      } else if (content.startsWith('[VIDEO]:')) {
        const url = content.replace('[VIDEO]:', '');
        const vid = document.createElement('video');
        vid.src = url;
        vid.style.cssText = 'width:100%; height:60px; object-fit:cover; border-radius:4px; cursor:pointer;';
        vid.onclick = () => window.open(url, '_blank');
        containerImgVid.appendChild(vid);
      }
    });

    document.getElementById('conversations-sidebar').style.display = 'none';
    document.getElementById('group-details-sidebar').style.flex = '1';
    document.getElementById('group-details-sidebar').style.display = 'flex';
    document.getElementById('group-details-photo').src = getConvAvatar(conv);
  } catch (e) {
    console.error(e);
  }
}

/**
 * Ferme le panneau de détails du groupe.
 */
function closeGroupDetails() {
  const sidebar = document.getElementById('group-details-sidebar');
  if (!sidebar) return;
  sidebar.style.display = 'none';
  sidebar.style.flex = 'none';
  document.getElementById('conversations-sidebar').style.display = 'flex';
}

/**
 * Bascule l'onglet médias du panneau de détails.
 * @param {string} tab 'imgvid' ou 'gifs'.
 */
function switchMediaTab(tab) {
  document.getElementById('media-images-videos').style.display = tab === 'imgvid' ? 'grid' : 'none';
  document.getElementById('media-gifs').style.display = tab === 'imgvid' ? 'none' : 'grid';
  document.getElementById('tab-media-imgvid').style.background = tab === 'imgvid' ? '#363636' : 'var(--bg-color)';
  document.getElementById('tab-media-imgvid').style.color = tab === 'imgvid' ? 'white' : 'var(--text-secondary)';
  document.getElementById('tab-media-gifs').style.background = tab === 'gifs' ? '#363636' : 'var(--bg-color)';
  document.getElementById('tab-media-gifs').style.color = tab === 'gifs' ? 'white' : 'var(--text-secondary)';
}

/**
 * Recherche des GIFs via l'API Giphy.
 * @param {string} query Terme de recherche.
 */
async function fetchGifs(query = '') {
  const apiKey = 'BcOykGjIWxQl8m2euqAxoGw1j8nq9c3u'; // Clé publique Giphy beta
  let url = 'https://api.giphy.com/v1/gifs/trending?api_key=' + apiKey + '&limit=12';
  if (query) {
    url = 'https://api.giphy.com/v1/gifs/search?api_key=' + apiKey + '&q=' + encodeURIComponent(query) + '&limit=12';
  }

  const gifGrid = document.getElementById('gif-grid');
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erreur API: ' + response.status);
    const data = await response.json();
    gifGrid.innerHTML = '';

    data.data.forEach((gif) => {
      const img = document.createElement('img');
      img.src = gif.images.fixed_height_small.url;
      img.style.cssText = 'width:100%; height:100px; object-fit:cover; cursor:pointer; border-radius:6px;';
      img.onclick = () => {
        sendGif(gif.images.original.url);
        document.getElementById('gif-picker').style.display = 'none';
      };
      gifGrid.appendChild(img);
    });
  } catch (e) {
    console.error('Erreur récupération GIFs:', e);
    gifGrid.innerHTML = '<span style="color:#ed4956; font-size:12px; text-align:center; padding:10px;">Clé API Giphy expirée ou invalide.</span>';
  }
}

/**
 * Envoie un GIF dans la conversation courante.
 * @param {string} url URL du GIF.
 */
function sendGif(url) {
  if (!currentConversationId) return;
  const currentUser = getCurrentPseudo();
  if (!currentUser) return;

  if (socketConnected && socket) {
    socket.emit('send_message', {
      pseudonyme: currentUser,
      idGroupe: currentConversationId,
      contenu: '[IMAGE]:' + url,
      replyData: replyingTo,
    });
    clearReply();
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
        updateSendButtonState();
        chatInput.focus();
      }
    });
    emojiGrid.appendChild(span);
  });

  emojiPageInfo.innerText = (currentEmojiPage + 1) + '/' + totalEmojiPages;
}

/**
 * Active/désactive le bouton Envoyer selon le contenu du champ.
 */
function updateSendButtonState() {
  const btn = document.getElementById('btn-send-message');
  const input = document.getElementById('chat-input');
  if (!btn || !input) return;

  if (input.value.trim() === '') {
    btn.style.color = '#545454';
    btn.style.cursor = 'default';
    btn.disabled = true;
  } else {
    btn.style.color = 'var(--accent-color)';
    btn.style.cursor = 'pointer';
    btn.disabled = false;
  }
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
      dropdown.innerHTML = '<div style="padding:8px 12px; font-size:11px; color:var(--text-secondary);">Aucun utilisateur</div>';
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
              showToast('Limite de 10 utilisateurs atteinte.', 'error');
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
  tryConnectSocket();
  await chargerConversations();

  const byId = (id) => document.getElementById(id);

  // ---------- Écouteurs Socket.io (temps réel) ----------

  if (socketConnected && socket) {
    socket.on('typing', (data) => {
      if (data.idGroupe === currentConversationId) {
        activeTypers.add(data.pseudonyme);
        updateTypingStatus();
      }
    });

    socket.on('stop_typing', (data) => {
      if (data.idGroupe === currentConversationId) {
        activeTypers.delete(data.pseudonyme);
        updateTypingStatus();
      }
    });

    socket.on('receive_message', (msg) => {
      const conv = conversationsData.find((c) => c.id === msg.id_groupe);
      if (conv) {
        conv.lastMessage = msg.Contenu_message;
        conv.lastMessageSender = msg.Pseudonyme_utilisateur;
        conv.lastMessageDate = msg.Date_message;

        const currentUser = getCurrentPseudo();
        const isFromMe = msg.Pseudonyme_utilisateur.toLowerCase() === currentUser.toLowerCase();

        if (msg.id_groupe === currentConversationId) {
          if (!document.hidden) {
            localStorage.setItem('read_date_' + msg.id_groupe, new Date().toISOString());
          }
          appendMessage(msg.id_message, msg.Pseudonyme_utilisateur, msg.Contenu_message, msg.Date_message, msg.reactions || [], false);
          if (byId('group-details-sidebar').style.display === 'flex') {
            openGroupDetails();
          }
        }

        renderConversationsList();

        // Notifications (son, toast, badge titre) pour les messages des autres
        if (!isFromMe) {
          const isHidden = document.hidden;
          const isOtherGroup = msg.id_groupe !== currentConversationId;

          if (isHidden || isOtherGroup) {
            playNotificationSound();

            let previewText = stripReplyPrefix(msg.Contenu_message);
            if (previewText.startsWith('[IMAGE]:')) previewText = '📷 Image';
            if (previewText.startsWith('[AUDIO]:')) previewText = 'Message vocal';
            if (previewText.startsWith('[VIDEO]:')) previewText = '🎥 Vidéo';

            if (isHidden) {
              unreadCount++;
              document.title = '(' + unreadCount + ') LifeInvader';
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('Message de ' + msg.Pseudonyme_utilisateur, {body: previewText});
              }
            }
            if (!isHidden && isOtherGroup) {
              showMessengerToast('Nouveau message de ' + msg.Pseudonyme_utilisateur, previewText, msg.id_groupe);
            }
          }
        }
      }
    });

    socket.on('receive_reaction', (data) => {
      const reactionsContainer = byId('reactions-' + data.idMessage);
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

    socket.on('message_deleted', (data) => {
      const msgDiv = byId('msg-container-' + data.idMessage);
      if (msgDiv) msgDiv.remove();
    });

    socket.on('message_edited', (data) => {
      const msgDiv = byId('msg-container-' + data.idMessage);
      if (msgDiv) {
        msgDiv.dataset.text = data.nouveauContenu;
        const p = byId('msg-text-' + data.idMessage);
        if (p) {
          p.innerText = stripReplyPrefix(data.nouveauContenu);
        }

        const timeSpan = msgDiv.querySelector('.message-time > span:last-child');
        if (timeSpan && !msgDiv.querySelector('.edited-badge')) {
          const badge = document.createElement('span');
          badge.className = 'edited-badge';
          badge.innerText = '(Modifié)';
          badge.title = "Voir l'historique";
          badge.addEventListener('click', () => showEditHistory(data.idMessage));
          timeSpan.insertBefore(badge, timeSpan.firstChild);
        }
      }
    });

    socket.on('message_error', (data) => {
      showToast('Erreur : ' + data.message, 'error');
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

    socket.on('group_name_changed', (data) => {
      const conv = conversationsData.find((c) => c.id === data.idGroupe);
      if (conv) {
        conv.name = data.nouveauNom;
        renderConversationsList();
        if (currentConversationId === data.idGroupe) {
          byId('chat-header-name').innerText = getConvDisplayName(conv);
          byId('chat-header-avatar').src = getConvAvatar(conv);
          if (byId('group-details-sidebar').style.display === 'flex') {
            byId('group-name-input').value = data.nouveauNom;
          }
        }
      }
    });

    socket.on('group_photo_changed', (data) => {
      const conv = conversationsData.find((c) => c.id === data.idGroupe);
      if (conv) {
        conv.photo_groupe = data.photo;
        renderConversationsList();
        if (currentConversationId === data.idGroupe) {
          byId('chat-header-avatar').src = getConvAvatar(conv);
          if (byId('group-details-sidebar').style.display === 'flex') {
            byId('group-details-photo').src = getConvAvatar(conv);
          }
        }
      }
    });
  }

  // Remise à zéro du compteur d'non-lus quand la page redevient visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      unreadCount = 0;
      document.title = 'LifeInvader - BUT R&T';
    }
  });

  // Ouvrir la première conversation automatiquement
  if (conversationsData.length > 0) {
    openConversation(conversationsData[0].id);
  }

  // ---------- Listeners de la vue ----------

  byId('currentUserInput').addEventListener('change', chargerConversations);

  // En-tête de chat → détails du groupe
  byId('chat-header').addEventListener('click', openGroupDetails);
  byId('group-details-close').addEventListener('click', closeGroupDetails);
  byId('group-photo-edit').addEventListener('click', () => byId('group-photo-input').click());
  byId('group-photo-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file || !currentConversationId) return;

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('idGroupe', currentConversationId);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-group-photo', true);
    xhr.onload = () => {
      if (xhr.status !== 200) {
        showToast('Impossible de modifier la photo.', 'error');
      }
    };
    xhr.send(formData);
    event.target.value = '';
  });
  byId('btn-save-group-name').addEventListener('click', () => {
    if (!currentConversationId) return;
    const newName = byId('group-name-input').value.trim();
    if (!newName) return;
    socket.emit('change_group_name', {idGroupe: currentConversationId, nouveauNom: newName});
  });
  byId('tab-media-imgvid').addEventListener('click', () => switchMediaTab('imgvid'));
  byId('tab-media-gifs').addEventListener('click', () => switchMediaTab('gifs'));

  // Historique des modifications
  byId('history-modal-close').addEventListener('click', () => {
    byId('history-modal').style.display = 'none';
  });

  // Modales message
  byId('modal-options-close').addEventListener('click', () => {
    byId('modal-message-options').style.display = 'none';
  });
  byId('modal-edit-close').addEventListener('click', () => {
    byId('modal-edit-message').style.display = 'none';
  });
  byId('btn-save-edit').addEventListener('click', () => {
    const input = byId('edit-message-input');
    const newText = input.value.trim();
    const prefix = input.dataset.replyPrefix || '';

    if (newText && activeOptionsMessageId) {
      socket.emit('edit_message', {
        idMessage: activeOptionsMessageId,
        pseudonyme: getCurrentPseudo(),
        nouveauContenu: prefix + newText,
        idGroupe: currentConversationId,
      });
      byId('modal-edit-message').style.display = 'none';
    }
  });
  byId('btn-cancel-reply').addEventListener('click', clearReply);

  // Saisie de message
  const chatInput = byId('chat-input');
  ['input', 'keyup', 'change'].forEach((evt) => {
    chatInput.addEventListener(evt, updateSendButtonState);
  });
  chatInput.addEventListener('input', () => {
    if (!currentConversationId || !socketConnected) return;
    const currentUser = getCurrentPseudo();
    if (!currentUser) return;

    socket.emit('typing', {idGroupe: currentConversationId, pseudonyme: currentUser});
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('stop_typing', {idGroupe: currentConversationId, pseudonyme: currentUser});
    }, 2000);
  });

  byId('chat-input-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    const currentUser = getCurrentPseudo();

    if (!text || !currentConversationId) return;

    if (socketConnected && socket) {
      clearTimeout(typingTimeout);
      socket.emit('stop_typing', {idGroupe: currentConversationId, pseudonyme: currentUser});

      socket.emit('send_message', {
        pseudonyme: currentUser,
        idGroupe: currentConversationId,
        contenu: text,
        replyData: replyingTo,
      });
      clearReply();
    } else {
      appendMessage(Date.now(), currentUser, text, null, []);
      const conv = conversationsData.find((c) => c.id === currentConversationId);
      if (conv) {
        conv.lastMessage = text;
        conv.lastMessageSender = currentUser;
        renderConversationsList();
      }
    }

    chatInput.value = '';
    updateSendButtonState();
    byId('emoji-picker').classList.remove('active');
  });

  // ---------- Upload de médias (photo / vidéo) ----------

  const attachmentMenu = byId('attachment-menu');
  const imageUploadInput = byId('image-upload-input');

  byId('btn-attachment').addEventListener('click', (e) => {
    attachmentMenu.style.display = attachmentMenu.style.display === 'flex' ? 'none' : 'flex';
    e.stopPropagation();
  });

  document.addEventListener('click', (e) => {
    if (attachmentMenu && !attachmentMenu.contains(e.target) && e.target !== byId('btn-attachment')) {
      attachmentMenu.style.display = 'none';
    }
  });

  byId('btn-menu-image').addEventListener('click', () => {
    attachmentMenu.style.display = 'none';
    imageUploadInput.click();
  });

  imageUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !currentConversationId) return;

    const currentUser = getCurrentPseudo();
    if (!currentUser) return;

    if (!socketConnected) return;

    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

    const formData = new FormData();
    formData.append('media', file);
    formData.append('pseudonyme', currentUser);
    formData.append('idGroupe', currentConversationId);
    formData.append('mediaType', mediaType);
    if (replyingTo) {
      formData.append('replyData', JSON.stringify(replyingTo));
    }

    const progressContainer = byId('upload-progress-container');
    const progressBar = byId('upload-progress-bar');
    const progressText = byId('upload-progress-text');

    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.innerText = '0%';

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        progressBar.style.width = percentComplete + '%';
        progressText.innerText = percentComplete + '%';
      }
    };

    xhr.onload = () => {
      progressContainer.style.display = 'none';
      if (xhr.status === 200) {
        clearReply();
      } else {
        showToast("Impossible d'envoyer le fichier.", 'error');
      }
    };

    xhr.onerror = () => {
      progressContainer.style.display = 'none';
      showToast("Une erreur est survenue lors de l'envoi.", 'error');
    };

    xhr.send(formData);
    imageUploadInput.value = '';
  });

  // ---------- Messages vocaux ----------

  const recordingUi = byId('recording-ui');
  const chatInputWrapper = document.querySelector('.chat-input-wrapper');

  byId('btn-menu-vocal').addEventListener('click', async () => {
    attachmentMenu.style.display = 'none';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        clearInterval(recordTimerInterval);
        const audioBlob = new Blob(audioChunks, {type: 'audio/webm'});
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunks.length > 0 && !cancelRecording) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target.result;
            const currentUser = getCurrentPseudo();
            if (currentUser && currentConversationId) {
              socket.emit('send_audio', {
                pseudonyme: currentUser,
                idGroupe: currentConversationId,
                audioBase64: base64,
                extension: '.webm',
                replyData: replyingTo,
              });
              clearReply();
            }
          };
          reader.readAsDataURL(audioBlob);
        }

        chatInputWrapper.style.display = 'flex';
        recordingUi.style.display = 'none';
      };

      cancelRecording = false;
      mediaRecorder.start();

      chatInputWrapper.style.display = 'none';
      recordingUi.style.display = 'flex';

      recordSeconds = 0;
      byId('recording-time').innerText = '0:00';
      recordTimerInterval = setInterval(() => {
        recordSeconds++;
        const m = Math.floor(recordSeconds / 60);
        const s = recordSeconds % 60;
        byId('recording-time').innerText = m + ':' + (s < 10 ? '0' : '') + s;
      }, 1000);
    } catch (err) {
      showToast("Erreur d'accès au microphone : " + err.message, 'error');
    }
  });

  byId('btn-cancel-record').addEventListener('click', () => {
    cancelRecording = true;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  });

  byId('btn-stop-record').addEventListener('click', () => {
    cancelRecording = false;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  });

  // ---------- Sélecteur d'emojis ----------

  const emojiBtn = byId('btn-emoji');
  const emojiPicker = byId('emoji-picker');
  const emojiGrid = byId('emoji-grid');

  emojiBtn.addEventListener('click', () => {
    activeReactionMessageId = null;
    emojiPicker.classList.toggle('active');
    if (emojiPicker.classList.contains('active') && emojiGrid.innerHTML === '') {
      renderEmojiPage();
    }
  });

  byId('emoji-prev').addEventListener('click', () => {
    if (currentEmojiPage > 0) {
      currentEmojiPage--;
      renderEmojiPage();
    }
  });

  byId('emoji-next').addEventListener('click', () => {
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

  // ---------- Zone de messages : réactions, réponses, options ----------

  byId('chat-messages').addEventListener('click', (e) => {
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
      return;
    }

    const msgImg = e.target.closest('.msg-image');
    if (msgImg) {
      openLightbox(msgImg.dataset.src || msgImg.src);
      return;
    }

    const replyQuote = e.target.closest('.reply-quote');
    if (replyQuote) {
      const target = document.getElementById(replyQuote.dataset.target);
      if (target) {
        target.scrollIntoView({behavior: 'smooth', block: 'center'});
        const oldBg = target.style.background;
        target.style.transition = 'background 0.5s';
        target.style.background = 'rgba(255,255,255,0.3)';
        setTimeout(() => {
          target.style.background = oldBg;
        }, 1000);
      }
      return;
    }

    const editedBadge = e.target.closest('.edited-badge');
    if (editedBadge) {
      showEditHistory(parseInt(editedBadge.dataset.history, 10));
    }
  });

  // ---------- Lightbox ----------

  byId('lightbox-close').addEventListener('click', () => {
    byId('image-lightbox').style.display = 'none';
  });
  byId('image-lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'image-lightbox') {
      e.target.style.display = 'none';
    }
  });

  // ---------- GIFs ----------

  const gifPicker = byId('gif-picker');
  const btnGif = byId('btn-gif');

  btnGif.addEventListener('click', () => {
    if (gifPicker.style.display === 'flex') {
      gifPicker.style.display = 'none';
    } else {
      gifPicker.style.display = 'flex';
      if (byId('gif-grid').children.length === 0) {
        fetchGifs();
      }
    }
  });

  byId('gif-search-input').addEventListener('input', (e) => {
    clearTimeout(gifSearchTimeout);
    gifSearchTimeout = setTimeout(() => {
      fetchGifs(e.target.value);
    }, 500);
  });

  // Fermer les popups si clic en dehors
  document.addEventListener('click', (e) => {
    if (gifPicker && !gifPicker.contains(e.target) && e.target !== btnGif) {
      gifPicker.style.display = 'none';
    }
    if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn && !e.target.closest('.message-actions')) {
      emojiPicker.classList.remove('active');
    }
  });

  // ---------- Modale nouveau message ----------

  const modal = byId('modal-new-chat');

  byId('btn-new-message').addEventListener('click', () => {
    modal.style.display = 'flex';
    fetchDbUsers();
  });
  byId('modal-close').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  setupUsersDropdown('target-user-input', 'users-dropdown-dm', false);
  setupUsersDropdown('group-members-input', 'users-dropdown-group', true);

  byId('btn-start-dm').addEventListener('click', async () => {
    const myPseudo = getCurrentPseudo();
    const target = byId('target-user-input').value.trim();
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

  byId('btn-start-group').addEventListener('click', async () => {
    const myPseudo = getCurrentPseudo();
    const input = byId('group-members-input').value.trim();
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
