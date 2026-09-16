---
sidebar_position: 1
---

# Architecture globale

## Vue d'ensemble

InstaClone suit une architecture en couches où Apache agit comme point d'entrée unique. Le client n'accède jamais directement au back-end Node.js — tout transite par Apache, qui sert les fichiers statiques du front-end et agit comme reverse proxy pour les requêtes API et WebSocket.

```
                    ┌──────────────────────────────────┐
                    │           NAVIGATEUR              │
                    │   (HTML / CSS / JS - SPA)         │
                    └──────────────┬───────────────────┘
                                   │
                          HTTPS (port 443)
                                   │
                    ┌──────────────▼───────────────────┐
                    │         APACHE 2.4                │
                    │  ┌────────────────────────────┐   │
                    │  │ Fichiers statiques (front) │   │
                    │  │ /home/.../frontend/        │   │
                    │  └────────────┬───────────────┘   │
                    │               │                   │
                    │  ┌────────────▼───────────────┐   │
                    │  │  Reverse Proxy              │   │
                    │  │  /api      → :3000/api     │   │
                    │  │  /socket.io → :3000/socket  │   │
                    │  └────────────┬───────────────┘   │
                    └──────────────┼───────────────────┘
                                   │
                          HTTP (port 3000)
                                   │
                    ┌──────────────▼───────────────────┐
                    │        NODE.JS BACK-END           │
                    │  ┌──────────┐  ┌──────────────┐  │
                    │  │ API REST │  │  WebSocket    │  │
                    │  │ (Express)│  │ (Socket.io)   │  │
                    │  └────┬─────┘  └──────┬───────┘  │
                    │       │               │          │
                    │  ┌────▼───────────────▼───────┐  │
                    │  │      SQLITE (fichier)       │  │
                    │  │  db_utilisateurs.db         │  │
                    │  │  db_photos_videos.db        │  │
                    │  └────────────────────────────┘  │
                    └──────────────────────────────────┘
```

## Composants

### Front-end (Apache)

Le front-end est constitué de fichiers statiques (HTML, CSS, JavaScript) servis directement par Apache. Aucun framework n'est utilisé — le JavaScript utilise les modules ES6 natifs. Un routeur SPA basé sur le hash de l'URL gère la navigation entre les vues sans rechargement de page.

**Responsable** : Eren (Responsable Front-End)

### Apache — Reverse Proxy

Apache sert deux rôles :

1. **Serveur web statique** : délivre les fichiers du dossier `frontend/` au client
2. **Reverse proxy** : redirige les requêtes `/api/*` vers le back-end Node.js sur le port 3000, et les connexions WebSocket `/socket.io/*` vers le même port

**Responsables** : Eren (configuration), Guillaume (certificats SSL)

### Back-end (Node.js)

Le back-end expose une API REST avec Express.js et gère la messagerie temps réel avec Socket.io. Il se connecte aux bases de données SQLite.

**Responsable** : Mathias (Responsable Back-End)

### Bases de données (SQLite)

Deux bases SQLite séparées :

| Base | Contenu | Responsables |
|---|---|---|
| `db_utilisateurs.db` | Profils, authentification, amitiés | Thomas |
| `db_photos_videos.db` | Publications, médias, signalements | Pierre, Mathias |

### Messagerie temps réel

La messagerie instantanée utilise Socket.io (WebSockets) via le reverse proxy Apache. Les messages sont échangés en temps réel entre les clients connectés.

**Responsables** : Yanis, Enes

### Docker

L'application complète est conteneurisée avec Docker pour un déploiement reproductible. Le Dockerfile et le `docker-compose.yml` permettent de lancer tous les composants en une seule commande.

## Flux d'une requête type

1. L'utilisateur clique sur "Fil d'actualité" dans la navigation
2. Le routeur SPA intercepte le hash `#/feed` et appelle `render()` puis `mount()`
3. `mount()` appelle `getFeedPosts()` dans `api.js`
4. Si `USE_MOCK = true` : retourne les données fictives de `mock-data.js`
5. Si `USE_MOCK = false` : `fetch('/api/posts')` → Apache reverse proxy → Node.js → SQLite → réponse JSON
6. Le JavaScript injecte les publications dans le DOM

## Séparation des responsabilités

| Couche | Technologie | Responsable |
|---|---|---|
| Interface utilisateur | HTML / CSS / JS vanilla | Eren |
| Serveur web | Apache 2.4 | Eren, Guillaume |
| Certificats SSL | OpenSSL | Guillaume |
| API REST | Node.js / Express | Mathias |
| Base de données | SQLite | Thomas, Pierre, Mathias |
| Messagerie temps réel | Socket.io | Yanis, Enes |
| Tests unitaires | TestRunner (à définir) | Enes |
| Filtres / retouche photo | Canvas API | Tanguy, Jonathan |
| Interface admin | HTML / CSS / JS | Mathéo |
