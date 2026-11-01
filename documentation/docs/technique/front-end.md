---
sidebar_position: 2
---

# Documentation technique — Front-end

Cette page décrit l'architecture technique du front-end InstaClone : structure des fichiers, routeur SPA, système de vues, couche API et conventions de code.

## Structure des fichiers

```
frontend/
├── index.html                  → Point d'entrée HTML unique (SPA)
├── css/
│   └── style.css               → Styles globaux + tous les composants
├── js/
│   ├── router.js              → Routeur SPA (hash-based)
│   ├── api.js                 → Couche d'abstraction API (mock / réel)
│   ├── mock-data.js           → Données fictives pour le développement
│   ├── feed.js                → Vue : fil d'actualité
│   └── views/
│       ├── login.js           → Vue : connexion / inscription
│       ├── profile.js         → Vue : profil utilisateur
│       ├── explore.js         → Vue : tendances / hashtags
│       └── messages.js        → Vue : messagerie instantanée
├── assets/
│   ├── icons/                 → Icônes SVG / PNG
│   └── images/                → Images statiques
```

## Point d'entrée (index.html)

Le fichier `index.html` contient uniquement la structure de base :

- Un `<header>` avec la navigation (liens vers `#/feed`, `#/explore`, `#/messages`, `#/profile`)
- Un conteneur `<main id="app-view">` vide — c'est là que le routeur injecte le HTML de chaque vue
- Une balise `<script type="module">` qui charge `router.js`

Aucun contenu de vue n'est écrit en dur dans le HTML. Tout est généré dynamiquement par JavaScript.

## Routeur SPA

### Principe

Le routeur utilise le **hash de l'URL** (`window.location.hash`) pour déterminer quelle vue afficher. Exemples :

- `https://localhost/#/feed` → vue Fil d'actualité
- `https://localhost/#/login` → vue Connexion
- `https://localhost/#/profile` → vue Profil

### Fonctionnement

```javascript
// router.js (extrait simplifié)

const ROUTES = {
  '#/feed':     { render: renderFeed,     mount: mountFeed,     hideHeader: false },
  '#/login':    { render: renderLogin,    mount: mountLogin,    hideHeader: true  },
  '#/profile':  { render: renderProfile,  mount: mountProfile,  hideHeader: false },
  '#/explore':  { render: renderExplore, mount: mountExplore,  hideHeader: false },
  '#/messages': { render: renderMessages, mount: mountMessages, hideHeader: false },
};
```

Chaque entrée de la table `ROUTES` contient :

| Champ | Type | Description |
|---|---|---|
| `render()` | `function → string` | Retourne le HTML de la vue |
| `mount()` | `async function` | Installe les event listeners après injection du HTML |
| `hideHeader` | `boolean` | Si `true`, masque le header (utilisé pour la page de login) |

### Cycle de navigation

1. L'utilisateur clique sur un lien (`#/messages`) ou l'URL change
2. L'événement `hashchange` se déclenche
3. `navigate(hash)` cherche la route dans `ROUTES`
4. Si la route n'existe pas → redirection vers `#/login` (route par défaut)
5. Le header est affiché/masqué selon `hideHeader`
6. `appView.innerHTML = route.render()` — injection du HTML
7. La classe `active` est mise à jour sur les liens de navigation
8. `await route.mount()` — installation des event listeners

### Avantages du hash-based routing

- Aucune configuration serveur nécessaire (pas de `mod_rewrite` pour le SPA)
- Fonctionne directement avec des fichiers statiques servis par Apache
- Compatible avec le HTTPS sans avertissement
- L'URL est partageable (`https://localhost/#/profile` ouvre directement le profil)

## Couche API (api.js)

### Principe

Le fichier `api.js` est une couche d'abstraction entre les vues et l'API REST. Il contient un flag `USE_MOCK` qui permet de basculer entre données fictives et vraies requêtes HTTP.

```javascript
const USE_MOCK = true;
const API_BASE_URL = '/api';
```

### Fonctions disponibles

| Fonction | Route API (quand `USE_MOCK = false`) | Description |
|---|---|---|
| `getFeedPosts()` | `GET /api/posts` | Récupère le fil d'actualité |
| `toggleLike(postId, liked)` | `POST /api/posts/:id/like` | Like / unlike une publication |
| `toggleDislike(postId, disliked)` | `POST /api/posts/:id/dislike` | Dislike / undislike |
| `sharePost(postId)` | `POST /api/posts/:id/share` | Repartage une publication |
| `reportPost(postId, reason)` | `POST /api/posts/:id/report` | Signale une publication |
| `getComments(postId)` | `GET /api/posts/:id/comments` | Récupère les commentaires |
| `addComment(postId, text)` | `POST /api/posts/:id/comments` | Ajoute un commentaire |
| `loginUser(username, password)` | `POST /api/auth/login` | Connexion |
| `registerUser(name, email, pwd)` | `POST /api/auth/register` | Inscription |
| `getCurrentUser()` | `GET /api/users/me` | Profil de l'utilisateur connecté |
| `getTrendingPosts()` | `GET /api/posts/trending` | Publications tendance |
| `getHashtags()` | `GET /api/hashtags/trending` | Hashtags populaires |
| `getConversations()` | `GET /api/messages/conversations` | Liste des conversations |
| `sendMessage(convId, text)` | `POST /api/messages/conversations/:id` | Envoie un message |

