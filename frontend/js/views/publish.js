/**
 * @fileoverview Vue de création de publication (photo / vidéo).
 */

import { createPost, getFriends } from '../api.js';
import { buildFriendsListHtml } from '../friends-list.js';
import {showToast} from '../toast.js';
import {addNotification} from '../notification.js';
import {
  FILTRES, chargerImage, dessinerFiltre, creerVignette, exporterBlob,
} from '../filters.js';

let selectedFile = null;
let selectedMediaType = null;
let mediaPreviewUrl = null;

/** Pixels de l'image d'origine (sans filtre), base de chaque rendu. */
let imageOrigine = null;
/** Canvas d'aperçu de l'image, filtré ou non. */
let canvasApercu = null;
/** Filtre actuellement sélectionné ('original' par défaut). */
let filtreCourant = 'original';

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
            <div class="friends-visibility" id="friends-visibility" hidden>
              <p class="friends-visibility-title">Amis qui pourront voir cette publication :</p>
              <div id="friends-visibility-list">Chargement...</div>
            </div>
          </div>

          <div class="form-field" id="filters-field" hidden>
            <label>Filtres</label>
            <div class="filter-strip" id="filters-strip"></div>
            <span class="field-hint">
              Le filtre choisi est appliqué à l'image publiée.
            </span>
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
 * Affiche une image dans un canvas et construit la bande de filtres.
 *
 * L'image est redimensionnée (1080 px maximum) avant affichage : les
 * filtres parcourent les pixels, un clic reste donc instantané.
 *
 * @param {File} fichier Image sélectionnée.
 * @param {HTMLElement} preview Conteneur d'aperçu.
 * @return {Promise<void>}
 */
async function afficherImageAvecFiltres(fichier, preview) {
  const {canvas, imageData} = await chargerImage(fichier, 1080);

  imageOrigine = imageData;
  filtreCourant = 'original';
  canvasApercu = canvas;
  canvas.id = 'publish-canvas';
  canvas.className = 'publish-canvas';

  preview.innerHTML = '';
  preview.appendChild(canvas);

  construireVignettes(imageData);
  document.getElementById('filters-field').hidden = false;
}

/**
 * Construit la bande de vignettes (une par filtre) sous l'aperçu.
 *
 * @param {ImageData} origine Pixels de l'image d'origine.
 * @return {void}
 */
function construireVignettes(origine) {
  const bande = document.getElementById('filters-strip');
  bande.innerHTML = '';

  FILTRES.forEach((filtre) => {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'filter-thumb' +
      (filtre.id === 'original' ? ' active' : '');
    bouton.dataset.filter = filtre.id;
    bouton.title = filtre.label;

    bouton.appendChild(creerVignette(origine, filtre.id));

    const libelle = document.createElement('span');
    libelle.className = 'filter-thumb-label';
    libelle.textContent = filtre.label;
    bouton.appendChild(libelle);

    bouton.addEventListener('click', () => {
      filtreCourant = filtre.id;
      if (canvasApercu && imageOrigine) {
        dessinerFiltre(canvasApercu, imageOrigine, filtre.id);
      }
      bande.querySelectorAll('.filter-thumb').forEach((autre) => {
        autre.classList.toggle('active', autre === bouton);
      });
    });

    bande.appendChild(bouton);
  });
}

/**
 * Masque la bande de filtres (vidéo, ou sélection réinitialisée).
 * @return {void}
 */
function masquerFiltres() {
  const champ = document.getElementById('filters-field');
  if (champ) champ.hidden = true;
  const bande = document.getElementById('filters-strip');
  if (bande) bande.innerHTML = '';
  imageOrigine = null;
  canvasApercu = null;
  filtreCourant = 'original';
}

/**
 * Gère la sélection d'un fichier (input ou drag & drop).
 * @param {File} file Fichier sélectionné.
 * @return {Promise<void>}
 */
async function handleFileSelect(file) {
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
    masquerFiltres();
  } else {
    try {
      await afficherImageAvecFiltres(file, preview);
    } catch (erreur) {
      errorEl.textContent = erreur.message ||
        'Impossible de préparer cette image.';
      errorEl.hidden = false;
      resetMediaSelection();
      return;
    }
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

  masquerFiltres();
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
    // Image filtrée : on envoie le rendu du canvas, pas le fichier d'origine.
    let mediaFile = selectedFile;
    if (selectedMediaType === 'image' && filtreCourant !== 'original' &&
        canvasApercu) {
      const blob = await exporterBlob(canvasApercu);
      mediaFile = new File([blob], 'publication.jpg', {type: 'image/jpeg'});
    }

    await createPost({
      mediaFile: mediaFile,
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

  // « Amis uniquement » : affiche la liste d'amis sous l'option.
  const friendsBox = document.getElementById('friends-visibility');
  const friendsListEl = document.getElementById('friends-visibility-list');
  let friendsLoaded = false;
  const syncFriendsVisibility = async () => {
    const onlyFriends = document.querySelector(
      'input[name="visibility"]:checked',
    ).value === 'friends';
    friendsBox.hidden = !onlyFriends;
    if (onlyFriends && !friendsLoaded) {
      friendsLoaded = true;
      const friends = await getFriends();
      friendsListEl.innerHTML = buildFriendsListHtml(
        friends,
        "Vous n'avez pas encore d'amis : personne ne verra cette publication.",
      );
    }
  };
  form.querySelectorAll('input[name="visibility"]').forEach((radio) => {
    radio.addEventListener('change', syncFriendsVisibility);
  });
  // Le reset du formulaire (après publication) remet « Public ».
  form.addEventListener('reset', () => setTimeout(syncFriendsVisibility, 0));
}
