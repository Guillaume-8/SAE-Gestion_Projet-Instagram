---
sidebar_position: 2
title: Les vues
---

# Les vues

Onze vues composent l'application, plus le fil d'actualité. Chacune respecte le
contrat `render()` / `mount()` décrit dans
[Architecture → Routeur SPA](../architecture/spa-router.md).

## Fil d'actualité — `js/feed.js`

Route : `#/` et `#/feed`.

- Charge `getPosts()`, affiche les cartes de publication.
- Délègue les interactions à `post-modal.js` (like, dislike, commentaires,
  signalement, repartage).
- Filtre par hashtag quand `#/explore` navigue avec un tag.
- Images en chargement différé (`loading="lazy"`).

## Connexion — `js/views/login.js`

Route : `#/login` (`hideHeader: true`).

- Deux onglets : connexion et inscription.
- Appelle `login()` ou `register()` puis écrit `instaclone_user` en
  `localStorage` et redirige vers `#/feed`.
- Affiche les erreurs de l'API sans recharger la page.

## Profil — `js/views/profile.js`

Route : `#/profile` et `#/profile?user=pseudo`.

- Sans paramètre : profil de l'utilisateur connecté (`getMe()`).
- Avec `?user=` : profil public d'un autre compte (`getUserProfile()`).
- Affiche grille de publications, compteurs (publications, abonnés,
  abonnements), bouton d'abonnement, bouton 🔖 d'enregistrement.
- Respecte le compte privé : un profil privé n'expose que le résumé.

## Édition du profil — `js/views/edit-profile.js`

Route : `#/edit-profile`.

- Formulaire (nom, bio, lien, avatar) pré-rempli par `getMe()`.
- Enregistrement via `updateMe()`, puis retour au profil.

## Exploration — `js/views/explore.js`

Route : `#/explore`.

- Grille de publications tendance (`getTrending()`).
- Nuage de hashtags avec compteurs (`getHashtags()`).
- Filtre côté client sur `post.hashtags` quand un tag est sélectionné.

## Recherche — `js/views/search.js`

Route : `#/search`.

- Barre de recherche, résultats séparés en comptes et publications.
- Appels `searchPosts()` et filtrage local de `getUsers()`.
- Navigation directe vers `#/profile?user=` au clic sur un compte.

## Publication — `js/views/publish.js`

Route : `#/publish`.

- Aperçu local de l'image choisie (avant envoi).
- Formulaire légende + hashtags.
- Envoi multipart via `createPost()`, barre de progression, redirection vers
  le fil à la fin.

## Messagerie — `js/views/messages.js`

Route : `#/messages`. Vue la plus riche : voir la page dédiée
[Messagerie temps réel](./messagerie.md).

## Paramètres — `js/views/settings.js`

Route : `#/settings`.

- Sections : compte, confidentialité, notifications, partage, FAQ, contact,
  statut du compte.
- Bascule compte privé (`instaclone_privacy_settings`).
- Préférences de notifications (`instaclone_notification_settings`).
- Changement de thème (délègue à `menu.js`).

## Enregistrés — `js/views/saved.js`

Route : `#/saved`.

- Publications mises de côté via le bouton 🔖.
- Grille avec suppression d'un élément.

## Notifications — `js/views/notif.js`

Route : `#/notif`.

- Liste des notifications (likes, commentaires, abonnements).
- Marque comme lues et met à zéro le badge de la cloche
  (`notification.js`).

## Amis — `js/views/friends.js`

Route : `#/friends`.

- Abonnements, abonnés, suggestions.
- Ajout et retrait (liste des retirés dans
  `instaclone_removed_friends`).

## Tableau récapitulatif

| Vue | Fichier | Lignes (ordre de grandeur) | Dépendances principales |
| --- | --- | --- | --- |
| Fil | `feed.js` | 400 | `api.js`, `post-modal.js` |
| Connexion | `views/login.js` | 250 | `api.js` |
| Profil | `views/profile.js` | 350 | `api.js` |
| Édition profil | `views/edit-profile.js` | 200 | `api.js` |
| Exploration | `views/explore.js` | 250 | `api.js` |
| Recherche | `views/search.js` | 200 | `api.js` |
| Publication | `views/publish.js` | 250 | `api.js` |
| Messagerie | `views/messages.js` | 2000 | socket, `api.js` |
| Paramètres | `views/settings.js` | 1000 | `menu.js` |
| Enregistrés | `views/saved.js` | 150 | `api.js` |
| Notifications | `views/notif.js` | 200 | `notification.js` |
| Amis | `views/friends.js` | 200 | `api.js` |
