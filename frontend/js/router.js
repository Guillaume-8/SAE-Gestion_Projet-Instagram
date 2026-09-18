/**
 * @fileoverview Routeur SPA basé sur le hash (#/route).
 * Conforme au Google Coding Style (ES6 Modules).
 */

import { render as renderFeed, mount as mountFeed } from './feed.js';
import { render as renderLogin, mount as mountLogin } from './views/login.js';
import { render as renderProfile, mount as mountProfile } from './views/profile.js';
import { render as renderExplore, mount as mountExplore } from './views/explore.js';
import { render as renderMessages, mount as mountMessages } from './views/messages.js';
import { render as renderPublish, mount as mountPublish } from './views/publish.js';
import { render as renderSettings, mount as mountSettings } from './views/settings.js';
import { render as renderSaved, mount as mountSaved } from './views/saved.js';
import { render as renderEditProfile, mount as mountEditProfile } from './views/edit-profile.js';
import { render as renderSearch, mount as mountSearch } from './views/search.js';
import { render as renderNotif, mount as mountNotif } from './views/notif.js';
import { render as renderFriends, mount as mountFriends } from './views/friends.js';

/**
 * Table des routes enregistrées.
 * @type {Object<string, {render: Function, mount: Function, hideHeader: boolean}>}
 */
const ROUTES = {
  '#/feed': {render: renderFeed, mount: mountFeed, hideHeader: false},
  '#/': {render: renderFeed, mount: mountFeed, hideHeader: false},
  '#/login': {render: renderLogin, mount: mountLogin, hideHeader: true},
  '#/profile': {render: renderProfile, mount: mountProfile, hideHeader: false},
  '#/edit-profile': {render: renderEditProfile, mount: mountEditProfile, hideHeader: false},
  '#/explore': {render: renderExplore, mount: mountExplore, hideHeader: false},
  '#/search': {render: renderSearch, mount: mountSearch, hideHeader: false},
  '#/publish': {render: renderPublish, mount: mountPublish, hideHeader: false},
  '#/messages': {render: renderMessages, mount: mountMessages, hideHeader: false},
  '#/settings': {render: renderSettings, mount: mountSettings, hideHeader: false},
  '#/saved': {render: renderSaved, mount: mountSaved, hideHeader: false},
  '#/notif': {render: renderNotif, mount: mountNotif, hideHeader: false},
  '#/friends': {render: renderFriends, mount: mountFriends, hideHeader: false},
};

/**
 * Route par défaut si le hash ne correspond à rien.
 * @type {string}
 */
const DEFAULT_ROUTE = '#/login';

/**
 * Met à jour la classe active sur les liens de navigation.
 * @param {string} currentRoute Route actuelle.
 */
function updateActiveNav(currentRoute) {
  const navLinks = document.querySelectorAll('.nav-menu .btn-nav');
  navLinks.forEach((link) => {
    if (link.getAttribute('href') === currentRoute) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Navigue vers la route demandée.
 * @param {string} hash Hash de l'URL.
 */
async function navigate(hash) {
  // Le hash peut contenir une query string (#/profile?user=x,
  // #/explore?tag=y) : on la retire pour la résolution de la route.
  const routeHash = hash.split('?')[0];
  const route = ROUTES[routeHash] || ROUTES[DEFAULT_ROUTE];
  const appView = document.getElementById('app-view');
  const header = document.getElementById('app-header');

  if (!appView) return;

  if (route.hideHeader) {
    header.classList.add('hidden');
  } else {
    header.classList.remove('hidden');
  }

  appView.innerHTML = route.render();
  updateActiveNav(routeHash);

  try {
    if (typeof route.mount === 'function') {
      await route.mount();
    }
  } catch (error) {
    console.error(`Erreur lors du montage de la vue ${hash}:`, error);
  }
}

/**
 * Initialise le routeur.
 */
function initRouter() {
  const currentHash = window.location.hash || DEFAULT_ROUTE;
  navigate(currentHash);

  window.addEventListener('hashchange', () => {
    navigate(window.location.hash || DEFAULT_ROUTE);
  });
}

document.addEventListener('DOMContentLoaded', initRouter);
