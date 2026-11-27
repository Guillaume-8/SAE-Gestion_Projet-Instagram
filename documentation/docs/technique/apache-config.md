---
sidebar_position: 3
---

# Configuration Apache

Cette page décrit le VirtualHost Apache 2.4 du projet LifeInvader : HTTPS,
service des fichiers statiques et **reverse proxy vers deux serveurs Node.js
distincts**.

## Rôle d'Apache dans le projet

Apache remplit trois fonctions :

1. **Serveur web statique** — sert le front-end (HTML, CSS, JS, images) depuis
   le dossier `frontend/`.
2. **Reverse proxy de l'API** — aiguille `/api/auth`, `/api/users`,
   `/api/posts` et `/api/hashtags` vers `backend-api` (port **3001**).
3. **Reverse proxy de la messagerie** — aiguille `/socket.io`, `/uploads` et le
   reste de `/api` vers `backend-messagerie` (port **3000**).

Le navigateur ne connaît qu'une seule origine (`https://localhost`) : pas de
CORS, pas de contenu mixte, cookies partagés.

## Les deux backends

| Serveur | Port | Routes servies | Base de données |
| --- | --- | --- | --- |
| `backend-api` | **3001** | `/api/auth`, `/api/users`, `/api/posts`, `/api/hashtags` | MariaDB `PhotoVideo` |
| `backend-messagerie` | **3000** | `/socket.io`, `/uploads`, et **tout le reste de `/api`** (`/api/conversations`, `/api/messages`, `/api/utilisateurs`, `/api/dm`, `/api/groupe`, `/api/upload`, `/api/upload-group-photo`, `/api/message-history`) | SQLite `database_lifeinvader.db` |

:::danger L'ordre des règles compte
Apache applique la **première** `ProxyPass` qui correspond. Les quatre routes
spécifiques (`/api/auth`, `/api/users`, `/api/posts`, `/api/hashtags`) doivent
être déclarées **avant** la règle générale `/api`. Inversées, toutes les
requêtes API partiraient vers la messagerie et les publications répondraient
en 404.
:::

## Modules Apache requis

```bash
sudo a2enmod ssl proxy proxy_http proxy_wstunnel rewrite headers
sudo service apache2 restart
```

| Module | Rôle |
| --- | --- |
| `ssl` | Chiffrement HTTPS (obligatoire pour `getUserMedia` : vocaux, photo) |
| `proxy`, `proxy_http` | Reverse proxy HTTP vers les deux Node |
| `proxy_wstunnel` | Passage en WebSocket pour Socket.io |
| `rewrite` | Réécriture de `/socket.io/*` vers `ws://` |
| `headers` | En-têtes de sécurité |

:::note WSL
Sous WSL, `systemctl` n'existe pas : utiliser `sudo service apache2 restart`.
:::

## Le fichier `frontend/instaclone.conf`

```apache
# Redirection HTTP vers HTTPS
<VirtualHost *:80>
    ServerName localhost
    Redirect permanent / https://localhost/
</VirtualHost>

# Hôte virtuel sécurisé (HTTPS)
<VirtualHost *:443>
    ServerName localhost
    DocumentRoot /home/eren/sae502-instagram/frontend

    # Chiffrement SSL
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/instaclone-web.crt
    SSLCertificateKeyFile /etc/ssl/private/instaclone-web.key
    SSLCACertificateFile /usr/local/share/ca-certificates/instaclone-ca.crt

    <Directory /home/eren/sae502-instagram/frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # --- REVERSE PROXY : deux serveurs Node.js ---

    # 1) API LifeInvader (MariaDB PhotoVideo) : serveur dédié port 3001.
    #    Ces routes spécifiques DOIVENT venir AVANT la règle
    #    générale /api (premier match gagnant dans Apache).
    ProxyPass        /api/auth     http://127.0.0.1:3001/api/auth
    ProxyPassReverse /api/auth     http://127.0.0.1:3001/api/auth
    ProxyPass        /api/users    http://127.0.0.1:3001/api/users
    ProxyPassReverse /api/users    http://127.0.0.1:3001/api/users
    ProxyPass        /api/posts    http://127.0.0.1:3001/api/posts
    ProxyPassReverse /api/posts    http://127.0.0.1:3001/api/posts
    ProxyPass        /api/hashtags http://127.0.0.1:3001/api/hashtags
    ProxyPassReverse /api/hashtags http://127.0.0.1:3001/api/hashtags

    # 2) Messagerie temps réel (Yanis & Enes) : port 3000.
    #    WebSocket support pour Socket.io.
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /socket.io/(.*) ws://127.0.0.1:3000/socket.io/$1 [P,L]

    ProxyPass        /socket.io http://127.0.0.1:3000/socket.io
    ProxyPassReverse /socket.io http://127.0.0.1:3000/socket.io

    # Médias de la messagerie (photos/vidéos/audios uploadés, port 3000)
    ProxyPass        /uploads  http://127.0.0.1:3000/uploads
    ProxyPassReverse /uploads  http://127.0.0.1:3000/uploads

    # Reste de l'API : messagerie
    ProxyPass        /api       http://127.0.0.1:3000/api
    ProxyPassReverse /api       http://127.0.0.1:3000/api

    ErrorLog ${APACHE_LOG_DIR}/instaclone_ssl_error.log
    CustomLog ${APACHE_LOG_DIR}/instaclone_ssl_access.log combined
</VirtualHost>
```

