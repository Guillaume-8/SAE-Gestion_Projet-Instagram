---
sidebar_position: 3
---

# Configuration Apache

Cette page décrit la configuration du serveur Apache 2.4 utilisé par InstaClone : VirtualHost, HTTPS, reverse proxy vers le back-end Node.js et modules requis.

## Rôle d'Apache dans le projet

Apache remplit deux fonctions :

1. **Serveur web statique** — sert les fichiers du front-end (HTML, CSS, JS, images) depuis le dossier `frontend/`
2. **Reverse proxy** — redirige les requêtes API (`/api/*`) et WebSocket (`/socket.io/*`) vers le back-end Node.js sur le port 3000

Le client n'accède jamais directement à Node.js. Tout le trafic passe par Apache, ce qui permet de centraliser le HTTPS et de ne pas exposer le back-end.

## Modules Apache requis

Avant d'activer les VirtualHosts, activez les modules suivants :

```bash
sudo a2enmod ssl
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
sudo systemctl restart apache2
```

| Module | Rôle |
|---|---|
| `ssl` | Chiffrement HTTPS (TLS) |
| `proxy` | Moteur de reverse proxy |
| `proxy_http` | Proxy pour les requêtes HTTP/HTTPS vers Node.js |
| `proxy_wstunnel` | Proxy pour les WebSockets (messagerie temps réel) |
| `rewrite` | Réécriture d'URL (redirection HTTP → HTTPS) |

## Configuration HTTP (instaclone.conf)

Utilisé pour le développement simple sans HTTPS.

```apache
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /home/eren/sae502-instagram/frontend

    <Directory /home/eren/sae502-instagram/frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Reverse proxy vers le back-end Node.js (port 3000)
    # ProxyPass /api http://127.0.0.1:3000/api
    # ProxyPassReverse /api http://127.0.0.1:3000/api

    # WebSocket pour la messagerie temps réel
    # ProxyPass /socket.io ws://127.0.0.1:3000/socket.io
    # ProxyPassReverse /socket.io ws://127.0.0.1:3000/socket.io

    ErrorLog ${APACHE_LOG_DIR}/instaclone_error.log
    CustomLog ${APACHE_LOG_DIR}/instaclone_access.log combined
</VirtualHost>
```

Les directives `ProxyPass` sont commentées tant que le back-end n'est pas lancé. Pour les activer, décommentez les lignes et redémarrez Apache.

## Configuration HTTPS (instaclone temporaire.conf)

Utilise un certificat auto-signé temporaire en attendant le certificat final de Guillaume.

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
    SSLCertificateFile /etc/ssl/certs/instaclone-temp.crt
    SSLCertificateKeyFile /etc/ssl/private/instaclone-temp.key

    <Directory /home/eren/sae502-instagram/frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Reverse proxy pour le back-end Node.js
    # ProxyPass /api http://127.0.0.1:3000/api
    # ProxyPassReverse /api http://127.0.0.1:3000/api
    # ProxyPass /socket.io ws://127.0.0.1:3000/socket.io
    # ProxyPassReverse /socket.io ws://127.0.0.1:3000/socket.io

    ErrorLog ${APACHE_LOG_DIR}/instaclone_ssl_error.log
    CustomLog ${APACHE_LOG_DIR}/instaclone_ssl_access.log combined
</VirtualHost>
```

## Génération du certificat temporaire

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/instaclone-temp.key \
  -out /etc/ssl/certs/instaclone-temp.crt \
  -subj "/CN=localhost"
```

Ce certificat est valable 365 jours et est destiné au développement uniquement. Le navigateur affichera un avertissement — cliquez sur "Avancé" → "Continuer vers localhost".

Pour la production, Guillaume fournira un certificat signé par une autorité reconnue (Let's Encrypt ou autre).

## Activation des VirtualHosts

```bash
# Désactiver le site par défaut
sudo a2dissite 000-default.conf

# Activer les sites InstaClone
sudo a2ensite instaclone.conf
sudo a2ensite instaclone-temp.conf

# Tester la configuration
sudo apache2ctl configtest

# Redémarrer Apache
sudo systemctl restart apache2
```

## Activation du reverse proxy

Quand le back-end Node.js de Mathias sera prêt et lancé sur le port 3000 :

1. Décommentez les lignes `ProxyPass` / `ProxyPassReverse` dans le fichier `.conf` actif
2. Vérifiez que le back-end tourne : `curl http://127.0.0.1:3000/api/posts`
3. Redémarrez Apache : `sudo systemctl restart apache2`
4. Testez depuis le navigateur : `https://localhost/api/posts` doit renvoyer du JSON

## Adaptation du DocumentRoot

Le chemin `/home/eren/sae502-instagram/frontend` est spécifique à la machine d'Eren. Chaque développeur doit adapter la directive `DocumentRoot` et le bloc `<Directory>` selon son propre chemin.

Pour éviter les problèmes, utilisez un chemin cohérent ou créez un lien symbolique :

```bash
ln -s /votre/chemin/vers/le/projet /home/eren/sae502-instagram
```

## Logs Apache

| Fichier | Contenu |
|---|---|
| `/var/log/apache2/instaclone_error.log` | Erreurs HTTP |
| `/var/log/apache2/instaclone_access.log` | Requêtes HTTP reçues |
| `/var/log/apache2/instaclone_ssl_error.log` | Erreurs HTTPS |
| `/var/log/apache2/instaclone_ssl_access.log` | Requêtes HTTPS reçues |

Pour suivre les logs en temps réel :

```bash
sudo tail -f /var/log/apache2/instaclone_ssl_access.log
```

## Problèmes fréquents

| Problème | Solution |
|---|---|
| `ProxyPass` ne fonctionne pas | Vérifiez `a2enmod proxy proxy_http proxy_wstunnel` |
| WebSocket ne se connecte pas | Vérifiez que `proxy_wstunnel` est activé |
| Erreur SSL | Vérifiez que les chemins des certificats sont corrects |
| Port 443 déjà utilisé | `sudo lsof -i :443` pour identifier le processus |
| Page blanche en HTTPS | Vérifiez que le navigateur accepte le certificat auto-signé |
| `Permission denied` | `chmod -R 755 frontend/` et vérifiez le propriétaire du dossier |
