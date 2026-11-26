/**
 * @fileoverview Rendu partagé d'une liste d'amis (modal du profil,
 * aperçu dans la page de publication).
 */

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
 * Génère le HTML d'une liste d'amis.
 * @param {Array<{username: string, avatar: string}>} friends Amis.
 * @param {string} emptyText Texte affiché si la liste est vide.
 * @return {string} HTML de la liste.
 */
export function buildFriendsListHtml(friends, emptyText) {
  if (friends.length === 0) {
    return `<p class="friends-empty">${escapeHtml(emptyText)}</p>`;
  }
  return `<ul class="friends-list">${friends
    .map(
      (friend) => `
      <li class="friends-list-item" data-username="${escapeHtml(friend.username)}">
        <img src="${escapeHtml(friend.avatar)}" alt="" class="friends-list-avatar">
        <span class="friends-list-name">${escapeHtml(friend.username)}</span>
      </li>`,
    )
    .join('')}</ul>`;
}
