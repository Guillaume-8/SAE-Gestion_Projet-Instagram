---
sidebar_position: 2
title: Routeur SPA
---

# Routeur SPA

Le routeur (`js/router.js`) gère la navigation par hash. C'est le cœur de
l'application : toute page passe par lui.

## Pourquoi le hash

Avec un routage par chemin (`/messages`), Apache devrait renvoyer
`index.html` pour **toutes** les URL inconnues, et chaque backend devrait
ignorer ces chemins. Le hash (`#/messages`) reste côté navigateur : le serveur
ne voit jamais la route, aucun réglage de réécriture n'est nécessaire.

## Table des routes

| Route | Vue | En-tête | Rôle |
| --- | --- | --- | --- |
| `#/` et `#/feed` | `feed.js` | oui | Fil d'actualité |
| `#/login` | `views/login.js` | non | Connexion / inscription |
| `#/profile` | `views/profile.js` | oui | Profil (le sien ou `?user=pseudo`) |
| `#/edit-profile` | `views/edit-profile.js` | oui | Édition du profil |
| `#/explore` | `views/explore.js` | oui | Tendances et hashtags |
| `#/search` | `views/search.js` | oui | Recherche utilisateurs / tags |
| `#/publish` | `views/publish.js` | oui | Création de publication |
| `#/messages` | `views/messages.js` | oui | Messagerie temps réel |
| `#/settings` | `views/settings.js` | oui | Paramètres et confidentialité |
| `#/saved` | `views/saved.js` | oui | Publications enregistrées |
| `#/notif` | `views/notif.js` | oui | Centre de notifications |
| `#/friends` | `views/friends.js` | oui | Amis et suggestions |

Route par défaut : `#/login`. Un hash inconnu y retombe.

## Déclaration d'une route

```js
import {render as renderMessages, mount as mountMessages}
  from './views/messages.js';

const ROUTES = {
  '#/messages': {render: renderMessages, mount: mountMessages, hideHeader: false},
};
```

- `hideHeader` masque la barre de navigation (utile pour la connexion).
- Une même vue peut servir plusieurs routes (`#/` et `#/feed`).

## Query strings dans le hash

Le hash peut transporter des paramètres :

```
#/profile?user=YukikoInaba
#/messages?conv=3
```

Le routeur sépare la route des paramètres avant la recherche :

```js
const routeHash = hash.split('?')[0];
```

Chaque vue relit ensuite `window.location.hash` et extrait ses paramètres :

```js
const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
const pseudo = params.get('user');
```

## Navigation programmatique

```js
window.location.hash = '#/profile?user=' + encodeURIComponent(pseudo);
```

C'est le mécanisme utilisé par les pseudos cliquables de la messagerie, les
cartes de publication et le menu. `hashchange` déclenche `navigate()`, qui
démonte la vue précédente et monte la nouvelle.

## Erreurs de montage

Si `mount()` lève une exception, le routeur l'attrape et journalise
(`Erreur lors du montage de la vue …`) sans casser la page. Les erreurs
restent visibles dans la console du navigateur — c'est le premier endroit à
regarder en cas de page vide.

## Ajouter une vue

1. Créer `js/views/ma-vue.js` avec `render()` et `mount()`.
2. L'importer dans `router.js`.
3. Ajouter l'entrée dans `ROUTES`.
4. Ajouter un lien dans `index.html` (`.nav-menu`) si la page doit être
   accessible depuis la barre de navigation.
