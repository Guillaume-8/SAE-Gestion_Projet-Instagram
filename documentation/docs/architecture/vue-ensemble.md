---
sidebar_position: 1
title: Vue d'ensemble
---

# Vue d'ensemble de l'architecture

## Trois couches, deux backends

```
┌──────────────────────────────────────────────────────────────┐
│                      Navigateur (SPA)                        │
│  index.html · css/style.css · 21 modules ES6                 │
│  Routeur hash · api.js · messagerie Socket.io                │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS (une seule origine)
┌───────────────────────────▼──────────────────────────────────┐
│                     Apache 2.4 (443)                         │
│  Fichiers statiques + reverse proxy                          │
└──────────┬─────────────────────────────────┬─────────────────┘
           │ /api/auth · /api/users          │ /socket.io · /uploads
           │ /api/posts · /api/hashtags      │ /api (reste)
┌──────────▼──────────────┐      ┌───────────▼─────────────────┐
│  backend-api (3001)     │      │  backend-messagerie (3000)  │
│  Express · MariaDB      │      │  Express · Socket.io        │
│  base PhotoVideo        │      │  SQLite                     │
└─────────────────────────┘      └─────────────────────────────┘
```

Le front ne sait pas qu'il y a deux serveurs : il appelle toujours des chemins
relatifs (`/api/...`), et Apache décide. C'est ce qui permet d'ajouter ou de
déplacer un backend sans toucher au code client.

## Cycle de vie d'une page

1. Le navigateur charge `index.html` (une seule fois).
2. `js/menu.js` initialise le thème, le menu, la session.
3. `js/router.js` lit le hash (`#/messages` par exemple) et appelle la vue.
4. La vue exécute `render()` → renvoie une chaîne HTML.
5. Le routeur l'injecte dans `#app-view`, puis appelle `mount()`.
6. `mount()` branche les écouteurs et charge les données (`api.js` ou socket).

Chaque changement de hash relance les étapes 3 à 6. Aucune page n'est jamais
rechargée.

## Le contrat `render()` / `mount()`

Toutes les vues exposent exactement deux fonctions :

```js
/**
 * Construit le HTML de la vue (aucun effet de bord).
 * @return {string} Balisage HTML de la page.
 */
export function render() {
  return `<section class="messages-page">…</section>`;
}

/**
 * Branche les écouteurs et charge les données après insertion dans le DOM.
 * @return {Promise<void>}
 */
export async function mount() {
  // Les éléments existent ici : on peut les interroger et les écouter.
}
```

Cette séparation évite les fuites mémoire : `render()` ne touche jamais au DOM,
`mount()` ne construit jamais de HTML « à la volée » sans le rattacher.

## Le mode mock

Deux niveaux de repli protègent les démonstrations :

| Situation | Comportement |
| --- | --- |
| API MariaDB injoignable | `api.js` renvoie des données fictives (`mock-data.js`) |
| Serveur de messagerie éteint | Conversations et messages fictifs, bannière orange |

Le repli se déclenche par un `catch` sur la requête réseau. Il permet de
présenter l'interface même sans base de données, au prix de données non
persistées.

:::warning Conséquence à connaître
En mode mock, un message envoyé **n'atteint personne** : il n'est affiché que
localement. La bannière orange et les toasts d'erreur servent précisément à
distinguer « ça marche » de « ça a l'air de marcher ».
:::

## Ce que le front ne fait pas

- Il ne calcule aucune autorisation : la confiance est côté serveur.
- Il ne stocke pas de mots de passe : seul le pseudo de session est en
  `localStorage`.
- Il n'accède jamais directement à MariaDB ni à SQLite.
