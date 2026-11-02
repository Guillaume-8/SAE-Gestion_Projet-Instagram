# Documentation LifeInvader (Docusaurus)

Site Docusaurus 3 regroupant la documentation du projet **LifeInvader**
(SAÉ 5.02, BUT R&T) : partie front-end, installation, technique, guide
utilisateur, base de données et gestion de projet.

Branche `docs` du dépôt : ce dossier ne contient que la documentation.
Le code du site (front, backends) vit sur les autres branches.

## Lancer le site

```bash
cd documentation
npm install
npm run start        # → http://localhost:3000
```

La page d'accueil est à la racine `/`, la documentation sous `/docs`.

## Construire la version statique

```bash
npm run build        # génère build/
npm run serve        # prévisualise le résultat
```

## Organisation

```
documentation/
├── docs/                  # une page Markdown par sujet
│   ├── intro.md
│   ├── demarrage/         # prérequis, lancement, Apache
│   ├── architecture/      # vue d'ensemble, routeur, conventions
│   ├── developpement/     # api.js, vues, composants, CSS, messagerie
│   ├── reference/         # endpoints API, socket, localStorage
│   ├── exploitation/      # tests, dépannage
│   ├── historique/        # versions, décisions techniques
│   ├── installation/      # installation par composant
│   ├── technique/         # architecture, API, schéma, sécurité, tests
│   ├── utilisateur/       # guide utilisateur
│   ├── database_user/     # documentation de la base
│   └── gestion-projet/    # Scrum, Trello, Git, usage de l'IA
├── sidebars.js            # navigation (48 pages)
├── docusaurus.config.js   # configuration du site
├── src/                   # page d'accueil + thème
├── static/                # favicon et fichiers publics
└── GUIDE-INSTALLATION.md  # installation détaillée (Node, nvm, WSL)
```

## Ajouter une page

1. Créer le fichier dans `docs/<section>/ma-page.md` avec un titre `#`.
2. L'ajouter dans `sidebars.js` (sinon elle reste hors navigation).
3. Recharger : Docusaurus reconstruit automatiquement en mode `start`.
