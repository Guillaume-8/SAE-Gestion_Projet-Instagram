/**
 * @fileoverview Vue Paramètres.
 */

import {
  getCurrentUser,
  getConversations,
  sendMessage,
  reportIssue,
  contactSupport,
  sendSuggestion,
  setAccountRestricted,
  deactivateAccount,
} from '../api.js';
import {showToast} from '../toast.js';

const SUPPORT_EMAIL = 'support@lifeinvader-rt.fr';

const FAQ_ITEMS = [
  {
    question: 'Comment modifier mon profil ?',
    answer: 'Rendez-vous dans Paramètres > Modifier le profil pour changer votre nom, votre biographie ou votre photo.',
  },
  {
    question: 'Comment fonctionne la confidentialité de mes publications ?',
    answer: 'Chaque publication peut être définie comme publique ou visible uniquement par vos amis, au moment de la publier.',
  },
  {
    question: 'Comment signaler un contenu inapproprié ?',
    answer: "Ouvrez la publication concernée puis cliquez sur le bouton 🚩 Signaler, ou utilisez Paramètres > Aide > Signaler un problème.",
  },
  {
    question: 'Comment supprimer un message envoyé ?',
    answer: 'Cette fonctionnalité est en cours de développement et sera bientôt disponible dans la messagerie.',
  },
];

const TERMS_TEXT = `
  <p>En utilisant LifeInvader, vous acceptez les présentes conditions d'utilisation.</p>
  <p><strong>1. Contenu publié</strong><br>Vous restez propriétaire des contenus que vous publiez, mais vous êtes seul responsable de leur légalité et de leur conformité au règlement de la plateforme.</p>
  <p><strong>2. Comportement</strong><br>Tout contenu injurieux, discriminatoire ou illégal peut être signalé et donner lieu à une restriction ou une désactivation du compte.</p>
  <p><strong>3. Disponibilité</strong><br>Le service est fourni "en l'état", dans le cadre d'un projet pédagogique (SAÉ 5.02 — BUT R&T), sans garantie de disponibilité continue.</p>
  <p><strong>4. Résiliation</strong><br>Vous pouvez désactiver votre compte à tout moment depuis Paramètres > Status du compte.</p>
`;

const PRIVACY_TEXT = `
  <p>Cette politique explique quelles données sont utilisées par LifeInvader et pourquoi.</p>
  <p><strong>Données collectées</strong><br>Nom d'utilisateur, e-mail, biographie, photo de profil, publications et messages échangés sur la plateforme.</p>
  <p><strong>Utilisation</strong><br>Ces données servent uniquement au fonctionnement de l'application (affichage du fil, messagerie, statistiques de compte).</p>
  <p><strong>Partage</strong><br>Aucune donnée n'est vendue ou partagée avec des tiers. LifeInvader est un projet pédagogique sans finalité commerciale.</p>
  <p><strong>Vos droits</strong><br>Vous pouvez à tout moment modifier vos informations ou désactiver votre compte depuis les Paramètres.</p>
`;


const STORAGE_KEY = 'instaclone_notification_settings';
const PRIVACY_KEY = 'instaclone_privacy_settings';

function getNotificationSettings() {
  const defaults = {
    pauseAll: false,
    messagesOnly: false,
  };
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
}

function saveNotificationSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function getPrivacySettings() {
  const defaults = { isPrivate: false };
  const saved = localStorage.getItem(PRIVACY_KEY);
  return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
}

function savePrivacySettings(settings) {
  localStorage.setItem(PRIVACY_KEY, JSON.stringify(settings));
}

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
 * Rend le squelette HTML de la vue Paramètres.
 * @return {string} HTML de la vue.
 */
