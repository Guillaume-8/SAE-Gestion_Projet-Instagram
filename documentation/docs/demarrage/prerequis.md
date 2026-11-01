---
sidebar_position: 1
title: Prérequis
---

# Prérequis

## Environnement cible

Le projet tourne sous **WSL (Ubuntu)** sur la machine de développement, avec
Apache en frontal. Les versions utilisées et testées :

| Outil | Version | Rôle |
| --- | --- | --- |
| Apache HTTP Server | 2.4 | Sert les fichiers statiques, reverse proxy |
| Node.js | 20 LTS | Les deux serveurs backend |
| npm | 10+ | Installation des dépendances backend |
| MariaDB | 10.11+ | Base `PhotoVideo` (API publications) |
| SQLite | fourni avec Node | Base de la messagerie |

:::warning WSL sans systemd
Sur WSL, `systemctl` n'est **pas** disponible. Toutes les commandes de service
passent par `service` :

```bash
sudo service apache2 restart
```
:::

## Modules Apache nécessaires

```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite ssl headers
sudo service apache2 restart
```

- `proxy`, `proxy_http` : reverse proxy vers les deux serveurs Node.
- `proxy_wstunnel` : indispensable pour Socket.io (passage en WebSocket).
- `rewrite` : réécriture de `/socket.io/*` vers `ws://`.
- `ssl` : HTTPS local (obligatoire pour `getUserMedia`, donc pour les
  messages vocaux et la capture photo).

## Arborescence attendue sur la machine

```
~/sae502-instagram/
├── frontend/               # cette partie (servie par Apache)
├── backend-api/            # API MariaDB, port 3001
├── backend-messagerie/     # messagerie SQLite + Socket.io, port 3000
└── database/               # dump SQL + GUIDE.txt
```

:::tip Chemin du DocumentRoot
Le fichier `frontend/instaclone.conf` utilise
`/home/eren/sae502-instagram/frontend`. Si votre dossier utilisateur diffère,
adaptez `DocumentRoot` et la directive `<Directory>` **avant** de copier le
fichier dans `/etc/apache2/sites-available/`.
:::

## Certificats SSL locaux

Trois fichiers sont attendus (fournis séparément, **jamais** dans le dépôt) :

- `/etc/ssl/certs/instaclone-web.crt`
- `/etc/ssl/private/instaclone-web.key`
- `/usr/local/share/ca-certificates/instaclone-ca.crt`

Génération d'une autorité locale et d'un certificat serveur :

```bash
# Autorité de certification locale
openssl req -x509 -newkey rsa:4096 -days 365 -nodes \
  -keyout instaclone-ca.key -out instaclone-ca.crt \
  -subj "/CN=InstaClone Local CA"

# Certificat serveur avec SAN (nécessaire pour localhost en HTTPS)
openssl req -newkey rsa:2048 -nodes \
  -keyout instaclone-web.key -out instaclone-web.csr \
  -subj "/CN=localhost"
openssl x509 -req -in instaclone-web.csr -CA instaclone-ca.crt \
  -CAkey instaclone-ca.key -CAcreateserial -days 365 \
  -out instaclone-web.crt \
  -extfile <(printf "subjectAltName=DNS:localhost,IP:127.0.0.1")
```

Puis importer l'autorité dans le magasin du système :

```bash
sudo cp instaclone-ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```
