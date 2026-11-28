---
sidebar_position: 4
---

# Documentation technique — Back-end

Le back-end de **LifeInvader** repose sur **Node.js** et suit une **architecture hybride à deux microservices** placés derrière le reverse proxy Apache. Cette séparation permet d'isoler les opérations transactionnelles classiques (API REST, authentification, médias, modération) des flux bidirectionnels à faible latence (messagerie instantanée et événements temps réel).

---

## 1. Architecture des deux services Node.js

```
                         ┌───────────────────────────┐
                         │      APACHE 2.4 (443)     │
                         └─────────────┬─────────────┘
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 │                                           │
        HTTP (/api/auth, /users,                    HTTP & WS (/socket.io,
         /posts, /hashtags)                          /api/messages, /uploads)
                 │                                           │
┌────────────────▼────────────────┐         ┌────────────────▼────────────────┐
│     Backend-API (Port 3001)     │         │  Backend-messagerie (Port 3000) │
│  • Express 4 (ES Modules)       │         │  • Express 5 + Socket.io (CJS)  │
│  • Auth HMAC & Bcrypt           │         │  • Salons temps réel (Rooms)    │
│  • Gestion Médias & Posts       │         │  • Vocaux, médias & réactions   │
└────────────────┬────────────────┘         └────────────────┬────────────────┘
                 │                                           │
        ┌────────▼────────┐                         ┌────────▼────────┐
        │     MariaDB     │                         │     SQLite 3    │
        │  (PhotoVideo)   │                         │ (database_...db)│
        └─────────────────┘                         └─────────────────┘
```

| Caractéristique | `Backend-API` | `Backend-messagerie` |
|---|---|---|
| **Port d'écoute** | `3001` | `3000` |
| **Framework & Protocole** | Express `4.21` (HTTP REST) | Express `5.2` + Socket.io `4.8` (HTTP + WebSocket) |
| **Système de modules** | ES Modules (`"type": "module"`) | CommonJS (`"type": "commonjs"`) |
| **Base de données** | MariaDB (`PhotoVideo`) via `mysql2` | SQLite (`database_lifeinvader.db`) via `sqlite` / `sqlite3` |
| **Limite d'upload (Multer)** | `20 Mo` (images et vidéos de posts) | `200 Mo` (médias de chat, photos de groupe, vocaux) |
| **Exposition statique** | `/api/users/media/*` | `/uploads/*` |

---

## 2. Organisation modulaire du code

### Service `Backend-API/` (Port `3001`)

* **`server.js` :** Point d'entrée principal. Initialise Express, monte le dossier statique `uploads/`, configure les middlewares (`authRequired`, `authOptional`, `upload`) et déclare l'ensemble des routes REST (`/api/auth`, `/api/users`, `/api/posts`, `/api/hashtags`).
* **`config.js` :** Centralise les paramètres d'exécution (port `3001`, hôte/identifiants MariaDB, clé secrète HMAC `tokenSecret` et durée de validité des jetons `tokenTtlHours`).
* **`db.js` :** Gère la connexion à la base MariaDB `PhotoVideo` et expose l'interface `db.query()` pour l'exécution de requêtes SQL préparées.
* **`auth.js` :** Implémente le hachage des mots de passe avec `bcryptjs` ainsi que la génération et la vérification cryptographique des jetons d'authentification (`signToken`, `verifyToken`).
* **`upload-utils.js` :** Module de sécurité dédié au contrôle des fichiers entrants (liste blanche d'extensions et types MIME, renommage en UUID v4, protection contre la traversée de répertoires).

### Service `Backend-messagerie/` (Port `3000`)

* **`index.js` :** Crée le serveur HTTP couplé à l'instance `Socket.io`, expose les routes REST de gestion des conversations (`/api/dm`, `/api/groupe`, `/api/conversations`, `/api/messages`) et orchestre les événements WebSocket en temps réel.
* **`bdd.js` :** Encapsule tous les accès à SQLite (`getDb()`). Active systématiquement les contraintes d'intégrité référentielle (`PRAGMA foreign_keys = ON`), initialise les tables complémentaires (`Reaction_Message`, `Message_History`) et applique les règles métier sur les messages.
* **`upload-utils.js` :** Adaptation CommonJS du module de validation et de renommage UUID v4, étendue à la catégorie `audio` pour les messages vocaux.

---

## 3. Choix d'architecture et sécurité (BUT RT)

### Authentification sans état (*Stateless*) et contrôle d'accès

* **Hachage des mots de passe :** Les mots de passe ne sont jamais stockés en clair ; ils sont hachés et salés via `bcryptjs` lors de l'inscription (`POST /api/auth/register`).
* **Jetons signés HMAC (`auth.js`) :** À la connexion, le serveur délivre un jeton structuré sous la forme `userId.expiration.signature` (valide 24 heures par défaut). La vérification s'effectue sans état (*stateless*) par recalcul de la signature HMAC côté serveur, garantissant la persistance des sessions même en cas de redémarrage du processus Node.js.
* **Middlewares gradués :**
  * `authRequired` : Extrait l'en-tête `Authorization: Bearer <token>`, vérifie l'intégrité et l'expiration du jeton, et rejette immédiatement en `401 Non authentifié` si le jeton est absent ou altéré.
  * `authOptional` : Permet l'accès public en lecture (fil d'actualité, recherche) tout en identifiant l'utilisateur connecté s'il fournit un jeton valide afin d'enrichir la réponse (état `liked` / `disliked`).