export function render() {
  const settings = getNotificationSettings();
  const privacySettings = getPrivacySettings();

  return `
    <div class="settings-page">
      <div class="settings-container">
        <h1 class="settings-title">Paramètres</h1>

        <section class="settings-section">
          <h2 class="settings-section-title">Comment vous utilisez LifeInvader</h2>

          <button class="settings-item" data-settings-action="edit-profile">
            <span class="settings-icon">👤</span>
            <span class="settings-label">Modifier le profil</span>
            <span class="settings-arrow">›</span>
          </button>

          <button class="settings-item" data-settings-action="notifications" aria-expanded="false" aria-controls="notifications-panel">
            <span class="settings-icon">🔔</span>
            <span class="settings-label">Notifications</span>
            <span class="settings-arrow">›</span>
          </button>

          <div id="notifications-panel" class="settings-subpanel" style="display: none;">
            <div class="settings-toggle-item">
              <div class="settings-toggle-info">
                <span class="settings-toggle-title">Mettre en pause tout</span>
                <span class="settings-toggle-description">Désactive temporairement toutes les notifications.</span>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-pause-all" ${settings.pauseAll ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>

            <div class="settings-toggle-item">
              <div class="settings-toggle-info">
                <span class="settings-toggle-title">Messages uniquement</span>
                <span class="settings-toggle-description">Ne recevoir que les notifications relatives aux messages directs.</span>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-messages-only" ${settings.messagesOnly ? 'checked' : ''} ${settings.pauseAll ? 'disabled' : ''}>
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section-title">Ce que vous voyez</h2>

          <button class="settings-item" data-settings-action="privacy" aria-expanded="false" aria-controls="privacy-panel">
            <span class="settings-icon">🔒</span>
            <span class="settings-label">Confidentialité</span>
            <span class="settings-arrow">›</span>
          </button>

          <div id="privacy-panel" class="settings-subpanel" style="display: none;">
            <div class="settings-toggle-item">
              <div class="settings-toggle-info">
                <span class="settings-toggle-title">Compte privé</span>
                <span class="settings-toggle-description">Lorsque votre compte est privé, seuls les abonnés que vous approuvez peuvent voir votre profil et vos photos.</span>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-private-account" ${privacySettings.isPrivate ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <button class="settings-item" data-settings-action="friends">
            <span class="settings-icon">👥</span>
            <span class="settings-label">Amis</span>
            <span class="settings-arrow">›</span>
          </button>
        </section>

        <section class="settings-section">
          <h2 class="settings-section-title">Média</h2>

          <div class="settings-item-wrapper">
            <button class="settings-item settings-item-toggle" data-settings-toggle="share">
              <span class="settings-icon">🔗</span>
              <span class="settings-label">Partage</span>
              <span class="settings-arrow">›</span>
            </button>
            <div class="settings-submenu" data-submenu="share">
              <button class="settings-subitem" data-settings-action="share-link">Copier le lien du profil</button>
              <button class="settings-subitem" data-settings-action="share-social">Partager sur les réseaux sociaux</button>
              <button class="settings-subitem" data-settings-action="share-message">Partager par message</button>
              <button class="settings-subitem" data-settings-action="share-embed">Intégrer (embed)</button>
            </div>
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section-title">Support</h2>

          <div class="settings-item-wrapper">
            <button class="settings-item settings-item-toggle" data-settings-toggle="help">
              <span class="settings-icon">❓</span>
              <span class="settings-label">Aide</span>
              <span class="settings-arrow">›</span>
            </button>
            <div class="settings-submenu" data-submenu="help">
              <button class="settings-subitem" data-settings-action="help-center">Centre d'aide</button>
              <button class="settings-subitem" data-settings-action="help-report">Signaler un problème</button>
              <button class="settings-subitem" data-settings-action="help-terms">Conditions d'utilisation</button>
              <button class="settings-subitem" data-settings-action="help-privacy-policy">Politique de confidentialité</button>
            </div>
          </div>

          <div class="settings-item-wrapper">
            <button class="settings-item settings-item-toggle" data-settings-toggle="contact">
              <span class="settings-icon">✉️</span>
              <span class="settings-label">Contact</span>
              <span class="settings-arrow">›</span>
            </button>
            <div class="settings-submenu" data-submenu="contact">
              <button class="settings-subitem" data-settings-action="contact-email">Nous contacter par e-mail</button>
              <button class="settings-subitem" data-settings-action="contact-support">Support technique</button>
              <button class="settings-subitem" data-settings-action="contact-suggestion">Envoyer une suggestion</button>
            </div>
          </div>

          <div class="settings-item-wrapper">
            <button class="settings-item settings-item-toggle" data-settings-toggle="account-status">
              <span class="settings-icon">📊</span>
              <span class="settings-label">Status du compte</span>
              <span class="settings-arrow">›</span>
            </button>
            <div class="settings-submenu" data-submenu="account-status">
              <button class="settings-subitem" data-settings-action="account-status-active">Voir le statut du compte</button>
              <button class="settings-subitem" data-settings-action="account-status-restrict">Restreindre le compte</button>
              <button class="settings-subitem" data-settings-action="account-status-deactivate">Désactiver le compte</button>
            </div>
          </div>
        </section>

        <p class="settings-version">LifeInvader v1.0.0 — SAÉ 5.02 BUT R&T</p>
      </div>
    </div>
  `;
}

