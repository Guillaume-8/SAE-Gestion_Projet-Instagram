# Guide d'installation de la documentation — InstaClone

Ce guide explique comment installer et lancer la documentation Docusaurus sur votre machine, ainsi que comment contribuer vos pages.

---

## 1. Prérequis : installer Node.js dans WSL

Si vous n'avez pas Node.js installé **dans WSL** (pas la version Windows), installez-le avec nvm :

```bash
# Installer nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Recharger le shell
source ~/.bashrc

# Installer Node.js 22
nvm install 22

# Vérifier
which npm
# Doit afficher : /home/VOTRE_USER/.nvm/versions/node/v22.x.x/bin/npm
# Si ça affiche /mnt/c/... → c'est le npm Windows, ça ne marchera pas
```

---

## 2. Récupérer la documentation depuis GitHub

```bash
# Se placer à la racine du projet
cd ~/sae502-instagram

# Récupérer la branche docs
git fetch origin
git checkout docs
git pull origin docs
```

---

## 3. Installer et lancer Docusaurus

```bash
# Entrer dans le dossier de la documentation
cd documentation

# Installer les dépendances (la première fois seulement)
npm install

# Lancer le serveur de développement
npm run start
```

Le site est accessible sur **http://localhost:3000**.

> **Attention** : si vous obtenez l'erreur `CMD.EXE a été démarré avec le chemin UNC`,
> votre terminal VS Code est en mode Windows. Ouvrez un terminal WSL :
> `Ctrl+Shift+P` → `Terminal: Select Default Profile` → choisir **WSL Bash** ou **Debian**.

> **Attention** : si vous obtenez l'erreur `docusaurus: Permission denied`,
> supprimez le `node_modules` et réinstallez :
> ```bash
> rm -rf node_modules
> npm install
> npm run start
> ```

---

## 4. Comment contribuer vos pages

Chaque page de documentation est un fichier Markdown (`.md`) dans le dossier `docs/`.
Les pages qui vous sont assignées contiennent un bloc `:::note Page à rédiger` avec votre nom
et la liste du contenu attendu.

### Vos pages

| Membre(s) | Pages à rédiger |
|---|---|
| **Mathias** | `docs/installation/back-end.md`, `docs/technique/back-end.md`, `docs/technique/api-reference.md`, `docs/technique/database-schema.md` |
| **Thomas** | `docs/installation/database.md` (partie utilisateurs), `docs/technique/database-schema.md` |
| **Pierre / Mathias** | `docs/installation/database.md` (partie photos/vidéos), `docs/technique/database-schema.md` |
| **Guillaume** | `docs/installation/ssl.md`, `docs/technique/securite.md` |
| **Yanis / Enes** | `docs/utilisateur/messagerie.md`, `docs/technique/websockets.md`, `docs/technique/tests.md` (Enes) |
| **Tanguy / Jonathan** | `docs/utilisateur/filtres.md` |
| **Mathéo** | `docs/utilisateur/signalement.md` |
| **Yanis** (chef de projet) | `docs/gestion-projet/scrum.md`, `docs/gestion-projet/trello.md`, `docs/gestion-projet/git.md`, `docs/gestion-projet/ia-usage.md` |
| **Eren** | `docs/utilisateur/inscription-connexion.md`, `docs/utilisateur/publications.md`, `docs/utilisateur/interactions.md` |

### Marche à suivre

1. **Ouvrir le fichier** qui vous correspond dans `documentation/docs/...`
2. **Remplacer** le bloc `:::note Page à rédiger` par votre contenu en Markdown
3. **Sauvegarder** — Docusaurus se recharge automatiquement si `npm run start` tourne
4. **Commiter et pusher** :

```bash
cd ~/sae502-instagram
git add documentation/
git commit -m "docs: rédaction de ma partie (nom des pages)"
git push origin docs
```

5. **Prévenir l'équipe** que vos pages sont prêtes

---

## 5. Structure des fichiers Markdown

Chaque page commence par un en-tête Docusaurus (`frontmatter`) :

```markdown
---
sidebar_position: 2
---

# Titre de ma page

Mon contenu en Markdown...
```

- `sidebar_position` contrôle l'ordre d'affichage dans le menu latéral
- Le titre `#` devient le titre de la page
- Le Markdown standard fonctionne (titres, listes, tableaux, code, liens, images)

### Exemple de page rédigée

Regardez les pages déjà rédigées par Eren comme exemple :
- `docs/technique/architecture.md`
- `docs/technique/front-end.md`
- `docs/installation/front-end.md`
- `docs/technique/apache-config.md`

---

## 6. Problèmes fréquents

| Problème | Solution |
|---|---|
| `CMD.EXE` / chemin UNC | Terminal VS Code en mode Windows → utiliser un terminal WSL |
| `npm` pointe vers `/mnt/c/...` | Installer Node.js dans WSL avec nvm (voir étape 1) |
| `Permission denied` sur docusaurus | `rm -rf node_modules && npm install` |
| Page blanche sur localhost:3000 | Vérifier que `npm run start` tourne sans erreur |
| `Could not read package.json` | Être dans le dossier `documentation/`, pas à la racine du projet |
| Changements non visibles | Docusaurus se recharge automatiquement ; sinon `Ctrl+C` et relancer `npm run start` |

---

## 7. Résumé des commandes

```bash
# Installation (une seule fois)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22

# Récupérer le projet
cd ~/sae502-instagram
git checkout docs
git pull origin docs
cd documentation
npm install

# Lancer
npm run start

# Après avoir rédigé vos pages
git add .
git commit -m "docs: rédaction de ma partie"
git push origin docs
```
