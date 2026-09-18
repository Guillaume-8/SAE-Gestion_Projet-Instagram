/**
 * @fileoverview Vue de gestion des amis / abonnements avec une interface style Instagram.
 */

import { getUsers, getFriendsList } from '../api.js';

const FRIENDS_REMOVED_KEY = 'instaclone_removed_friends';

/**
 * Récupère la liste des amis retirés/masqués dans le LocalStorage.
 * @return {Array<string>}
 */
function getRemovedFriends() {
  const saved = localStorage.getItem(FRIENDS_REMOVED_KEY);
  return saved ? JSON.parse(saved) : [];
}

/**
 * Enregistre le retrait d'un ami.
 * @param {string} pseudo
 */
function removeFriendLocally(pseudo) {
  const removed = getRemovedFriends();
  if (!removed.includes(pseudo)) {
    removed.push(pseudo);
    localStorage.setItem(FRIENDS_REMOVED_KEY, JSON.stringify(removed));
  }
}

/**
 * Génère une couleur d'avatar aléatoire basée sur le nom d'utilisateur.
 * @param {string} username 
 * @return {string}
 */
function getAvatarGradient(username) {
  const gradients = [
    'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #b1ea4d 0%, #459522 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    'linear-gradient(135deg, #f12711 0%, #f5af19 100%)'
  ];
  let charCodeSum = 0;
  for (let i = 0; i < username.length; i++) {
    charCodeSum += username.charCodeAt(i);
  }
  return gradients[charCodeSum % gradients.length];
}

/**
 * Rend le squelette HTML de la page Amis (Style Instagram UI).
 */
export function render() {
  return `
    <style>
      .ig-friends-page {
        max-width: 600px;
        margin: 0 auto;
        min-height: 100vh;
        background-color: #000000;
        color: #f5f5f5;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        padding-bottom: 70px;
      }

      .ig-header {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background-color: #000000;
        border-bottom: 1px solid #262626;
      }

      .ig-header-title {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .ig-btn-back {
        background: none;
        border: none;
        color: #ffffff;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
      }

      .ig-header h2 {
        font-size: 18px;
        font-weight: 700;
        margin: 0;
        letter-spacing: -0.3px;
      }

      .ig-tabs {
        display: flex;
        border-bottom: 1px solid #262626;
        background-color: #000000;
      }

      .ig-tab {
        flex: 1;
        text-align: center;
        padding: 14px 0;
        font-size: 14px;
        font-weight: 600;
        color: #a8a8a8;
        cursor: pointer;
        position: relative;
        transition: color 0.2s ease;
      }

      .ig-tab.active {
        color: #ffffff;
      }

      .ig-tab.active::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background-color: #ffffff;
      }

      .ig-search-container {
        padding: 12px 16px;
      }

      .ig-search-box {
        position: relative;
        display: flex;
        align-items: center;
        background-color: #262626;
        border-radius: 10px;
        padding: 8px 12px;
      }

      .ig-search-icon {
        color: #8e8e8e;
        margin-right: 8px;
        font-size: 14px;
      }

      .ig-search-input {
        width: 100%;
        background: transparent;
        border: none;
        outline: none;
        color: #ffffff;
        font-size: 14px;
      }

      .ig-search-input::placeholder {
        color: #8e8e8e;
      }

      .ig-friends-list {
        display: flex;
        flex-direction: column;
        padding: 4px 16px;
      }

      .ig-friend-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      .ig-user-info {
        display: flex;
        align-items: center;
        gap: 12px;
        text-decoration: none;
        color: inherit;
        flex-grow: 1;
      }

      .ig-avatar-ring {
        padding: 2px;
        background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ig-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid #000000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 18px;
        color: #ffffff;
        text-transform: uppercase;
      }

      .ig-user-details {
        display: flex;
        flex-direction: column;
      }

      .ig-username {
        font-weight: 600;
        font-size: 14px;
        color: #f5f5f5;
        line-height: 18px;
      }

      .ig-subtext {
        font-size: 12px;
        color: #a8a8a8;
        margin-top: 2px;
      }

      .ig-action-btn {
        background-color: #363636;
        color: #ffffff;
        border: none;
        padding: 7px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.15s ease, transform 0.1s ease;
      }

      .ig-action-btn:hover {
        background-color: #262626;
      }

      .ig-action-btn:active {
        transform: scale(0.96);
      }

      .ig-action-btn.danger {
        background-color: rgba(237, 73, 86, 0.15);
        color: #ed4956;
      }

      .ig-action-btn.danger:hover {
        background-color: rgba(237, 73, 86, 0.25);
      }

      .ig-empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #8e8e8e;
      }

      .ig-empty-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      .ig-empty-text {
        font-size: 14px;
      }

      .ig-loading {
        text-align: center;
        padding: 30px;
        color: #a8a8a8;
        font-size: 14px;
      }
    </style>

    <div class="ig-friends-page">
      <div class="ig-header">
        <div class="ig-header-title">
          <button class="ig-btn-back" id="btn-back-settings" title="Retour">✕</button>
          <h2>Abonnements & Amis</h2>
        </div>
      </div>

      <div class="ig-tabs">
        <div class="ig-tab active" id="tab-all">Tous les amis</div>
        <div class="ig-tab" id="tab-suggestions">Suggestions</div>
      </div>

      <div class="ig-search-container">
        <div class="ig-search-box">
          <span class="ig-search-icon">🔍</span>
          <input 
            type="text" 
            id="friends-search-input" 
            class="ig-search-input" 
            placeholder="Rechercher" 
            autocomplete="off"
          />
        </div>
      </div>

      <div id="friends-list-container" class="ig-friends-list">
        <div class="ig-loading">Chargement...</div>
      </div>
    </div>
  `;
}

/**
 * Génère le rendu HTML de la liste des amis au format Instagram.
 * @param {Array<string>} friends Liste des pseudonymes.
 */
function renderFriendsList(friends) {
  const container = document.getElementById('friends-list-container');
  if (!container) return;

  if (friends.length === 0) {
    container.innerHTML = `
      <div class="ig-empty-state">
        <div class="ig-empty-icon">👥</div>
        <div class="ig-empty-text">Aucun utilisateur trouvé</div>
      </div>
    `;
    return;
  }

  container.innerHTML = friends
    .map((pseudo) => {
      const initial = pseudo.charAt(0).toUpperCase();
      const bgStyle = getAvatarGradient(pseudo);

      return `
        <div class="ig-friend-item" data-pseudo="${pseudo}">
          <div class="ig-user-info">
            <div class="ig-avatar-ring">
              <div class="ig-avatar" style="background: ${bgStyle};">
                ${initial}
              </div>
            </div>
            <div class="ig-user-details">
              <span class="ig-username">${pseudo}</span>
              <span class="ig-subtext">Abonné(e)</span>
            </div>
          </div>
          <button class="ig-action-btn danger btn-remove-friend" data-pseudo="${pseudo}">
            Retirer
          </button>
        </div>
      `;
    })
    .join('');
}

/**
 * Initialise et monte la vue des amis.
 */
export async function mount() {
  const searchInput = document.getElementById('friends-search-input');
  const container = document.getElementById('friends-list-container');
  const backBtn = document.getElementById('btn-back-settings');
  const tabAll = document.getElementById('tab-all');
  const tabSuggestions = document.getElementById('tab-suggestions');

  // Navigation retour vers les paramètres
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.hash = '#/settings';
    });
  }

  try {
    const currentPseudo = localStorage.getItem('instaclone_user') || 'Moi';

    // Récupération sécurisée avec gestion d'erreurs
    let rawUsers = [];
    try {
      if (typeof getUsers === 'function') {
        rawUsers = await getUsers();
      } else if (typeof getFriendsList === 'function') {
        rawUsers = await getFriendsList();
      }
    } catch (e) {
      console.warn('Fallback de récupération des amis :', e);
    }

    // Standardisation de la réponse API (string ou object)
    const allUsers = rawUsers.map((u) =>
      typeof u === 'string' ? u : u.username || u.displayName || u.pseudonyme,
    );

    const removedFriends = getRemovedFriends();

    // Filtrer l'utilisateur courant et ceux supprimés
    let activeFriends = allUsers.filter(
      (u) => u && u !== currentPseudo && !removedFriends.includes(u),
    );

    // Rendu initial
    renderFriendsList(activeFriends);

    // Barre de recherche fluide en temps réel
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = activeFriends.filter((pseudo) =>
          pseudo.toLowerCase().includes(query),
        );
        renderFriendsList(filtered);
      });
    }

    // Gestion de la suppression (Retirer un ami)
    if (container) {
      container.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.btn-remove-friend');
        if (!removeBtn) return;

        const targetPseudo = removeBtn.dataset.pseudo;
        const itemEl = removeBtn.closest('.ig-friend-item');

        if (confirm(`Voulez-vous retirer ${targetPseudo} de vos abonnements ?`)) {
          removeFriendLocally(targetPseudo);

          // Animation de disparition Instagram
          if (itemEl) {
            itemEl.style.opacity = '0';
            itemEl.style.transform = 'translateX(20px)';
            setTimeout(() => {
              activeFriends = activeFriends.filter((u) => u !== targetPseudo);
              const currentQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
              renderFriendsList(
                activeFriends.filter((p) => p.toLowerCase().includes(currentQuery)),
              );
            }, 200);
          }
        }
      });
    }

    // Gestion visuelle des onglets
    if (tabAll && tabSuggestions) {
      tabAll.addEventListener('click', () => {
        tabAll.classList.add('active');
        tabSuggestions.classList.remove('active');
        renderFriendsList(activeFriends);
      });

      tabSuggestions.addEventListener('click', () => {
        tabSuggestions.classList.add('active');
        tabAll.classList.remove('active');
        // Mode suggestion basique
        const suggestions = ['insta_official', 'creators_hub', 'design_daily'].filter(
          (u) => !removedFriends.includes(u),
        );
        renderFriendsList(suggestions);
      });
    }
  } catch (error) {
    console.error('Erreur chargement de la vue Amis :', error);
    if (container) {
      container.innerHTML = `
        <div class="ig-empty-state">
          <div class="ig-empty-text" style="color: #ed4956;">
            Impossible de charger les abonnements.
          </div>
        </div>
      `;
    }
  }
}