function toggleNotificationsPanel() {
  const panel = document.getElementById('notifications-panel');
  const button = document.querySelector('[data-settings-action="notifications"]');
  if (!panel || !button) return;

  const isHidden = panel.style.display === 'none';

  panel.style.display = isHidden ? 'block' : 'none';
  button.setAttribute('aria-expanded', isHidden ? 'true' : 'false');

  const arrow = button.querySelector('.settings-arrow');
  if (arrow) {
    arrow.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
  }
}

function togglePrivacyPanel() {
  const panel = document.getElementById('privacy-panel');
  const button = document.querySelector('[data-settings-action="privacy"]');
  if (!panel || !button) return;

  const isHidden = panel.style.display === 'none';

  panel.style.display = isHidden ? 'block' : 'none';
  button.setAttribute('aria-expanded', isHidden ? 'true' : 'false');

  const arrow = button.querySelector('.settings-arrow');
  if (arrow) {
    arrow.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
  }
}

// ============================================================
//  MODAL GÉNÉRIQUE
// ============================================================

/**
 * Ouvre un modal générique par-dessus la page des paramètres.
 * @param {string} title Titre affiché en en-tête.
 * @param {string} bodyHtml Contenu HTML du corps du modal.
 * @return {HTMLElement} L'élément du corps du modal (pour y attacher des listeners).
 */
function openSettingsModal(title, bodyHtml) {
  closeSettingsModal();

  const modalHtml = `
    <div class="settings-modal-overlay" id="settings-modal-overlay">
      <div class="settings-modal-content" id="settings-modal-content">
        <div class="settings-modal-header">
          <h3>${escapeHtml(title)}</h3>
          <button class="settings-modal-close" id="settings-modal-close" title="Fermer">✕</button>
        </div>
        <div class="settings-modal-body" id="settings-modal-body">
          ${bodyHtml}
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const overlay = document.getElementById('settings-modal-overlay');
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeSettingsModal();
  });
  document.getElementById('settings-modal-close').addEventListener('click', closeSettingsModal);
  document.addEventListener('keydown', handleSettingsModalEscape);

  return document.getElementById('settings-modal-body');
}

/**
 * Ferme le modal générique des paramètres, s'il est ouvert.
 */
function closeSettingsModal() {
  const modal = document.getElementById('settings-modal-overlay');
  if (modal) {
    modal.remove();
    document.removeEventListener('keydown', handleSettingsModalEscape);
  }
}

/**
 * Gestionnaire pour la touche Escape sur le modal des paramètres.
 * @param {KeyboardEvent} event Événement clavier.
 */
function handleSettingsModalEscape(event) {
  if (event.key === 'Escape') closeSettingsModal();
}

// ============================================================
//  PARTAGE
// ============================================================

/**
 * Construit l'URL publique de partage du profil courant.
 * @param {Object} user Utilisateur courant.
 * @return {string} URL de partage.
 */
function buildProfileShareUrl(user) {
  return `${window.location.origin}${window.location.pathname}#/profile?u=${encodeURIComponent(user.username)}`;
}

