---
sidebar_position: 1
---

# Architecture globale

## Vue d'ensemble

LifeInvader suit une architecture en couches : Apache est le point d'entrée
unique, et **deux serveurs Node.js** tournent en parallèle, chacun avec sa base.

- `backend-api` (port **3001**) sert l'API REST et s'appuie sur **MariaDB**
  (base `PhotoVideo`).
- `backend-messagerie` (port **3000**) sert la messagerie temps réel et
  s'appuie sur **SQLite** (`database_lifeinvader.db`).

```
                    ┌───────────────────────────────────────┐
                    │              NAVIGATEUR                │
                    │        (HTML / CSS / JS — SPA)         │
                    └───────────────────┬───────────────────┘
                                        │ HTTPS (443)
                    ┌───────────────────▼───────────────────┐
                    │              APACHE 2.4                │
                    │  ┌─────────────────────────────────┐   │
                    │  │ Statique : frontend/            │   │
                    │  └─────────────────────────────────┘   │
                    │  ┌─────────────────────────────────┐   │
                    │  │ Reverse proxy                   │   │
                    │  │ /api/auth|users|posts|hashtags  │   │
                    │  │        → 127.0.0.1:3001         │   │
                    │  │ /socket.io → 127.0.0.1:3000 (ws)│   │
                    │  │ /uploads   → 127.0.0.1:3000     │   │
                    │  │ /api/*     → 127.0.0.1:3000     │   │
                    │  └─────────────────────────────────┘   │
                    └────────────┬───────────────┬───────────┘
                                 │ HTTP 3001     │ HTTP/WS 3000
              ┌──────────────────▼──────┐   ┌────▼─────────────────────┐
              │  backend-api            │   │  backend-messagerie      │
              │  Express (21 routes)    │   │  Express + Socket.io     │
              │  JWT, bcrypt, multer    │   │  multer, uploads/        │
              └──────────────┬──────────┘   └────────────┬─────────────┘
                             │ TCP 3306                    │ fichier
              ┌──────────────▼──────────┐   ┌─────────────▼────────────┐
              │  MariaDB                │   │  SQLite                  │
              │  PhotoVideo             │   │  database_lifeinvader.db │
              └─────────────────────────┘   └──────────────────────────┘
```

## Composants

### Front-end (Apache)

Fichiers statiques (HTML, CSS, JavaScript) servis par Apache, sans framework :
modules ES6 natifs et routeur SPA par hash. Le client n'accède jamais
directement aux Node.

**Responsable** : Eren (Responsable Front-End)

### Apache — Reverse Proxy

Trois rôles : serveur statique, proxy de l'API (3001), proxy de la messagerie
(3000, avec passage WebSocket). Les détails et le fichier de configuration
complet sont dans [Configuration Apache](./apache-config.md).

**Responsables** : Eren (configuration), Guillaume (certificats SSL)

### `backend-api` — API REST (port 3001)

Express + `mysql2`, authentification par jeton JWT, mots de passe hachés en
bcrypt, uploads via multer (noms de fichiers générés en UUID).

**Responsable** : Mathias (Responsable Back-End)

### `backend-messagerie` — Messagerie temps réel (port 3000)

Express + Socket.io. Gère les conversations, les messages, les réactions,
l'historique des modifications, les médias et les messages vocaux.

**Responsables** : Yanis, Enes

### Bases de données

Deux bases, chacune propriétaire de ses données :

| Base | Technologie | Contenu | Responsables |
| --- | --- | --- | --- |
| `PhotoVideo` | **MariaDB** | `Utilisateur`, `Publication`, `Commentaire`, `Like_Publication`, `Like_Commentaire`, `Signalement`, `Repartager`, `Hashtag`, `Contient_Tag`, `Ami`, `Notification`, `Bannissement` | Thomas, Pierre, Mathias |
| `database_lifeinvader.db` | **SQLite** | `Utilisateur` (pseudonymes), `Groupe`, `Appartient_Groupe`, `Message`, `Recevoir_Msg`, `Reaction_Message`, `Message_History` | Yanis, Enes |

:::info Pourquoi deux bases ?
Le projet est mené par deux binômes qui ont démarré en parallèle : l'API et le
schéma relationnel d'un côté (MariaDB), la messagerie et son schéma SQLite de
l'autre. Chaque serveur reste propriétaire de ses tables, ce qui évite les
migrations croisées et permet de faire évoluer la messagerie sans toucher au
reste du site.

Le seul point de recouvrement est le **pseudonyme** : la messagerie stocke le
sien dans sa table `Utilisateur` (créé à la volée à la première connexion), sans
clé étrangère vers MariaDB.
:::

## Flux d'une requête

### Fil d'actualité

1. L'utilisateur ouvre `#/feed` : le routeur SPA appelle `render()` puis
   `mount()`.
2. `mount()` appelle `getFeedPosts()` (`frontend/js/api.js`).
3. `isRealApiAvailable()` interroge `GET /api/auth/ping` pour savoir si l'API
   répond.
4. Si elle répond : `fetch('/api/posts')` → Apache → `backend-api:3001` →
   MariaDB → JSON.
5. Sinon : repli sur `mock-data.js`, avec un avertissement en console.
6. Le JavaScript injecte les publications dans le DOM.

### Message instantané

1. L'utilisateur ouvre `#/messages` : la vue se connecte au socket partagé
   (`window.socket`) et rejoint la room `group_<id>`.
2. À l'envoi : `socket.emit('send_message', …)` → Apache (passage WebSocket) →
   `backend-messagerie:3000`.
3. Le serveur enregistre le message dans SQLite puis rediffuse
   `receive_message` à la room.
4. Tous les clients de la conversation (y compris l'expéditeur) affichent la
   bulle reçue : l'affichage reflète toujours ce qui est réellement enregistré.

## Séparation des responsabilités

| Couche | Technologie | Responsable |
| --- | --- | --- |
| Interface utilisateur | HTML / CSS / JS vanilla | Eren |
| Serveur web et reverse proxy | Apache 2.4 | Eren, Guillaume |
| Certificats SSL | OpenSSL (CA locale + SAN) | Guillaume |
| API REST | Node.js / Express | Mathias |
| Base relationnelle | MariaDB `PhotoVideo` | Thomas, Pierre, Mathias |
| Messagerie temps réel | Node.js / Socket.io | Yanis, Enes |
| Base de la messagerie | SQLite | Yanis, Enes |
| Tests | Scripts Node + parcours navigateur | Enes |
| Filtres / retouche photo | Canvas API | Tanguy, Jonathan |
| Interface admin | HTML / CSS / JS | Mathéo |

## Évolutions possibles

**Unifier les bases ?** Cela supposerait de migrer la messagerie vers MariaDB
(tables `Groupe`, `Message`, `Reaction_Message`, `Message_History`), de réécrire
`bdd.js`, et de fusionner les deux tables `Utilisateur` avec une vraie clé
étrangère. Le gain serait une cohérence de modèle et un comptage fiable des
messages par utilisateur ; le coût est une reprise complète du travail de la
messagerie en fin de projet. À ce stade, l'architecture hybride est assumée et
documentée.

**Conteneurisation.** Un `docker-compose.yml` (MariaDB + les deux Node +
Apache) est envisagé pour rendre l'installation reproductible ; ce n'est pas
nécessaire au fonctionnement actuel.

**Documentation du code.** Un script `npm run docs:code` (TypeDoc) existe à la
racine du dépôt pour générer une référence à partir des blocs JSDoc.
