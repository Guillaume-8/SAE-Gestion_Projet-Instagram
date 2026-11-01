# Documentation front-end LifeInvader (Docusaurus)

Site Docusaurus 3 contenant la documentation de la partie front-end
du projet LifeInvader (SAÉ 5.02, BUT R&T).

## Installation

```bash
cd documentation
npm install
npm start          # http://localhost:3000
```

`npm run build` génère le site statique dans `build/`, déployable
sur n'importe quel hébergeur statique (ou servi par Apache).

## Organisation

- `docs/` : la documentation (un fichier Markdown par page)
- `sidebars.js` : la navigation
- `docusaurus.config.js` : configuration du site
- `src/css/custom.css` : thème aux couleurs de LifeInvader

Les pages sont rédigées en Markdown standard ; les blocs de code
utilisent la coloration syntaxique (`bash`, `js`, `apacheconf`, `sql`).
