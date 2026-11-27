---
sidebar_position: 3
---

# Installation du back-end

Le back-end de **LifeInvader** repose sur **Node.js** et adopte une architecture hybride composée de **deux services indépendants** placés derrière le reverse proxy Apache (branche de référence : `web-apache`) :

1. **`Backend-messagerie` (Port `3000`)** : Serveur temps réel (**Express 5** + **Socket.io**, CommonJS) connecté à **SQLite** pour les conversations, groupes, réactions et messages vocaux.
2. **`Backend-API` (Port `3001`)** : API REST (**Express 4**, ES Modules) connectée à **MariaDB** (`PhotoVideo`) pour l'authentification, les profils utilisateurs, les publications, les commentaires, les hashtags et les signalements.

---

## 1. Installation de Node.js et des dépendances (`npm install`)

### Installation de Node.js 22 LTS (WSL / Linux)

Installez **Node.js 22** via `nvm` afin d'assurer la prise en charge native des modules ES6 (`"type": "module"`) utilisés par `Backend-API` :

```bash
curl -o- [https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh](https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh) | bash
source ~/.bashrc
nvm install 22
node -v # Doit afficher v22.x.x
```

### Installation des dépendances des deux services

Depuis la racine du dépôt, installez les paquets Node.js dans chacun des deux dossiers back-end :

```bash
# 1. Service Messagerie (express, socket.io, sqlite, sqlite3, multer)
cd ~/sae502-instagram/Backend-messagerie
npm install

# 2. Service API REST (express, mysql2, bcryptjs, multer)
cd ~/sae502-instagram/Backend-API
npm install
```

:::info Répertoires d'uploads
Au premier démarrage, chacun des deux serveurs crée automatiquement son dossier local `uploads/` (avec renommage sécurisé des fichiers en **UUID v4** et contrôle strict des extensions/types MIME).
:::

---

## 2. Configuration des ports (`3000` et `3001`)

Apache reçoit l'ensemble des requêtes clientes (HTTP `80` / HTTPS `443`) et les redirige en local vers les deux ports Node.js :

| Service | Dossier | Port | Base de données | Routes proxifiées par Apache |
|---|---|---|---|---|
| **Messagerie & WebSockets** | `Backend-messagerie/` | **`3000`** | SQLite | `/socket.io/*`, `/api/messages/*`, `/api/conversations/*`, `/uploads/*` |
| **API REST Principale** | `Backend-API/` | **`3001`** | MariaDB (`PhotoVideo`) | `/api/auth/*`, `/api/users/*`, `/api/posts/*`, `/api/hashtags` |

* **Port `3000` (`Backend-messagerie`) :** Configuré directement à la fin de `Backend-messagerie/index.js` (`server.listen(3000)`).
* **Port `3001` (`Backend-API`) :** Défini par la propriété `port` dans `Backend-API/config.js` (`config.port`).

---

## 3. Variables d'environnement et configuration

Les paramètres de connexion et de sécurité sont centralisés dans les fichiers de configuration de chaque service (aucun paquet `dotenv` externe n'est requis).

### Configuration de `Backend-API` (`Backend-API/config.js`)

Adaptez les identifiants MariaDB et le secret de signature des jetons HMAC dans `Backend-API/config.js` avant de démarrer le serveur :

```javascript
export default {
  /** Port d'écoute (3001 : la messagerie occupe déjà le 3000). */
  port: 3001,

  /** Connexion MariaDB (base PhotoVideo). */
  db: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'votre_mot_de_passe_mariadb',
    database: 'PhotoVideo',
  },

  /** Secret de signature des jetons HMAC (à personnaliser). */
  tokenSecret: 'sae502-LifeInvader-secret-a-changer',

  /** Durée de validité d'un jeton en heures. */
  tokenTtlHours: 24,
};
```

:::warning Sécurité des identifiants
Ne poussez jamais vos vrais mots de passe MariaDB ni votre clé `tokenSecret` de production sur GitHub. En environnement de production sous Node.js 22, ces valeurs peuvent également être externalisées dans un fichier `.env` ignoré par Git et chargé via `node --env-file=.env server.js`.
:::

### Configuration SQLite de `Backend-messagerie` (`Backend-messagerie/bdd.js`)

Le module `bdd.js` ouvre le fichier SQLite `./database_lifeinvader.db` à la racine du dossier `Backend-messagerie/` :

```javascript
db = await open({
  filename: './database_lifeinvader.db',
  driver: sqlite3.Database
});
```

À chaque démarrage, le serveur exécute automatiquement `PRAGMA foreign_keys = ON;` et crée les tables complémentaires `Reaction_Message` et `Message_History` si elles n'existent pas encore. Assurez-vous que les tables principales (`Utilisateur`, `Groupe`, `Message`, `Appartient_Groupe`) sont bien initialisées dans `database_lifeinvader.db`.

---

## 4. Lancement des serveurs (`npm start`)

Les deux services doivent fonctionner simultanément en arrière-plan (dans deux terminaux WSL distincts, ou via `tmux` / `pm2`).

### 1. Lancer `Backend-messagerie` (Port `3000`)

```bash
cd ~/sae502-instagram/Backend-messagerie
node index.js
# Sortie attendue :
# Serveur démarré sur http://localhost:3000
```

:::tip Commande `npm start`
Le `package.json` de `Backend-messagerie` ne contient pas encore d'entrée `"start"` par défaut. Vous pouvez ajouter `"start": "node index.js"` dans la section `"scripts"` pour uniformiser le démarrage avec `npm start`.
:::

### 2. Lancer `Backend-API` (Port `3001`)

```bash
cd ~/sae502-instagram/Backend-API
npm start
# Sortie attendue :
# API LifeInvader démarrée sur http://localhost:3001
# Base : PhotoVideo @ localhost:3306
```

### 3. Vérification du bon fonctionnement

Avant d'activer le reverse proxy Apache, vérifiez en local que les deux serveurs répondent :

```bash
# Test de Backend-messagerie (port 3000)
curl [http://127.0.0.1:3000/](http://127.0.0.1:3000/)
# {"status":"ok","message":"API Messagerie SAE502 en cours d execution"}

# Test de Backend-API (port 3001)
curl [http://127.0.0.1:3001/api/auth/ping](http://127.0.0.1:3001/api/auth/ping)
# {"status":"ok","service":"instaclone-api","database":"PhotoVideo"}
```