/**
 * Copie un texte dans le presse-papiers, avec repli si l'API est indisponible.
 * @param {string} text Texte à copier.
 * @return {Promise<boolean>} Succès de la copie.
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.error('Échec navigator.clipboard, repli sur execCommand :', error);
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    textarea.remove();
    return success;
  } catch (error) {
    console.error('Échec de la copie :', error);
    return false;
  }
}

/**
 * Copie directement le lien du profil dans le presse-papiers.
 */
async function handleShareLink() {
  const user = await getCurrentUser();
  const url = buildProfileShareUrl(user);
  const success = await copyToClipboard(url);
  showToast(success ? 'Lien du profil copié !' : 'Impossible de copier le lien');
}

/**
 * Ouvre un modal de partage vers les réseaux sociaux.
 */
async function handleShareSocial() {
  const user = await getCurrentUser();
  const url = buildProfileShareUrl(user);
  const text = `Découvrez le profil de ${user.username} sur LifeInvader`;

  const networks = [
    {
      name: 'X (Twitter)',
      icon: '𝕏',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'Facebook',
      icon: '📘',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`,
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ];

  const body = `
    <p class="settings-modal-hint">Partager le profil <strong>@${escapeHtml(user.username)}</strong> :</p>
    <div class="share-network-list">
      ${networks.map((network) => `
        <a class="share-network-item" href="${network.href}" target="_blank" rel="noopener noreferrer">
          <span class="share-network-icon">${network.icon}</span>
          <span>${escapeHtml(network.name)}</span>
        </a>
      `).join('')}
    </div>
    <div class="settings-modal-divider"></div>
    <div class="settings-copy-row">
      <input type="text" id="share-social-link" value="${escapeHtml(url)}" readonly>
      <button class="btn-primary" id="share-social-copy-btn">Copier</button>
    </div>
  `;

  const modalBody = openSettingsModal('Partager sur les réseaux sociaux', body);

  // Si le navigateur supporte le partage natif, on l'utilise directement.
  if (navigator.share) {
    const nativeButton = document.createElement('button');
    nativeButton.className = 'btn-secondary settings-native-share-btn';
    nativeButton.textContent = '📤 Utiliser le partage natif du système';
    nativeButton.addEventListener('click', async () => {
      try {
        await navigator.share({title: 'LifeInvader', text, url});
      } catch (error) {
        console.info('Partage natif annulé ou indisponible :', error);
      }
    });
    modalBody.prepend(nativeButton);
  }

  modalBody.querySelector('#share-social-copy-btn').addEventListener('click', async () => {
    const success = await copyToClipboard(url);
    showToast(success ? 'Lien copié !' : 'Impossible de copier le lien');
  });
}

/**
 * Ouvre un modal listant les conversations pour partager le profil par message.
 */
async function handleShareMessage() {
  const [user, conversations] = await Promise.all([getCurrentUser(), getConversations()]);
  const url = buildProfileShareUrl(user);

  const body = conversations.length
    ? `
      <p class="settings-modal-hint">Envoyer le lien de votre profil à :</p>
      <div class="share-conversation-list">
        ${conversations.map((conv) => `
          <div class="share-conversation-item" data-conversation-id="${conv.id}">
            <img src="${conv.avatar}" alt="${escapeHtml(conv.name)}" class="share-conversation-avatar">
            <span class="share-conversation-name">${escapeHtml(conv.name)}</span>
            <button class="btn-primary share-conversation-send-btn" data-conversation-id="${conv.id}">Envoyer</button>
          </div>
        `).join('')}
      </div>
    `
    : `<p class="settings-modal-hint">Aucune conversation disponible pour le moment.</p>`;

  const modalBody = openSettingsModal('Partager par message', body);

  modalBody.querySelectorAll('.share-conversation-send-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const conversationId = Number(btn.dataset.conversationId);
      btn.disabled = true;
      btn.textContent = 'Envoi…';
      try {
        await sendMessage(conversationId, `Regarde mon profil LifeInvader : ${url}`);
        btn.textContent = 'Envoyé ✓';
        showToast('Lien envoyé en message !');
      } catch (error) {
        console.error('Échec du partage par message :', error);
        btn.disabled = false;
        btn.textContent = 'Réessayer';
      }
    });
  });
}

/**
 * Ouvre un modal affichant un code d'intégration (embed) du profil.
 */
async function handleShareEmbed() {
  const user = await getCurrentUser();
  const url = buildProfileShareUrl(user);
  const embedCode = `<iframe src="${url}&embed=1" width="400" height="480" style="border:1px solid #dbdbdb;border-radius:12px;" loading="lazy"></iframe>`;

  const body = `
    <p class="settings-modal-hint">Intégrez votre profil sur un autre site avec ce code :</p>
    <textarea id="embed-code-textarea" class="settings-code-textarea" rows="5" readonly>${escapeHtml(embedCode)}</textarea>
    <button class="btn-primary" id="embed-copy-btn">Copier le code</button>
  `;

  const modalBody = openSettingsModal('Intégrer (embed)', body);
  modalBody.querySelector('#embed-copy-btn').addEventListener('click', async () => {
    const success = await copyToClipboard(embedCode);
    showToast(success ? "Code d'intégration copié !" : 'Impossible de copier le code');
  });
}

// ============================================================
//  AIDE
// ============================================================

/**
 * Ouvre le centre d'aide (FAQ accordéon).
 */
function handleHelpCenter() {
  const body = `
    <div class="faq-list">
      ${FAQ_ITEMS.map((item, index) => `
        <div class="faq-item">
          <button class="faq-question" data-faq-index="${index}">
            <span>${escapeHtml(item.question)}</span>
            <span class="faq-arrow">›</span>
          </button>
          <div class="faq-answer" data-faq-answer="${index}">
            <p>${escapeHtml(item.answer)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  const modalBody = openSettingsModal("Centre d'aide", body);
  modalBody.querySelectorAll('.faq-question').forEach((question) => {
    question.addEventListener('click', () => {
      const answer = modalBody.querySelector(`.faq-answer[data-faq-answer="${question.dataset.faqIndex}"]`);
      const isOpen = question.classList.contains('open');
      modalBody.querySelectorAll('.faq-question').forEach((q) => q.classList.remove('open'));
      modalBody.querySelectorAll('.faq-answer').forEach((a) => a.classList.remove('open'));
      if (!isOpen) {
        question.classList.add('open');
        answer.classList.add('open');
      }
    });
  });
}

/**
 * Ouvre le formulaire de signalement d'un problème.
 */
function handleHelpReport() {
  const body = `
    <form id="report-issue-form" class="settings-form">
      <div class="form-group">
        <label for="report-subject">Sujet</label>
        <select id="report-subject" required>
          <option value="">Choisissez un sujet</option>
          <option value="Bug d'affichage">Bug d'affichage</option>
          <option value="Problème de connexion">Problème de connexion</option>
          <option value="Contenu inapproprié">Contenu inapproprié</option>
          <option value="Autre">Autre</option>
        </select>
      </div>
      <div class="form-group">
        <label for="report-description">Description</label>
        <textarea id="report-description" rows="4" placeholder="Décrivez le problème rencontré..." required></textarea>
      </div>
      <p class="settings-form-feedback" id="report-feedback"></p>
      <button type="submit" class="btn-primary" id="report-submit-btn">Envoyer le signalement</button>
    </form>
  `;

  const modalBody = openSettingsModal('Signaler un problème', body);
  const form = modalBody.querySelector('#report-issue-form');
  const feedback = modalBody.querySelector('#report-feedback');
  const submitBtn = modalBody.querySelector('#report-submit-btn');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const subject = modalBody.querySelector('#report-subject').value;
    const description = modalBody.querySelector('#report-description').value.trim();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi…';
    feedback.textContent = '';

    try {
      const result = await reportIssue({subject, description});
      feedback.textContent = `Merci ! Votre signalement a été enregistré (réf. ${result.ticketId}).`;
      feedback.classList.add('success');
      form.reset();
      showToast('Signalement envoyé');
      setTimeout(closeSettingsModal, 1800);
    } catch (error) {
      feedback.textContent = error.message || "Impossible d'envoyer le signalement.";
      feedback.classList.add('error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer le signalement';
    }
  });
}

/**
 * Ouvre les conditions d'utilisation.
 */
function handleHelpTerms() {
  openSettingsModal("Conditions d'utilisation", `<div class="settings-legal-text">${TERMS_TEXT}</div>`);
}

/**
 * Ouvre la politique de confidentialité.
 */
function handleHelpPrivacyPolicy() {
  openSettingsModal('Politique de confidentialité', `<div class="settings-legal-text">${PRIVACY_TEXT}</div>`);
}

// ============================================================
//  CONTACT
// ============================================================

/**
 * Ouvre le client de messagerie par défaut pour contacter le support.
 */
async function handleContactEmail() {
  const user = await getCurrentUser();
  const subject = encodeURIComponent('Contact LifeInvader');
  const bodyText = encodeURIComponent(
    `Bonjour,\n\n(Décrivez votre demande ici)\n\n— Envoyé depuis le compte @${user.username}`,
  );
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${bodyText}`;
}

/**
 * Ouvre le formulaire de contact du support technique.
 */
function handleContactSupport() {
  const body = `
    <form id="contact-support-form" class="settings-form">
      <div class="form-group">
        <label for="support-subject">Sujet</label>
        <input type="text" id="support-subject" placeholder="Ex : Problème de connexion" required>
      </div>
      <div class="form-group">
        <label for="support-message">Message</label>
        <textarea id="support-message" rows="4" placeholder="Détaillez votre demande..." required></textarea>
      </div>
      <p class="settings-form-feedback" id="support-feedback"></p>
      <button type="submit" class="btn-primary" id="support-submit-btn">Envoyer</button>
    </form>
  `;

  const modalBody = openSettingsModal('Support technique', body);
  const form = modalBody.querySelector('#contact-support-form');
  const feedback = modalBody.querySelector('#support-feedback');
  const submitBtn = modalBody.querySelector('#support-submit-btn');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const subject = modalBody.querySelector('#support-subject').value.trim();
    const message = modalBody.querySelector('#support-message').value.trim();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi…';
    feedback.textContent = '';

    try {
      await contactSupport({subject, message});
      feedback.textContent = 'Votre message a bien été envoyé au support.';
      feedback.classList.add('success');
      form.reset();
      showToast('Message envoyé au support');
      setTimeout(closeSettingsModal, 1800);
    } catch (error) {
      feedback.textContent = error.message || "Impossible d'envoyer le message.";
      feedback.classList.add('error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer';
    }
  });
}

/**
 * Ouvre le formulaire d'envoi de suggestion.
 */
function handleContactSuggestion() {
  const body = `
    <form id="suggestion-form" class="settings-form">
      <div class="form-group">
        <label for="suggestion-message">Votre suggestion</label>
        <textarea id="suggestion-message" rows="5" placeholder="Qu'aimeriez-vous voir dans LifeInvader ?" required></textarea>
      </div>
      <p class="settings-form-feedback" id="suggestion-feedback"></p>
      <button type="submit" class="btn-primary" id="suggestion-submit-btn">Envoyer la suggestion</button>
    </form>
  `;

  const modalBody = openSettingsModal('Envoyer une suggestion', body);
  const form = modalBody.querySelector('#suggestion-form');
  const feedback = modalBody.querySelector('#suggestion-feedback');
  const submitBtn = modalBody.querySelector('#suggestion-submit-btn');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = modalBody.querySelector('#suggestion-message').value.trim();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi…';
    feedback.textContent = '';

    try {
      await sendSuggestion(message);
      feedback.textContent = 'Merci pour votre suggestion !';
      feedback.classList.add('success');
      form.reset();
      showToast('Suggestion envoyée');
      setTimeout(closeSettingsModal, 1800);
    } catch (error) {
      feedback.textContent = error.message || "Impossible d'envoyer la suggestion.";
      feedback.classList.add('error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer la suggestion';
    }
  });
}

// ============================================================
//  STATUS DU COMPTE
// ============================================================

/**
 * Traduit un statut de compte en libellé lisible.
 * @param {string} status Statut brut ('active', 'restricted', 'deactivated').
 * @return {{label: string, className: string}} Libellé et classe CSS associée.
 */
function formatAccountStatus(status) {
  switch (status) {
    case 'restricted':
      return {label: 'Restreint', className: 'status-restricted'};
    case 'deactivated':
      return {label: 'Désactivé', className: 'status-deactivated'};
    default:
      return {label: 'Actif', className: 'status-active'};
  }
}

/**
 * Ouvre le modal affichant le statut détaillé du compte.
 */
async function handleAccountStatusView() {
  const user = await getCurrentUser();
  const status = formatAccountStatus(user.accountStatus);

  const body = `
    <div class="account-status-summary">
      <span class="account-status-badge ${status.className}">${status.label}</span>
      <p>@${escapeHtml(user.username)}</p>
    </div>
    <ul class="account-status-details">
      <li><span>E-mail</span><strong>${escapeHtml(user.email || '—')}</strong></li>
      <li><span>Membre depuis</span><strong>${escapeHtml(user.memberSince || '—')}</strong></li>
      <li><span>Dernière connexion</span><strong>${escapeHtml(user.lastLogin || '—')}</strong></li>
      <li><span>Publications</span><strong>${user.postsCount ?? 0}</strong></li>
      <li><span>Abonnés</span><strong>${user.followersCount ?? 0}</strong></li>
      <li><span>Abonnements</span><strong>${user.followingCount ?? 0}</strong></li>
    </ul>
  `;

  openSettingsModal('Status du compte', body);
}

/**
 * Bascule l'état de restriction du compte, avec confirmation.
 */
async function handleAccountRestrict() {
  const user = await getCurrentUser();
  const isRestricted = user.accountStatus === 'restricted';

  const confirmMessage = isRestricted
    ? 'Voulez-vous lever la restriction de votre compte ?'
    : 'Restreindre votre compte limite sa visibilité pour les autres utilisateurs. Continuer ?';

  if (!window.confirm(confirmMessage)) return;

  try {
    await setAccountRestricted(!isRestricted);
    showToast(isRestricted ? 'Restriction levée' : 'Compte restreint');
  } catch (error) {
    console.error('Échec de la mise à jour du statut :', error);
    showToast('Une erreur est survenue');
  }
}

/**
 * Désactive le compte après confirmation, puis redirige vers la connexion.
 */
async function handleAccountDeactivate() {
  const confirmed = window.confirm(
    'Êtes-vous sûr de vouloir désactiver votre compte ? Vous serez déconnecté(e).',
  );
  if (!confirmed) return;

  try {
    await deactivateAccount();
    showToast('Compte désactivé');
    closeSettingsModal();
    setTimeout(() => {
      window.location.hash = '#/login';
    }, 800);
  } catch (error) {
    console.error('Échec de la désactivation du compte :', error);
    showToast('Une erreur est survenue');
  }
}

/**
 * Exécute l'action associée à un item ou sous-item des paramètres.
 * @param {string} action Action demandée.
 */
function handleSettingsAction(action) {
  switch (action) {
    case 'edit-profile':
      window.location.hash = '#/edit-profile';
      break;
    case 'notifications':
      toggleNotificationsPanel();
      break;
    case 'privacy':
      togglePrivacyPanel();
      break;
    case 'friends':
      window.location.hash = '#/friends';
      break;

    // Partage
    case 'share-link':
      handleShareLink();
      break;
    case 'share-social':
      handleShareSocial();
      break;
    case 'share-message':
      handleShareMessage();
      break;
    case 'share-embed':
      handleShareEmbed();
      break;

    // Aide
    case 'help-center':
      handleHelpCenter();
      break;
    case 'help-report':
      handleHelpReport();
      break;
    case 'help-terms':
      handleHelpTerms();
      break;
    case 'help-privacy-policy':
      handleHelpPrivacyPolicy();
      break;

    // Contact
    case 'contact-email':
      handleContactEmail();
      break;
    case 'contact-support':
      handleContactSupport();
      break;
    case 'contact-suggestion':
      handleContactSuggestion();
      break;

    // Status du compte
    case 'account-status-active':
      handleAccountStatusView();
      break;
    case 'account-status-restrict':
      handleAccountRestrict();
      break;
    case 'account-status-deactivate':
      handleAccountDeactivate();
      break;
  }
}

/**
 * Ferme tous les sous-menus ouverts, sauf celui éventuellement exclu.
 * @param {string=} exceptKey Clé du sous-menu à ne pas fermer.
 */
function closeAllSubmenus(exceptKey) {
  document.querySelectorAll('.settings-item-toggle').forEach((toggle) => {
    if (toggle.dataset.settingsToggle !== exceptKey) {
      toggle.classList.remove('open');
    }
  });
  document.querySelectorAll('.settings-submenu').forEach((submenu) => {
    if (submenu.dataset.submenu !== exceptKey) {
      submenu.classList.remove('open');
    }
  });
}

/**
 * Monte la vue : installe les event listeners.
 */
export function mount() {
  // Items simples (redirection ou toast direct)
  const items = document.querySelectorAll('.settings-item:not(.settings-item-toggle)');
  items.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      handleSettingsAction(item.dataset.settingsAction);
    });
  });

  // Items à menu déroulant (partage, aide, contact, status du compte)
  const toggles = document.querySelectorAll('.settings-item-toggle');
  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const key = toggle.dataset.settingsToggle;
      const submenu = document.querySelector(`.settings-submenu[data-submenu="${key}"]`);
      const isOpen = toggle.classList.contains('open');

      closeAllSubmenus();

      if (!isOpen) {
        toggle.classList.add('open');
        submenu.classList.add('open');
      }
    });
  });

  // Sous-items des menus déroulants
  const subitems = document.querySelectorAll('.settings-subitem');
  subitems.forEach((subitem) => {
    subitem.addEventListener('click', (event) => {
      event.stopPropagation();
      handleSettingsAction(subitem.dataset.settingsAction);
    });
  });

  const pauseAllInput = document.getElementById('toggle-pause-all');
  const messagesOnlyInput = document.getElementById('toggle-messages-only');
  const privateAccountInput = document.getElementById('toggle-private-account');

  if (pauseAllInput && messagesOnlyInput) {
    pauseAllInput.addEventListener('change', (e) => {
      const isPaused = e.target.checked;
      messagesOnlyInput.disabled = isPaused;

      const currentSettings = getNotificationSettings();
      saveNotificationSettings({
        ...currentSettings,
        pauseAll: isPaused,
      });

      showToast(isPaused ? 'Toutes les notifications sont en pause' : 'Notifications réactivées');
    });

    messagesOnlyInput.addEventListener('change', (e) => {
      const isMessagesOnly = e.target.checked;

      const currentSettings = getNotificationSettings();
      saveNotificationSettings({
        ...currentSettings,
        messagesOnly: isMessagesOnly,
      });

      showToast(isMessagesOnly ? 'Notifications limitées aux messages' : 'Toutes les notifications activées');
    });
  }

  if (privateAccountInput) {
    privateAccountInput.addEventListener('change', (e) => {
      const isPrivate = e.target.checked;

      savePrivacySettings({ isPrivate });

      showToast(isPrivate ? 'Votre compte est désormais privé' : 'Votre compte est désormais public');
    });
  }
}
