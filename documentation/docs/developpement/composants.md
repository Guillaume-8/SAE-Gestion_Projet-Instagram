---
sidebar_position: 3
title: Modules partagés
---

# Modules partagés

Ces modules ne sont pas des vues : ils fournissent des services à toutes les
pages.

## `menu.js` — en-tête, thème, session

- Applique le thème sauvegardé dès le chargement (`instaclone-theme`), avant
  le premier rendu, pour éviter le flash blanc.
- Gère le menu mobile (bouton hamburger).
- Met à jour le badge de notifications.
- Expose la session courante (pseudo lu dans `instaclone_user`).

```js
// Bascule de thème
function appliquerTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('instaclone-theme', theme);
}
```

## `toast.js` — messages éphémères

```js
import {showToast} from './toast.js';

showToast('Publication créée.', 'success');
showToast('Serveur de messagerie non connecté.', 'error');
```

- Trois tons : `success`, `error`, `info`.
- Empilement vertical, disparition automatique.
- Aucune dépendance : utilisable depuis n'importe quel module.

## `notification.js` — centre de notifications et socket partagé

Deux responsabilités :

1. **Socket partagé** — crée `window.socket` une seule fois :

```js
if (typeof window.io !== 'undefined' && !window.socket) {
  window.socket = window.io();
}
```

   La messagerie réutilise ce même socket (`window.socket`) au lieu d'en ouvrir
   un second : une seule connexion WebSocket pour toute l'application.

2. **Centre de notifications** — écoute `post_liked` (like en temps réel),
   alimente la cloche et le badge, affiche les toasts.

:::warning Une seule connexion
Deux `io()` simultanés multiplieraient les connexions et les événements reçus
en double. Toujours passer par `window.socket`.
:::

## `post-modal.js` — détail d'une publication

- Ouvre une modale au clic sur une carte.
- Gère like **et** dislike (le sujet impose les deux), commentaires,
  signalement, repartage.
- Met à jour le compteur localement avant la réponse serveur (retour immédiat).
- Fermeture par `Échap`, clic sur le fond, ou bouton.

## `image-helper.js` — avatars et repli

```js
/**
 * Construit une URL d'avatar stable pour un pseudo.
 * @param {string} pseudo Pseudonyme.
 * @return {string} URL de l'image.
 */
export function makeAvatar(pseudo) {
  return 'https://ui-avatars.com/api/?name=' +
    encodeURIComponent(pseudo) + '&background=random';
}
```

Utilisé partout où un compte apparaît sans photo : fil, profils, messagerie,
amis.

## `media-fallback.js` — images cassées

Intercepte les erreurs de chargement d'image et substitue un visuel neutre,
pour ne jamais afficher l'icône « image cassée » du navigateur. Utile quand un
fichier a été supprimé de `assets/` ou quand `/uploads` n'est pas proxifié.

## `mock-data.js` — données de démonstration

- Publications, utilisateurs, conversations et messages fictifs.
- Toujours consommé via `structuredClone` pour éviter les mutations croisées.
- Permet de présenter l'interface sans base de données.

## Bonnes pratiques entre modules

| Règle | Raison |
| --- | --- |
| Importer ce dont on a besoin, rien de plus | Les modules ES6 sont mis en cache par le navigateur |
| Pas d'effet de bord à l'import | Un module importé ne doit rien afficher |
| `escapeHtml()` sur toute donnée serveur | Protection contre l'injection |
| Un seul `document.addEventListener` par module et par événement | Éviter les doublons au remontage |
