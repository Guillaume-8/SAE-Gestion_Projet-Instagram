---
sidebar_position: 1
title: Client API
---

# Client API (`api.js`)

`api.js` centralise tous les appels à l'API MariaDB. Aucune vue ne fait de
`fetch` directement (sauf la messagerie, qui a son propre backend).

## Base des URL

```js
const API_BASE_URL = '/api';
```

Chemin relatif : Apache aiguille vers le port 3001 pour `/api/auth`,
`/api/users`, `/api/posts`, `/api/hashtags`. Le front n'a jamais besoin de
connaître le port.

## Fonction d'envoi commune

```js
/**
 * Envoie une requête à l'API et renvoie le JSON.
 * @param {string} chemin Chemin relatif (ex. '/posts').
 * @param {Object=} options Options fetch (method, body, headers).
 * @return {Promise<*>} Réponse désérialisée.
 */
async function requete(chemin, options = {}) {
  const reponse = await fetch(API_BASE_URL + chemin, {
    headers: {'Content-Type': 'application/json'},
    ...options,
  });
  if (!reponse.ok) {
    throw new Error('Erreur API ' + reponse.status);
  }
  return reponse.json();
}
```

## Fonctions exposées

| Fonction | Endpoint | Usage |
| --- | --- | --- |
| `login(pseudo, mdp)` | `POST /auth/login` | Connexion |
| `register(donnees)` | `POST /auth/register` | Inscription |
| `getPosts()` | `GET /posts` | Fil d'actualité |
| `getTrending()` | `GET /posts/trending` | Tendances |
| `getPost(id)` | `GET /posts/:id` | Détail d'une publication |
| `searchPosts(q)` | `GET /posts/search` | Recherche |
| `createPost(formData)` | `POST /posts` | Publication (multipart) |
| `likePost(id)` / `dislikePost(id)` | `POST /posts/:id/like` \| `/dislike` | Réactions |
| `getComments(id)` / `addComment(id, texte)` | `/posts/:id/comments` | Commentaires |
| `reportPost(id, motif)` | `POST /posts/:id/report` | Signalement |
| `republishPost(id)` | `POST /posts/:id/republish` | Repartage |
| `getUsers()` | `GET /users` | Liste des comptes |
| `getUserProfile(pseudo)` | `GET /users/:pseudonyme` | Profil d'un autre |
| `getMe()` / `updateMe(donnees)` | `GET` / `PUT /users/me` | Profil courant |
| `getHashtags()` | `GET /hashtags` | Tags avec compteurs |

## Mode réel et repli mock

Chaque fonction suit le même schéma :

```js
export async function getPosts() {
  try {
    const donnees = await requete('/posts');
    return donnees.map(mapRealPost);
  } catch (erreur) {
    console.warn('API indisponible, données de démonstration.', erreur);
    return structuredClone(MOCK_POSTS);
  }
}
```

Trois principes :

1. **`structuredClone`** systématique sur les données mock : sans lui, deux
   appels partageraient les mêmes objets et un like modifierait la source.
2. **`mapRealPost`** convertit les colonnes SQL (`id_publication`,
   `Pseudonyme_utilisateur`, `Date_publication`…) en un format stable pour les
   vues (`id`, `author`, `date`…).
3. **Le repli ne masque jamais une erreur de code** : il ne se déclenche que
   sur un échec réseau ou HTTP, et journalise toujours un avertissement.

## Normalisation des publications

```js
/**
 * Convertit une ligne SQL en objet de vue.
 * @param {Object} ligne Ligne brute renvoyée par l'API.
 * @return {Object} Publication normalisée.
 */
function mapRealPost(ligne) {
  return {
    id: ligne.id_publication,
    author: ligne.Pseudonyme_utilisateur,
    image: ligne.url_media,
    caption: ligne.legende,
    date: ligne.Date_publication,
    likes: ligne.nb_likes || 0,
    dislikes: ligne.nb_dislikes || 0,
    hashtags: ligne.hashtags || [],
  };
}
```

## Upload de fichiers

Les publications passent en `multipart/form-data` ; il ne faut **pas** fixer
`Content-Type` (le navigateur ajoute la frontière lui-même) :

```js
const form = new FormData();
form.append('media', fichier);
form.append('legende', texte);
await fetch('/api/posts', {method: 'POST', body: form});
```

## Utilitaires partagés

| Fonction | Rôle |
| --- | --- |
| `timeAgo(date)` | « il y a 3 min », « il y a 2 j » |
| `makeAvatar(pseudo)` | URL d'avatar cohérente (`ui-avatars.com`) |
| `escapeHtml(texte)` | Neutralise les balises dans les chaînes injectées |
