---
sidebar_position: 2
title: Lancement local
---

# Lancement local — checklist complète

Trois services doivent tourner **en même temps**. L'ordre n'a pas d'importance,
mais chacun a son rôle.

## 1. Base de données MariaDB

```bash
sudo service mariadb start
mysql -u root -p < database/photovideo-dump.sql
```

La base s'appelle `PhotoVideo`. Le dump contient cinq comptes de test hashés
en bcrypt et six publications. Les mots de passe de démonstration sont
distribués séparément (voir `GUIDE.txt`) — **ne jamais les committer**.

## 2. API publications (port 3001)

```bash
cd backend-api
npm install
node server.js
```

Vérification rapide :

```bash
curl -k https://localhost/api/auth/ping
# {"status":"ok","database":"connected"}
```

## 3. Messagerie temps réel (port 3000)

```bash
cd backend-messagerie
npm install          # obligatoire : multer est une dépendance nouvelle
node index.js
```

:::danger Piège classique
Si `npm install` n'a pas été relancé après une mise à jour, le serveur plante
au démarrage (`Cannot find module 'multer'`). Le client Socket.io ne se charge
alors plus, et **la messagerie bascule silencieusement en mode mock** :
les conversations affichées sont fictives et les médias ne partent pas.
La bannière orange dans la messagerie signale cet état.
:::

## 4. Apache

```bash
sudo cp frontend/instaclone.conf /etc/apache2/sites-available/
sudo a2ensite instaclone
sudo apache2ctl configtest      # doit afficher « Syntax OK »
sudo service apache2 restart
```

## 5. Vérification dans le navigateur

1. Ouvrir **https://localhost** (accepter le certificat auto-signé).
2. Se connecter (ou créer un compte).
3. Contrôler le fil d'actualité, puis ouvrir `#/messages`.
4. **Ctrl + Shift + R** après chaque mise à jour de fichiers : le navigateur
   met agressivement en cache le CSS et les modules ES.

## Tableau récapitulatif

| Service | Commande | Port | Vérification |
| --- | --- | --- | --- |
| MariaDB | `sudo service mariadb start` | 3306 | `mysql -u root -p` |
| API publications | `cd backend-api && node server.js` | 3001 | `/api/auth/ping` |
| Messagerie | `cd backend-messagerie && node index.js` | 3000 | `/` renvoie du JSON |
| Apache | `sudo service apache2 restart` | 443 | page de connexion |

## Tout arrêter

```bash
# Les deux Node : Ctrl+C dans chaque terminal
sudo service apache2 stop
sudo service mariadb stop
```
