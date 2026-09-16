# API Utilisateurs — InstaClone (SAÉ 5.02)

Serveur Node.js/Express qui expose la table `Utilisateur` de la base
MariaDB **PhotoVideo** au front-end. Écoute sur le **port 3001**
(la messagerie de Yanis & Enes occupe déjà le port 3000).

## Endpoints

| Méthode | Chemin                    | Description                                | Auth |
|:--------|:--------------------------|:-------------------------------------------|:-----|
| GET     | `/api/auth/ping`          | Disponibilité du serveur                   | Non  |
| POST    | `/api/auth/register`      | Inscription (pseudonyme, email, mot de passe, prénom, nom) | Non |
| POST    | `/api/auth/login`         | Connexion par pseudonyme **ou** email      | Non  |
| GET     | `/api/users`              | Liste des pseudonymes                      | Non  |
| GET     | `/api/users/search?q=`    | Recherche d'utilisateurs                   | Non  |
| GET     | `/api/users/me`           | Profil complet + stats + publications      | Oui  |
| PUT     | `/api/users/me`           | Mise à jour du profil                       | Oui  |
| GET     | `/api/users/media/...`    | Fichiers médias servis en statique          | Non  |

L'authentification utilise un jeton signé HMAC (`Authorization: Bearer
<token>`), valable 24 h, retourné par login/register. Les mots de passe
sont hachés avec bcrypt.

## Installation

```bash
cd ~/sae502-instagram/backend-api
npm install
```

### 1. Configurer la connexion MariaDB

Éditer `config.js` :

```js
db: {
  host: 'localhost',   // ou l'IP de la machine MariaDB
  port: 3306,
  user: 'root',        // votre utilisateur MariaDB
  password: '',        // votre mot de passe MariaDB
  database: 'PhotoVideo',
},
```

Si MariaDB tourne **sous Windows** et le serveur Node **sous WSL** :
mettre dans `host` l'IP de la machine Windows vue depuis WSL (commande
`cat /etc/resolv.conf`, ligne `nameserver`) et s'assurer que MariaDB
écoute sur toutes les interfaces (`bind-address = 0.0.0.0`).

### 2. Mettre à niveau le schéma (2 colonnes manquantes)

Le front a besoin de `bio` et `photo_profil`, absentes du schéma
initial :

```bash
mysql -u root -p PhotoVideo < schema-upgrade.sql
```

### 3. Lancer le serveur

```bash
node server.js
# → "API Utilisateurs démarrée sur http://localhost:3001"
```

### 4. Configurer Apache

Copier le `instaclone.conf` fourni (dossier parent du zip) :

```bash
sudo cp instaclone.conf /etc/apache2/sites-available/instaclone.conf
sudo apache2ctl configtest
sudo service apache2 restart
```

Les routes `/api/auth` et `/api/users` sont routées vers le 3001,
le reste de `/api` (messagerie) vers le 3000.

### 5. Tester

```bash
# Disponibilité
curl -k https://localhost/api/auth/ping

# Inscription
curl -k -X POST https://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"pseudonyme":"eren_rt","email":"eren@test.fr","motDePasse":"secret123","prenom":"Eren","nom":""}'

# Connexion
curl -k -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifiant":"eren_rt","motDePasse":"secret123"}'
```

Puis dans le navigateur : `https://localhost/#/login` → S'inscrire.

## Comportement du front

Le front (api.js) teste la disponibilité de l'API via `/api/auth/ping` :

- **Serveur allumé** → inscription/connexion/profil/recherche utilisent
  la vraie base MariaDB. Le jeton est stocké dans `localStorage`
  (`instaclone-token`) et envoyé automatiquement.
- **Serveur éteint** → repli automatique sur le mode mock : le site
  reste utilisable pour les démos sans backend.

La déconnexion (menu hamburger) efface le jeton.

## Correspondance des champs (DB ↔ front)

| Colonne MariaDB  | Champ front       |
|:-----------------|:------------------|
| `pseudonyme`     | `username`       |
| `prenom` + `nom` | `name` (concaténés) |
| `email`          | email d'inscription |
| `mot_de_passe`   | `password` (haché bcrypt) |
| `photo_profil`   | `avatar` (URL ou data URL) |
| `bio`            | `bio`            |

## Note d'architecture

La messagerie (port 3000) utilise encore sa propre base SQLite
(`database_lifeinvader.db`) avec une table Utilisateur distincte de la
base MariaDB PhotoVideo. À terme, l'équipe devrait fusionner : la
messagerie devrait lire/écrire dans PhotoVideo pour partager les mêmes
comptes.
