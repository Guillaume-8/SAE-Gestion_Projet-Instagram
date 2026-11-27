/**
 * @fileoverview Menu de signalement d'une publication, partagé entre le fil
 * d'actualité et le modal de détail : le même menu (liste de motifs +
 * confirmation) s'affiche dans les deux cas.
 */

import {reportPost} from './api.js';
import {showToast} from './toast.js';
import {addNotification} from './notification.js';

/**
 * Motifs de signalement proposés.
 * @const {Array<string>}
 */
const REPORT_REASONS = [
  'Contenu inapproprié',
  'Spam ou arnaque',
  'Harcèlement ou discours haineux',
  'Faux compte ou usurpation d\'identité',
];

/**
 * Échappe les caractères HTML.
 * @param {string} text Texte à échapper.
 * @return {string} Texte échappé.
 */
function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Ouvre le menu de signalement d'une publication.
 * @param {number} postId Identifiant de la publication à signaler.
 * @param {function(): void=} onReported Appelé une fois le signalement
 *     enregistré (pour mettre à jour le bouton « Signaler »).
 */
export function openReportDialog(postId, onReported) {
  // Évite d'empiler deux menus si on clique rapidement.
  const existing = document.querySelector('.report-overlay[data-report-post]');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'report-overlay';
  overlay.dataset.reportPost = String(postId);
  overlay.innerHTML = `
    <div class="report-dialog">
      <h3>Signaler cette publication</h3>
      <p class="report-subtitle">Indiquez le motif du signalement :</p>
      <div class="report-reasons">
        ${REPORT_REASONS
          .map(
            (reason, index) => `
          <label class="report-reason">
            <input type="radio" name="report-reason" value="${escapeHtml(reason)}" ${index === 0 ? 'checked' : ''}>
            <span>${escapeHtml(reason)}</span>
          </label>
        `,
          )
          .join('')}
      </div>
      <div class="report-actions">
        <button class="btn-report-cancel">Annuler</button>
        <button class="btn-report-confirm">Confirmer le signalement</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeDialog = () => overlay.remove();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDialog();
  });

  overlay.querySelector('.btn-report-cancel').addEventListener('click', closeDialog);

  overlay.querySelector('.btn-report-confirm').addEventListener('click', async () => {
    const selectedReason = overlay.querySelector(
      'input[name="report-reason"]:checked',
    ).value;

    closeDialog();

    try {
      await reportPost(postId, selectedReason);
      addNotification('report', 'Vous avez signalé une publication', {postId});
      showToast('Publication signalée. Merci pour votre contribution.');
      if (onReported) onReported();
    } catch (error) {
      console.error('Erreur lors du signalement :', error);
      showToast('Échec du signalement', 'error');
    }
  });
}
