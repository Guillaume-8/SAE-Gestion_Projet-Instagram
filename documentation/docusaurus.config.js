// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'LifeInvader — Documentation Front-End',
  tagline: 'SAÉ 5.02 · BUT R&T · Clone Instagram en Node.js',
  favicon: 'img/favicon.ico',

  url: 'https://docs.lifeinvader.local',
  baseUrl: '/',

  organizationName: 'SAE-Gestion_Projet-Instagram',
  projectName: 'lifeinvader-front',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'fr',
    locales: ['fr'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // La page d'accueil (src/pages/index.js) occupe la racine '/'.
          // La documentation est donc servie sous /docs/... : pas de conflit
          // de route, et les liens de la page d'accueil restent valides.
          routeBasePath: '/docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'LifeInvader · Front',
        items: [
          {type: 'docSidebar', sidebarId: 'front', position: 'left', label: 'Documentation'},
          {
            href: 'https://github.com/Guillaume-8/SAE-Gestion_Projet-Instagram',
            label: 'Dépôt GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `SAÉ 5.02 — Documentation front-end LifeInvader (${new Date().getFullYear()}).`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json', 'apacheconf', 'sql'],
      },
      tableOfContents: {minHeadingLevel: 2, maxHeadingLevel: 4},
    }),
};

export default config;
