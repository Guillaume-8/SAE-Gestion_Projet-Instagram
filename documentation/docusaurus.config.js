// @ts-check
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'InstaClone',
  tagline: 'Documentation technique — SAÉ 5.02 | BUT R&T 3ème année',
  url: 'https://localhost',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'InstaClone',
        logo: {
          alt: 'InstaClone Logo',
          src: 'img/logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'installationSidebar',
            position: 'left',
            label: 'Installation',
          },
          {
            type: 'docSidebar',
            sidebarId: 'utilisateurSidebar',
            position: 'left',
            label: 'Guide utilisateur',
          },
          {
            type: 'docSidebar',
            sidebarId: 'techniqueSidebar',
            position: 'left',
            label: 'Documentation technique',
          },
          {
            type: 'docSidebar',
            sidebarId: 'gestionProjetSidebar',
            position: 'left',
            label: 'Gestion de projet',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Installation',
                to: '/docs/installation/prerequis',
              },
              {
                label: 'Guide utilisateur',
                to: '/docs/utilisateur/introduction',
              },
              {
                label: 'Documentation technique',
                to: '/docs/technique/architecture',
              },
            ],
          },
          {
            title: 'Projet',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/Guillaume-8/SAE-Gestion_Projet-Instagram',
              },
              {
                label: 'Gestion de projet',
                to: '/docs/gestion-projet/scrum',
              },
            ],
          },
          {
            title: 'Équipe',
            items: [
              {
                label: 'BUT R&T — IUT',
                to: '/',
              },
              {
                label: 'SAÉ 5.02',
                to: '/',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} InstaClone — SAÉ 5.02 BUT R&T.`,
      },
    }),
};

module.exports = config;