### Bascule mock → réel

Quand le back-end de Mathias sera prêt :

1. Passer `USE_MOCK` à `false` dans `api.js`
2. Décommenter les directives `ProxyPass` dans la config Apache
3. Redémarrer Apache

Les vues n'ont **aucune modification** à faire — la couche d'abstraction gère tout.

## Vues

Chaque vue est un module ES6 qui exporte deux fonctions :

```javascript
// Pattern commun à toutes les vues

export function render() {
  return `<div class="ma-vue">...</div>`;
}

export async function mount() {
  // Récupération des données via api.js
  // Installation des event listeners
}
```

### Vue Feed (fil d'actualité)

- Affiche les publications sous forme de cartes (`post-card`)
- Chaque carte contient : header (avatar + auteur + bouton signaler), média (photo/vidéo), actions (like/dislike/share/commentaires), corps (likes, caption, timestamp), section commentaires dépliable
- **Délégation d'événements** : un seul `addEventListener` sur le conteneur gère tous les clics (like, dislike, share, signaler, commentaires) via `event.target.closest()`
- **Mise à jour optimiste** : l'UI se met à jour immédiatement avant la réponse de l'API ; rollback en cas d'échec
- **Sécurité XSS** : tous les contenus utilisateur sont échappés via `escapeHtml()` avant injection dans le HTML

### Vue Login

- Deux modes : connexion et inscription (bascule via un bouton)
- Le champ "Nom complet" n'apparaît qu'en mode inscription
- Validation des champs, gestion d'erreurs affichée dans le formulaire
- Après succès : `window.location.hash = '#/feed'` (redirection vers le fil)
- Le header global est masqué sur cette vue (`hideHeader: true`)

### Vue Profile

- En-tête : avatar 150px, nom d'utilisateur, bouton "Modifier le profil", statistiques (publications / abonnés / abonnements), bio
- 3 onglets : Publications, Enregistrés, Identifié
- Grille de 3 colonnes de thumbnails carrés avec badge vidéo 🎬

### Vue Explore (tendances)

- Barre de recherche centrée (filtre les publications par auteur en temps réel)
- Section hashtags tendance (chips cliquables avec nom + nombre de publications)
- Grille de 3 colonnes de publications populaires avec overlay au survol (likes + auteur)

### Vue Messages

- Layout deux colonnes : sidebar gauche (liste des conversations) + zone de chat droite
- Chaque conversation affiche : avatar, nom, dernier message, timestamp, badge non lu (point bleu)
- La première conversation s'ouvre automatiquement au chargement
- L'envoi d'un message l'ajoute au DOM sans rechargement, scroll automatique en bas
- Le badge "non lu" disparaît à l'ouverture de la conversation

## Convention de code

### Google TypeScript Style Guide

Le code respecte le [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) :

- **2 espaces** pour l'indentation (pas de tabulations)
- **Point-virgule** obligatoire en fin d'instruction
- **Guillemets simples** pour les chaînes (`'texte'`), sauf dans les template literals (backticks)
- **const** par défaut, **let** si réassignation, jamais **var**
- **Fonctions fléchées** pour les callbacks
- **Modules ES6** (`import` / `export`) — pas de CommonJS (`require`)

### JSDoc

Toutes les fonctions publiques sont documentées avec JSDoc :

```javascript
/**
 * Récupère le fil d'actualité.
 * @return {Promise<Array<Object>>} Liste des publications.
 */
export async function getFeedPosts() { ... }
```

La génération de la documentation HTML à partir de ces commentaires se fait avec TypeDoc.

## FAQ technique

### Fichiers `:Zone.Identifier`

Si vous travaillez sur WSL et que vous voyez des fichiers se terminant par `:Zone.Identifier`, ce sont des flux NTFS Alternate Data Stream ajoutés par Windows quand un fichier est téléchargé depuis internet. Ils sont inoffensifs mais polluent le repo.

Pour les supprimer :

```bash
find . -name "*:Zone.Identifier" -delete
```

Ajoutez également cette ligne dans votre `.gitignore` :

```
*:Zone.Identifier
```
