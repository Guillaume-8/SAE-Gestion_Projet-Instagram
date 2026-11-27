# LifeInvader — SAÉ 5.02

Clone d'Instagram réalisé dans le cadre de la SAÉ 5.02 du BUT Réseaux &
Télécommunications (3ᵉ année). Le projet est découpé en plusieurs branches :
celle-ci (`Web_Apache`) porte le **front-end** et les deux backends qui
l'alimentent.

- Application : SPA en JavaScript natif (modules ES6), servie par Apache
- API publications : Node.js + Express + **MariaDB** (base `PhotoVideo`), port 3001
- Messagerie temps réel : Node.js + Express + **Socket.io** + SQLite, port 3000
- Documentation : branche `docs` (site Docusaurus)

---

## Sommaire

1. [Architecture](#architecture)
2. [Prérequis](#prérequis)
3. [Installation](#installation)
4. [Lancement](#lancement)
5. [Configuration](#configuration)
6. [Fonctionnalités](#fonctionnalités)
7. [Structure du dépôt](#structure-du-dépôt)
8. [Vérifications](#vérifications)
9. [Dépannage](#dépannage)
10. [Équipe](#équipe)

---

## Architecture

```
Navigateur (SPA)
   │  HTTPS — une seule origine
   ▼
Apache 2.4 (:443)
   ├── /*.html, /css, /js, /assets      → fichiers statiques (frontend/)
   ├── /api/auth  /api/users
   │   /api/posts /api/hashtags         → 127.0.0.1:3001 (backend-api, MariaDB)
   ├── /socket.io/*                     → 127.0.0.1:3000 (WebSocket)
   ├── /uploads/*                       → 127.0.0.1:3000 (médias de la messagerie)
   └── /api/* (le reste)                → 127.0.0.1:3000 (backend-messagerie)
```

Apache agrège les deux backends : le navigateur ne connaît qu'une origine, ce
qui évite le CORS, le contenu mixte et la duplication des cookies.

> L'ordre des règles `ProxyPass` compte : les quatre routes `/api/auth`,
> `/api/users`, `/api/posts` et `/api/hashtags` doivent être déclarées **avant**
> la règle générale `/api`.

---

## Prérequis

| Outil | Version | Rôle |
| --- | --- | --- |
| Node.js | 20 LTS ou 22 | Les deux serveurs backend |
| npm | 10+ | Installation des dépendances |
| Apache HTTP Server | 2.4 | Statiques + reverse proxy |
| MariaDB | 10.11+ | Base `PhotoVideo` |
| SQLite | fourni avec Node | Base de la messagerie |

Sous WSL, `systemctl` n'existe pas : utiliser `sudo service <nom> start`.

Modules Apache nécessaires :

```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite ssl headers
sudo service apache2 restart
```

---

## Installation

### 1. Base de données MariaDB

```bash
sudo service mariadb start
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS PhotoVideo CHARACTER SET utf8mb4;"
mysql -u root -p PhotoVideo < database/photovideo-dump.sql
```

Le dump contient cinq comptes de test (mots de passe distribués séparément,
jamais dans le dépôt) et six publications avec leurs médias.

Si la base est déjà importée, appliquer la migration du profil :

```bash
mysql -u root -p PhotoVideo < database/migration-genre-visibilite.sql
```

> Le serveur applique aussi ces colonnes tout seul au démarrage
> (`ensureSchema`), le script n'est là que pour une migration manuelle.

### 2. API publications

```bash
cd backend-api
npm install
node server.js          # http://localhost:3001
```

### 3. Messagerie temps réel

```bash
cd backend-messagerie
npm install
node index.js           # http://localhost:3000
```

### 4. Apache

```bash
sudo cp frontend/instaclone.conf /etc/apache2/sites-available/
sudo a2ensite instaclone
sudo apache2ctl configtest     # doit afficher « Syntax OK »
sudo service apache2 restart
```

Adapter `DocumentRoot` et la directive `<Directory>` si le projet n'est pas
dans `/home/<utilisateur>/sae502-instagram/frontend`.

Les certificats SSL sont attendus dans `/etc/ssl/certs/` et
`/etc/ssl/private/` (voir `frontend/instaclone.conf`) ; ils ne sont **pas**
versionnés.

---

## Lancement

Trois services doivent tourner en même temps :

| Service | Commande | Port |
| --- | --- | --- |
| MariaDB | `sudo service mariadb start` | 3306 |
| API publications | `cd backend-api && node server.js` | 3001 |
| Messagerie | `cd backend-messagerie && node index.js` | 3000 |
| Apache | `sudo service apache2 restart` | 443 |

Ouvrir **https://localhost** (accepter le certificat local), puis se connecter.
Après chaque mise à jour de fichiers : **Ctrl + Shift + R**.

---

## Configuration

| Fichier | Contenu |
| --- | --- |
| `backend-api/config.js` | Port, identifiants MariaDB, secret des jetons |
| `frontend/instaclone.conf` | VirtualHost Apache et règles de proxy |
| `frontend/js/api.js` | `API_BASE_URL`, repli mock |
| `backend-messagerie/index.js` | Port 3000, limites d'upload (200 Mo) |

Les identifiants de démonstration du dépôt sont locaux : ne pas les réutiliser
en production, et préférer un utilisateur MariaDB dédié plutôt que `root`.

---

## Fonctionnalités

**Comptes et profils** — inscription, connexion (jeton), profil public
(`#/profile?user=pseudo`), édition, genre et visibilité du genre, compte privé.

**Publications** — fil d'actualité, tendances, recherche, publication avec
photo ou vidéo (upload multipart + progression), like, dislike, commentaires,
repartage (une fois par utilisateur), signalement avec motifs, hashtags.

**Social** — abonnements, amis (demandes acceptées, compteur), suggestions,
notifications (cloche, badge, toasts, temps réel).

**Messagerie** — conversations privées et groupes, messages texte, réponses
citées, réactions, édition et suppression avec historique, photos, vidéos,
messages vocaux, GIF, indicateur de saisie, détails et photo de groupe,
notifications sonores et navigateur.

**Interface** — thème clair/sombre, responsive (menu hamburger), lightbox,
skeletons de chargement, repli automatique sur des données de démonstration
quand l'API est indisponible.

---

## Structure du dépôt

```
.
├── frontend/
│   ├── index.html              # coquille SPA
│   ├── instaclone.conf         # VirtualHost Apache
│   ├── css/style.css           # styles + thèmes
│   ├── assets/images/posts/    # images de démonstration (mock)
│   └── js/
│       ├── router.js           # routeur par hash
│       ├── api.js              # client API + repli mock
│       ├── feed.js             # fil d'actualité
│       ├── post-modal.js       # détail d'une publication
│       ├── report-dialog.js    # menu de signalement partagé
│       ├── friends-list.js     # rendu partagé d'une liste d'amis
│       ├── notification.js     # socket partagé + notifications
│       ├── media-fallback.js   # repli des médias introuvables
│       ├── toast.js · menu.js · image-helper.js · mock-data.js
│       └── views/              # 12 vues (login, profile, messages, …)
├── backend-api/
│   ├── server.js               # API REST (21 routes)
│   ├── upload-utils.js         # nommage sûr des fichiers (UUID + extension)
│   ├── auth.js · db.js · config.js
│   └── uploads/                # médias des publications
├── backend-messagerie/
│   ├── index.js                # API + Socket.io
│   ├── bdd.js                  # accès SQLite
│   ├── upload-utils.js
│   └── uploads/                # médias de la messagerie (non versionnés)
└── database/
    ├── photovideo-dump.sql
    ├── migration-genre-visibilite.sql
    └── GUIDE.txt
```

---

## Vérifications

```bash
# API publications : doit renvoyer du JSON, pas du HTML
curl -s https://localhost/api/users | head -c 200

# Messagerie : liste des pseudonymes
curl -s https://localhost/api/utilisateurs

# Un média de publication
curl -sI https://localhost/api/users/media/lifeinvader_post1.jpg

# Un média de messagerie
curl -sI https://localhost/uploads/<fichier>
```

Contrôles côté code :

```bash
# Syntaxe de chaque module (ESM)
for f in frontend/js/*.js frontend/js/views/*.js; do
  node --input-type=module --check < "$f" || echo "ERREUR: $f"
done
```

Un test navigateur rapide : ouvrir `#/feed`, `#/profile`, `#/friends`,
`#/messages` et vérifier qu'aucune erreur n'apparaît dans la console (F12).

---

## Dépannage

| Symptôme | Cause | Solution |
| --- | --- | --- |
| `ECONNREFUSED 127.0.0.1:3306` au démarrage de l'API | MariaDB n'est pas démarré | `sudo service mariadb start` |
| `Access denied for user 'root'@'localhost'` | `mysqladmin` lancé sans mot de passe | `mysqladmin -u root -p ping` |
| `Cannot GET /` sur `:3001` | L'API n'a pas de route racine | Normal : passer par Apache (`https://localhost`) |
| Images absentes du fil et du profil | Fichiers absents de `backend-api/uploads/` | Vérifier les noms du dump, recharger avec Ctrl+Shift+R |
| « Média indisponible » dans le fil | Même cause, repli visuel | Idem |
| Médias de messagerie en 404 | Règle `ProxyPass /uploads` absente | Ajouter la règle, `apache2ctl configtest`, redémarrer |
| Conversations fictives dans la messagerie | Serveur 3000 arrêté (mode mock) | Lancer `node index.js`, bannière orange sinon |
| `Permission denied` sur `node_modules` | Installation interrompue | `rm -rf node_modules && npm install` |
| Modifications invisibles | Cache navigateur | Ctrl + Shift + R |

---

## Équipe

Yanis (chef de projet), Thomas (Scrum master), Guillaume (product owner),
Eren (responsable front-end), Mathias (responsable back-end), Enes
(responsable tests), Mathéo, Tanguy, Jonathan, Pierre.

---

## Licence

Projet pédagogique — BUT Réseaux & Télécommunications, SAÉ 5.02.