### Points d'attention

| Directive | Rôle | Si absente |
| --- | --- | --- |
| `RewriteRule … ws://` | Passage WebSocket | Socket.io retombe en long-polling, ou échoue |
| `ProxyPass /uploads` | Sert les médias de la messagerie | Les photos/vidéos envoyées renvoient 404 |
| `ProxyPass /api` (général) | Routes de la messagerie | Conversations et envois de messages échouent |
| `SSLCACertificateFile` | Chaîne de confiance | Avertissement de certificat dans le navigateur |

## Certificats HTTPS

Le projet utilise une autorité locale et un certificat serveur **avec SAN**
(`DNS:localhost, IP:127.0.0.1`) : sans SAN, les navigateurs récents rejettent le
certificat même signé par une autorité locale.

```bash
# Autorité de certification locale
openssl req -x509 -newkey rsa:4096 -days 365 -nodes \
  -keyout instaclone-ca.key -out instaclone-ca.crt \
  -subj "/CN=InstaClone Local CA"

# Certificat serveur avec SAN
openssl req -newkey rsa:2048 -nodes \
  -keyout instaclone-web.key -out instaclone-web.csr \
  -subj "/CN=localhost"
openssl x509 -req -in instaclone-web.csr -CA instaclone-ca.crt \
  -CAkey instaclone-ca.key -CAcreateserial -days 365 \
  -out instaclone-web.crt \
  -extfile <(printf "subjectAltName=DNS:localhost,IP:127.0.0.1")

# Import de l'autorité dans le magasin système
sudo cp instaclone-ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

Les certificats et les clés ne sont **jamais** versionnés (voir `.gitignore`).

## Activation

```bash
sudo cp frontend/instaclone.conf /etc/apache2/sites-available/
sudo a2ensite instaclone
sudo apache2ctl configtest          # doit afficher « Syntax OK »
sudo service apache2 restart
```

Pour désactiver le site par défaut s'il entre en conflit :

```bash
sudo a2dissite 000-default
sudo service apache2 restart
```

## Tests

### Les deux backends directement

```bash
# API publications (MariaDB) — port 3001
curl -s http://127.0.0.1:3001/api/posts | head -c 200

# Messagerie (SQLite) — port 3000
curl -s http://127.0.0.1:3000/api/utilisateurs | head -c 200
```

### À travers Apache

```bash
# Doit renvoyer du JSON de l'API publications
curl -sk https://localhost/api/posts | head -c 200

# Doit renvoyer du JSON de la messagerie
curl -sk https://localhost/api/utilisateurs

# Un média de publication (servi par backend-api)
curl -skI https://localhost/api/users/media/lifeinvader_post1.jpg

# Un média de messagerie (servi par backend-messagerie)
curl -skI https://localhost/uploads/<fichier>
```

:::tip Reconnaître un mauvais routage
Si `https://localhost/api/utilisateurs` renvoie du **HTML**, la règle générale
`/api` manque ou est placée avant les règles spécifiques. Si
`https://localhost/api/posts` renvoie une erreur 404 de la messagerie, c'est
l'inverse : les règles `/api/*` de l'API passent après la règle générale.
:::

## Logs Apache

| Fichier | Contenu |
| --- | --- |
| `/var/log/apache2/instaclone_ssl_error.log` | Erreurs HTTPS |
| `/var/log/apache2/instaclone_ssl_access.log` | Requêtes HTTPS |

```bash
sudo tail -f /var/log/apache2/instaclone_ssl_error.log
```

## Problèmes fréquents

| Problème | Cause | Solution |
| --- | --- | --- |
| `Invalid command 'ProxyPass'` | Module absent | `sudo a2enmod proxy proxy_http` |
| `Invalid command 'RewriteRule'` | Module absent | `sudo a2enmod rewrite` |
| WebSocket ne se connecte pas | `proxy_wstunnel` absent ou règle `ws://` manquante | Activer le module, vérifier la `RewriteRule` |
| `/api/utilisateurs` renvoie du HTML | Règle générale `/api` absente | Ajouter `ProxyPass /api …` en dernier |
| `/api/posts` renvoie 404 | Règles spécifiques après la règle générale | Remonter les `ProxyPass` `/api/auth`, `/api/users`, `/api/posts`, `/api/hashtags` |
| Médias de messagerie en 404 | `ProxyPass /uploads` absent | Ajouter la règle et recharger Apache |
| Erreur SSL au navigateur | Certificat sans SAN ou CA non importée | Régénérer avec SAN, `update-ca-certificates` |
| Page blanche en HTTPS | Certificat refusé | Accepter le certificat ou l'importer |
| `Permission denied` | Droits du dossier | `chmod -R 755 frontend/` |
| Port 443 déjà utilisé | Autre service | `sudo lsof -i :443` |
