---
sidebar_position: 2
---

# Installation du front-end

Cette page décrit comment installer et lancer la partie front-end d'InstaClone, servie par Apache.

## 1. Cloner le dépôt

```bash
git clone https://github.com/Guillaume-8/SAE-Gestion_Projet-Instagram.git
cd SAE-Gestion_Projet-Instagram
```

## 2. Structure du front-end

```
frontend/
├── index.html              → Point d'entrée HTML (SPA)
├── css/
│   └── style.css           → Styles globaux (variables CSS, composants, responsive)
├── js/
│   ├── router.js           → Routeur SPA basé sur le hash
│   ├── api.js              → Couche d'abstraction API (mock ↔ réel)
│   ├── mock-data.js        → Données fictives pour le développement
│   ├── feed.js             → Vue du fil d'actualité
│   └── views/
│       ├── login.js        → Vue de connexion / inscription
│       ├── profile.js      → Vue de profil utilisateur
│       ├── explore.js      → Vue des tendances / hashtags
│       └── messages.js     → Vue de messagerie
├── assets/
│   ├── icons/              → Icônes du site
│   └── images/             → Images statiques
instaclone.conf             → Configuration Apache (HTTP)
instaclone temporaire.conf  → Configuration Apache (HTTPS, certificat temporaire)
```

## 3. Configurer Apache

### 3.1. Copier le VirtualHost

```bash
sudo cp "instaclone.conf" /etc/apache2/sites-available/instaclone.conf
sudo a2ensite instaclone
```

### 3.2. Configurer le HTTPS (recommandé)

Pour utiliser le HTTPS avec un certificat temporaire (en attendant le certificat final de Guillaume) :

```bash
# Générer un certificat auto-signé
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/instaclone-temp.key \
  -out /etc/ssl/certs/instaclone-temp.crt \
  -subj "/CN=localhost"

# Activer le VirtualHost HTTPS
sudo cp "instaclone temporaire.conf" /etc/apache2/sites-available/instaclone-temp.conf
sudo a2ensite instaclone-temp
```

### 3.3. Adapter le DocumentRoot

Le fichier de configuration Apache utilise le chemin `/home/eren/sae502-instagram/frontend`. Si votre chemin est différent, modifiez la directive `DocumentRoot` dans les deux fichiers `.conf` :

```apache
DocumentRoot /votre/chemin/vers/SAE-Gestion_Projet-Instagram/frontend

<Directory /votre/chemin/vers/SAE-Gestion_Projet-Instagram/frontend>
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

### 3.4. Redémarrer Apache

```bash
sudo systemctl restart apache2
```

## 4. Accéder à l'application

- **HTTP** : http://localhost
- **HTTPS** : https://localhost (redirige automatiquement depuis HTTP si le VirtualHost HTTPS est activé)

Le navigateur affichera un avertissement de sécurité si vous utilisez le certificat temporaire. Cliquez sur "Avancé" → "Continuer vers localhost" pour passer.

## 5. Mode mock (développement sans back-end)

Le front-end peut fonctionner sans le back-end Node.js grâce à un système de données fictives (mock). C'est contrôlé par un flag dans `js/api.js` :

```javascript
const USE_MOCK = true;   // true  → utilise les données fictives
                          // false → utilise l'API REST réelle
```

Tant que `USE_MOCK` est à `true`, toutes les requêtes (publications, commentaires, like, messages, etc.) sont simulées localement. Quand le back-end de Mathias sera prêt, passez le flag à `false` et les requêtes `fetch` seront redirigées vers l'API via le reverse proxy Apache.

## 6. Problèmes fréquents

| Problème | Solution |
|---|---|
| Page blanche | Vérifiez le `DocumentRoot` dans la config Apache |
| Erreur 403 Forbidden | Vérifiez les permissions du dossier : `chmod -R 755 frontend/` |
| Modules ES6 non chargés | Le navigateur doit supporter `type="module"` (tous les navigateurs modernes) |
| Redirection en boucle | Désactivez le VirtualHost HTTPS temporaire si vous n'avez pas généré le certificat |
| `:Zone.Identifier` | Voir la section [FAQ technique](../technique/front-end#fichiers-zoneidentifier) |
