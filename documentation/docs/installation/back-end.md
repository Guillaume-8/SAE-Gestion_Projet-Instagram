---
sidebar_position: 3
---

# Installation du back-end

Le projet comporte **deux serveurs Node.js** indépendants. Les deux se lancent
avec `node`, sans étape de build.

## 1. `backend-api` — API REST (port 3001)

Sert les utilisateurs, publications, commentaires, likes, signalements et
hashtags. S'appuie sur **MariaDB** (`PhotoVideo`).

```bash
cd backend-api
npm install
node server.js
```

Variables et réglages dans `backend-api/config.js` :

| Réglage | Valeur par défaut | Rôle |
| --- | --- | --- |
| `port` | `3001` | Port d'écoute |
| `db.host` | `localhost` | Hôte MariaDB |
| `db.port` | `3306` | Port MariaDB |
| `db.database` | `PhotoVideo` | Base utilisée |
| `db.user` / `db.password` | `root` / `root` | Identifiants (à adapter) |
| `tokenSecret` | chaîne locale | Signature des jetons JWT |

Le serveur applique au démarrage les colonnes manquantes
(`genre`, `afficher_genre`) — une base non migrée fonctionne quand même.

## 2. `backend-messagerie` — Messagerie temps réel (port 3000)

Sert les conversations, messages, réactions et médias. S'appuie sur **SQLite**
(`database_lifeinvader.db`, créée automatiquement si absente).

```bash
cd backend-messagerie
npm install
node index.js
```

Réglages : port `3000` (codé dans `index.js`), limite d'upload de 200 Mo,
dossier `uploads/` pour les médias.

:::warning `npm install` est obligatoire après une mise à jour
Le serveur a besoin de `multer` pour les médias. Sans `npm install`, il plante
au démarrage (`Cannot find module 'multer'`) et le client Socket.io ne se
charge plus : la messagerie bascule alors en mode démonstration.
:::

## 3. Vérifier que les deux tournent

```bash
# API publications
curl -s http://127.0.0.1:3001/api/posts | head -c 120

# Messagerie
curl -s http://127.0.0.1:3000/api/utilisateurs
```

:::note `Cannot GET /` sur le port 3001
C'est normal : l'API n'expose aucune route racine, seulement `/api/...`. Le site
s'ouvre sur `https://localhost`, via Apache.
:::

## 4. Ordre de démarrage conseillé

1. MariaDB (`sudo service mariadb start`)
2. `backend-api` (3001)
3. `backend-messagerie` (3000)
4. Apache (`sudo service apache2 restart`)

L'ordre n'est pas strict, mais démarrer MariaDB avant l'API évite les messages
`ECONNREFUSED 127.0.0.1:3306` au démarrage.
