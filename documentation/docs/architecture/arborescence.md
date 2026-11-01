---
sidebar_position: 3
title: Arborescence du projet
---

# Arborescence du front-end

```
frontend/
├── index.html                 # unique page HTML (coquille SPA)
├── instaclone.conf            # VirtualHost Apache (à copier dans sites-available)
├── css/
│   └── style.css              # feuille unique, thème clair/sombre par variables
├── assets/
│   └── images/posts/          # images de démonstration
└── js/
    ├── router.js              # routeur hash, table des routes
    ├── api.js                 # client HTTP de l'API MariaDB (+ repli mock)
    ├── mock-data.js           # jeu de données de démonstration
    ├── menu.js                # en-tête, thème, session, menu mobile
    ├── feed.js                # fil d'actualité (module + vue)
    ├── post-modal.js          # modale de détail d'une publication
    ├── toast.js               # notifications éphémères
    ├── notification.js        # centre de notifications + socket partagé
    ├── image-helper.js        # avatars et images de repli
    ├── media-fallback.js      # remplacement des images cassées
    └── views/
        ├── login.js           # connexion / inscription
        ├── profile.js         # profil (soi-même ou autre utilisateur)
        ├── edit-profile.js    # édition du profil
        ├── explore.js         # tendances, hashtags, recherche par tag
        ├── search.js          # recherche utilisateurs et publications
        ├── publish.js         # création de publication (multipart)
        ├── messages.js        # messagerie temps réel (≈ 2 000 lignes)
        ├── settings.js        # paramètres, confidentialité, compte privé
        ├── saved.js           # publications enregistrées
        ├── notif.js           # centre de notifications (vue)
        └── friends.js         # amis, abonnements, suggestions
```

## Rôle de chaque module transverse

| Fichier | Responsabilité | Dépend de |
| --- | --- | --- |
| `router.js` | Navigation, montage des vues | toutes les vues |
| `api.js` | Toutes les requêtes `/api` (posts, users, hashtags) | `mock-data.js` |
| `menu.js` | En-tête, thème, session, badge, menu mobile | `notification.js` |
| `notification.js` | Socket partagé, centre de notifications | `api.js` |
| `post-modal.js` | Modale de publication, likes, commentaires | `api.js`, `toast.js` |
| `toast.js` | Messages éphémères (succès, erreur) | — |
| `image-helper.js` | URL d'avatar cohérente, image de repli | — |
| `media-fallback.js` | Remplace une image cassée par un visuel neutre | — |
| `mock-data.js` | Données de démonstration | — |
| `feed.js` | Fil d'actualité | `api.js`, `post-modal.js` |

## Règles d'organisation

- **Une vue = un fichier** dans `js/views/`, sauf le fil qui vit à la racine.
- **Aucun CSS dans le JS** : tout est dans `style.css`, organisé en sections
  commentées (`/* --- Messagerie --- */`).
- **Aucune dépendance externe** hors Socket.io et les avatars
  (`ui-avatars.com`) : pas de CDN de framework.
- Les images de démonstration vivent dans `assets/images/posts/`.

## Ordre de chargement

`index.html` charge les modules avec `<script type="module" src="js/menu.js">`
pour l'initialisation, puis `router.js` démarre après `DOMContentLoaded`.
Socket.io est chargé depuis `/socket.io/socket.io.js`, servi par le serveur de
messagerie à travers le proxy : si ce serveur est éteint, le script ne charge
pas et le mode mock s'active.