### Sécurisation des uploads et protection anti-IDOR (`upload-utils.js`)

L'envoi de fichiers (photos, vidéos, vocaux) constitue un vecteur critique d'attaque. Trois barrières successives sont appliquées avant toute écriture sur disque :

1. **Renommage systématique par UUID v4 (`crypto.randomUUID()`) :** Le nom d'origine transmis par le client n'est jamais conservé. Chaque fichier est renommé avec un identifiant aléatoire non prédictible (ex. `f47ac10b-58cc-4372-a567-0e02b2c3d479.jpg`), empêchant l'écrasement de fichiers existants, l'injection de noms piégés (`shell.php`) et l'énumération séquentielle des médias (faille **IDOR**).
2. **Double filtrage en liste blanche (`extensionSure`) :** Le nom brut est d'abord isolé avec `path.basename()` pour neutraliser toute tentative de traversée de répertoire (`../../`). L'extension et le type MIME déclaré sont ensuite confrontés à des listes blanches strictes par catégorie (`image`, `video`, `audio`). Tout fichier exécutable ou non répertorié est rejeté.
3. **Validation en lecture (`nomDeFichierValide`) :** Contrôle l'absence de séquences `..`, `/` ou `\` lors de la restitution d'un média.

### Intégrité des données et prévention des injections SQL

* **Requêtes préparées systématiques :** L'ensemble des requêtes SQL sur MariaDB (`db.query('... WHERE id = ?', [id])`) et SQLite (`database.get` / `database.run`) utilise exclusivement des paramètres liés, neutralisant les injections SQL.
* **Intégrité référentielle SQLite :** `bdd.js` exécute `PRAGMA foreign_keys = ON;` dès l'ouverture de la connexion et nettoie les dépendances (`Message_History`, `Reaction_Message`) avant la suppression d'un message.
* **Synchronisation des compteurs et *Soft-Delete* :** Les interactions (`Like_Publication`, `Repartager`) utilisent des clés composites et `INSERT IGNORE` pour éviter les doublons, tandis que les requêtes de lecture filtrent nativement les contenus masqués ou supprimés logiquement (`WHERE p.est_supprimer = 0 AND p.est_cacher = 0`).

### Sécurité et règles métier de la messagerie temps réel

* **Isolation par salons (`Rooms`) :** Chaque discussion est cloisonnée dans un canal Socket.io dédié (`group_${idGroupe}`). Les messages, indicateurs de frappe (`typing`) et réactions ne sont diffusés qu'aux membres connectés à ce salon.
* **Contrôle d'appartenance et d'auteur :** Avant toute modification ou suppression d'un message (`modifierMessage`, `supprimerMessage`), le serveur vérifie que l'utilisateur demandeur est bien l'expéditeur d'origine (`msg.id_expediteur === user.id_utilisateur`).
* **Fenêtre d'édition de 10 minutes et audit :** Un message ne peut être modifié que dans les **10 minutes** suivant son envoi. Toute modification validée sauvegarde automatiquement l'ancienne version dans la table `Message_History` (les 3 dernières révisions sont consultables via `/api/message-history/:idMessage`).

---

## 4. Flux de traitement d'une requête

### Publication d'un média avec hashtags (`POST /api/posts`)

1. Le middleware `authRequired` valide le jeton `Bearer` et injecte `req.userId`.
2. `multer` intercepte le flux `multipart/form-data`, vérifie le type MIME (`image/*` ou `video/*`), valide l'extension via `extensionSure()` et écrit le fichier sous un nom UUID v4 dans `Backend-API/uploads/`.
3. Le serveur insère l'enregistrement dans la table MariaDB `Publication` avec le nom du fichier généré.
4. La fonction `linkHashtags()` extrait les mots-dièses (`#...`) de la légende par expression régulière, les insère dans `Hashtag` s'ils sont nouveaux, et crée les associations dans `Contient_Tag`.
5. L'API retourne la publication formatée (`HTTP 201`) avec son URL d'accès `/api/users/media/<uuid>`.
