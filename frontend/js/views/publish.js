/**
 * @fileoverview Vue de création de publication (photo / vidéo).
 */

import { createPost } from '../api.js';
import {showToast} from '../toast.js';
import {addNotification} from '../notification.js';

let selectedFile = null;
let selectedMediaType = null;
let mediaPreviewUrl = null;

/**
 * Rend le squelette HTML de la vue Publication.
 * @return {string} HTML de la vue.
 */
export function render() {
  return `
    <div class="publish-page">
      <div class="publish-card">
        <h2 class="publish-title">Créer une publication</h2>

        <div class="upload-zone" id="upload-zone">
          <div class="upload-placeholder" id="upload-placeholder">
            <span class="upload-icon">📷</span>
            <p class="upload-text">Glissez votre photo ou vidéo ici</p>
            <p class="upload-subtext">ou cliquez pour parcourir</p>
            <p class="upload-formats">Formats : JPG, PNG, GIF, MP4, WebM (max 50 Mo)</p>
          </div>
          <div class="upload-preview hidden" id="upload-preview"></div>
          <input type="file" id="file-input" accept="image/*,video/*" hidden>
        </div>

        <button class="btn-change-media hidden" id="btn-change-media">Changer le média</button>

        <form class="publish-form" id="publish-form">
          <div class="form-field">
            <label for="publish-caption">Légende</label>
            <textarea
              id="publish-caption"
              class="publish-caption"
              placeholder="Écrivez une légende... #butrt #sae502"
              maxlength="2200"
              rows="3"></textarea>
            <span class="char-count"><span id="char-count">0</span>/2200</span>
          </div>

          <div class="form-field">
            <label for="publish-hashtags">Hashtags</label>
            <input
              type="text"
              id="publish-hashtags"
              class="publish-hashtags"
              placeholder="#butrt #dev #multimedia"
              maxlength="200">
            <span class="field-hint">Séparez les hashtags par des espaces</span>
          </div>

          <div class="form-field">
            <label>Visibilité</label>
            <div class="visibility-options">
              <label class="visibility-option">
                <input type="radio" name="visibility" value="public" checked>
                <span class="visibility-label">
                  <span class="visibility-icon">🌍</span>
                  <span class="visibility-text">
                    <strong>Public</strong>
                    <small>Tout le monde peut voir cette publication</small>
                  </span>
                </span>
              </label>
              <label class="visibility-option">
                <input type="radio" name="visibility" value="friends">
                <span class="visibility-label">
                  <span class="visibility-icon">👥</span>
                  <span class="visibility-text">
                    <strong>Amis uniquement</strong>
                    <small>Seuls vos amis peuvent voir cette publication</small>
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div class="form-field">
            <label>Filtres et retouche</label>
            <div class="filters-placeholder" id="filters-placeholder">
              <span class="filters-info">
                ✨ Les filtres et retouches photo seront disponibles ici
                (en cours de développement par Tanguy & Jonathan)
              </span>
            </div>
          </div>

          <p class="publish-error" id="publish-error" hidden></p>

          <div class="publish-actions">
            <button type="button" class="btn-cancel" id="btn-cancel-publish">Annuler</button>
            <button type="submit" class="btn-publish" id="btn-publish" disabled>
              Publier
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * Gère la sélection d'un fichier (input ou drag & drop).
 * @param {File} file Fichier sélectionné.
 */
function handleFileSelect(file) {
  const errorEl = document.getElementById('publish-error');
  const publishBtn = document.getElementById('btn-publish');
  const placeholder = document.getElementById('upload-placeholder');
  const preview = document.getElementById('upload-preview');
  const changeBtn = document.getElementById('btn-change-media');

  errorEl.hidden = true;

  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    errorEl.textContent = 'Format non supporté. Utilisez une image ou une vidéo.';
    errorEl.hidden = false;
    return;
  }

  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    errorEl.textContent = 'Le fichier dépasse 50 Mo.';
    errorEl.hidden = false;
    return;
  }

  selectedFile = file;
  selectedMediaType = file.type.startsWith('video/') ? 'video' : 'image';

  if (mediaPreviewUrl) {
    URL.revokeObjectURL(mediaPreviewUrl);
  }
  mediaPreviewUrl = URL.createObjectURL(file);

  if (selectedMediaType === 'video') {
    preview.innerHTML = '<video controls src="' + mediaPreviewUrl + '"></video>';
  } else {
    preview.innerHTML = '<img src="' + mediaPreviewUrl + '" alt="Aperçu de la publication">';
  }

  placeholder.classList.add('hidden');
  preview.classList.remove('hidden');
  changeBtn.classList.remove('hidden');
  publishBtn.disabled = false;
}

/**
 * Réinitialise la sélection de média.
 */
function resetMediaSelection() {
  selectedFile = null;
  selectedMediaType = null;

  if (mediaPreviewUrl) {
    URL.revokeObjectURL(mediaPreviewUrl);
    mediaPreviewUrl = null;
  }

  const placeholder = document.getElementById('upload-placeholder');
  const preview = document.getElementById('upload-preview');
  const changeBtn = document.getElementById('btn-change-media');
  const publishBtn = document.getElementById('btn-publish');

  preview.innerHTML = '';
  placeholder.classList.remove('hidden');
  preview.classList.add('hidden');
  changeBtn.classList.add('hidden');
  publishBtn.disabled = true;
}

/**
 * Gère la soumission du formulaire de publication.
 */
async function handlePublishSubmit() {
  const caption = document.getElementById('publish-caption').value.trim();
  const hashtags = document.getElementById('publish-hashtags').value.trim();
  const visibility = document.querySelector(
    'input[name="visibility"]:checked',
  ).value;
  const errorEl = document.getElementById('publish-error');
  const publishBtn = document.getElementById('btn-publish');

  let fullCaption = caption;
  if (hashtags) {
    fullCaption = (caption + ' ' + hashtags).trim();
  }

  errorEl.hidden = true;
  publishBtn.disabled = true;
  publishBtn.textContent = 'Publication...';

  try {
    await createPost({
      mediaFile: selectedFile,
      mediaType: selectedMediaType,
      caption: fullCaption,
      visibility: visibility,
    });

    addNotification('info', 'Votre publication a été mise en ligne');
    showToast('Publication créée avec succès !', 'success');

    document.getElementById('publish-form').reset();
    document.getElementById('char-count').textContent = '0';
    resetMediaSelection();

    setTimeout(() => {
      window.location.hash = '#/feed';
    }, 1200);
  } catch (error) {
    errorEl.textContent = error.message || 'Erreur lors de la publication.';
    errorEl.hidden = false;
    publishBtn.disabled = false;
    publishBtn.textContent = 'Publier';
  }
}

/**
 * Monte la vue : installe les event listeners.
 */
export function mount() {
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const changeBtn = document.getElementById('btn-change-media');
  const cancelBtn = document.getElementById('btn-cancel-publish');
  const form = document.getElementById('publish-form');
  const caption = document.getElementById('publish-caption');
  const charCount = document.getElementById('char-count');

  uploadZone.addEventListener('click', (e) => {
    if (e.target.closest('#upload-preview')) return;
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  });

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });

  changeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  caption.addEventListener('input', () => {
    charCount.textContent = caption.value.length;
  });

  cancelBtn.addEventListener('click', () => {
    document.getElementById('publish-form').reset();
    charCount.textContent = '0';
    resetMediaSelection();
    window.location.hash = '#/feed';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handlePublishSubmit();
  });
}
