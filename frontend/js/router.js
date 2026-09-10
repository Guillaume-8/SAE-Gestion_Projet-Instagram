/**
 * @fileoverview Routeur SPA basé sur le hash (#/route).
 * Conforme au Google Coding Style (ES6 Modules).
 */

import { render as renderFeed, mount as mountFeed } from './feed.js';
import { render as renderLogin, mount as mountLogin } from './views/login.js';
import { render as renderProfile, mount as mountProfile } from './views/profile.js';
import { render as renderExplore, mount as mountExplore } from './views/explore.js';
import { render as renderMessages, mount as mountMessages } from './views/messages.js';

/**
 * Table des routes enregistrées.
 * Chaque entrée contient une fonction render() (HTML) et mount() (event listeners).
 * @type {Object<string, {render: Function, mount: Function, hideHeader: boolean}>}
 */
const ROUTES = {
  '#/feed': {render: renderFeed, mount: mountFeed, hideHeader: false},
  '#/': {render: renderFeed, mount: mountFeed, hideHeader: false},
  '#/login': {render: renderLogin, mount: mountLogin, hideHeader: true},
  '#/profile': {render: renderProfile, mount: mountProfile, hideHeader: false},
  '#/explore': {render: renderExplore, mount: mountExplore, hideHeader: false},
  '#/messages': {render: renderMessages, mount: mountMessages, hideHeader: false},
};

/**
 * Route par défaut si le hash ne correspond à rien.
 * @type {string}
 */
const DEFAULT_ROUTE = '#/login';

/**
 * Met à jour la classe active sur les liens de navigation.
 * @param {string} currentRoute Route actuelle (ex: '#/feed').
 */
function updateActiveNav(currentRoute) {
  const navLinks = document.querySelectorAll('.btn-nav');
  navLinks.forEach((link) => {
    const linkRoute = link.getAttribute('href');
    if (linkRoute === currentRoute) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Navigue vers la route demandée, injecte le HTML et monte les listeners.
 * @param {string} hash Hash de l'URL (ex: '#/feed').
 */
async function navigate(hash) {
  const route = ROUTES[hash] || ROUTES[DEFAULT_ROUTE];
  const appView = document.getElementById('app-view');
  const header = document.getElementById('app-header');

  if (!appView) return;

  // Afficher / masquer le header selon la vue
  if (route.hideHeader) {
    header.classList.add('hidden');
  } else {
    header.classList.remove('hidden');
  }

  // Injection du HTML de la vue
  appView.innerHTML = route.render();

  // Mise à jour de la nav active
  updateActiveNav(hash);

  // Montage des event listeners de la vue
  try {
    await route.mount();
  } catch (error) {
    console.error(`Erreur lors du montage de la vue ${hash}:`, error);
  }
}

/**
 * Initialise le routeur.
 */
function initRouter() {
  // Navigation au chargement
  const currentHash = window.location.hash || DEFAULT_ROUTE;
  navigate(currentHash);

  // Navigation au changement de hash
  window.addEventListener('hashchange', () => {
    navigate(window.location.hash || DEFAULT_ROUTE);
  });
}

document.addEventListener('DOMContentLoaded', initRouter);
