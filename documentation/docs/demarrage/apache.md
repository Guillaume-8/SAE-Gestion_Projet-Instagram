---
sidebar_position: 3
title: Configuration Apache
---

# Configuration Apache et reverse proxy

Apache est le point d'entrée unique du site. Il sert les fichiers statiques du
front **et** aiguille les requêtes vers le bon backend Node.js.

## Pourquoi un reverse proxy

Le navigateur ne parle qu'à un seul hôte (`https://localhost`). Sans proxy, il
faudrait appeler `http://localhost:3001` et `http://localhost:3000` depuis la
page servie en HTTPS : le navigateur bloquerait ces requêtes en **contenu
mixte**, et les cookies de session ne seraient pas partagés.

Le reverse proxy règle les deux problèmes : une seule origine, donc pas de CORS,
pas de contenu mixte, et des cookies valables partout.

## Schéma de routage

```
Navigateur ── HTTPS 443 ──► Apache
                             ├── /*.html, /css, /js, /assets ──► fichiers locaux
                             ├── /api/auth, /api/users,
                             │   /api/posts, /api/hashtags ──► 127.0.0.1:3001 (MariaDB)
                             ├── /socket.io/* ──────────────► 127.0.0.1:3000 (WebSocket)
                             ├── /uploads/* ────────────────► 127.0.0.1:3000 (médias)
                             └── /api/* (reste) ────────────► 127.0.0.1:3000 (messagerie)
```

:::danger L'ordre des règles compte
Apache applique la **première** `ProxyPass` qui correspond. Les quatre routes
spécifiques (`/api/auth`, `/api/users`, `/api/posts`, `/api/hashtags`) doivent
être déclarées **avant** la règle générale `/api`. Inversées, tout partirait
vers la messagerie et les publications renverraient des 404.
:::

## Le fichier `instaclone.conf` expliqué

```apacheconf
# Redirection HTTP -> HTTPS
<VirtualHost *:80>
    ServerName localhost
    Redirect permanent / https://localhost/
</VirtualHost>

<VirtualHost *:443>
    ServerName localhost
    DocumentRoot /home/eren/sae502-instagram/frontend

    SSLEngine on
    SSLCertificateFile    /etc/ssl/certs/instaclone-web.crt
    SSLCertificateKeyFile /etc/ssl/private/instaclone-web.key
    SSLCACertificateFile  /usr/local/share/ca-certificates/instaclone-ca.crt

    <Directory /home/eren/sae502-instagram/frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # --- API MariaDB (port 3001) : routes spécifiques d'abord ---
    ProxyPass        /api/auth     http://127.0.0.1:3001/api/auth
    ProxyPassReverse /api/auth     http://127.0.0.1:3001/api/auth
    ProxyPass        /api/users    http://127.0.0.1:3001/api/users
    ProxyPassReverse /api/users    http://127.0.0.1:3001/api/users
    ProxyPass        /api/posts    http://127.0.0.1:3001/api/posts
    ProxyPassReverse /api/posts    http://127.0.0.1:3001/api/posts
    ProxyPass        /api/hashtags http://127.0.0.1:3001/api/hashtags
    ProxyPassReverse /api/hashtags http://127.0.0.1:3001/api/hashtags

    # --- Socket.io (WebSocket) vers la messagerie ---
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /socket.io/(.*) ws://127.0.0.1:3000/socket.io/$1 [P,L]

    ProxyPass        /socket.io http://127.0.0.1:3000/socket.io
    ProxyPassReverse /socket.io http://127.0.0.1:3000/socket.io

    # --- Médias uploadés dans la messagerie ---
    ProxyPass        /uploads http://127.0.0.1:3000/uploads
    ProxyPassReverse /uploads http://127.0.0.1:3000/uploads

    # --- Reste de l'API : messagerie ---
    ProxyPass        /api http://127.0.0.1:3000/api
    ProxyPassReverse /api http://127.0.0.1:3000/api

    ErrorLog ${APACHE_LOG_DIR}/instaclone_ssl_error.log
    CustomLog ${APACHE_LOG_DIR}/instaclone_ssl_access.log combined
</VirtualHost>
```

### Points d'attention

| Élément | Rôle | Si absent |
| --- | --- | --- |
| `RewriteRule … ws://` | Passage WebSocket | Socket.io retombe en long-polling (lent) ou échoue |
| `ProxyPass /uploads` | Sert les photos/vidéos de la messagerie | Les médias envoyés restent invisibles (404) |
| `ProxyPass /api` (général) | Routes de la messagerie | Conversations et envois de messages échouent |
| `SSLCACertificateFile` | Chaîne de confiance | Erreur de certificat dans le navigateur |

## Activer le site

```bash
sudo cp frontend/instaclone.conf /etc/apache2/sites-available/
sudo a2ensite instaclone
sudo apache2ctl configtest
sudo service apache2 restart
```

Pour désactiver le site par défaut s'il entre en conflit :

```bash
sudo a2dissite 000-default
sudo service apache2 restart
```

## Vérifier le routage

```bash
# API MariaDB
curl -k https://localhost/api/auth/ping

# Messagerie (doit renvoyer un JSON, pas la page HTML)
curl -k https://localhost/api/utilisateurs

# Un média de la messagerie
curl -k -I https://localhost/uploads/<fichier>.png
```

Si `/api/utilisateurs` renvoie du HTML, la règle générale `/api` manque ou est
placée avant les règles spécifiques.
