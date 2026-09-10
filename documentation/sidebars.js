/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // --- Barre latérale : Installation ---
  installationSidebar: [
    {
      type: 'category',
      label: 'Installation',
      items: [
        'installation/prerequis',
        'installation/front-end',
        'installation/back-end',
        'installation/database',
        'installation/docker',
        'installation/ssl',
      ],
    },
  ],

  // --- Barre latérale : Guide utilisateur ---
  utilisateurSidebar: [
    {
      type: 'category',
      label: 'Guide utilisateur',
      items: [
        'utilisateur/introduction',
        'utilisateur/inscription-connexion',
        'utilisateur/publications',
        'utilisateur/interactions',
        'utilisateur/messagerie',
        'utilisateur/filtres',
        'utilisateur/signalement',
      ],
    },
  ],

  // --- Barre latérale : Documentation technique ---
  techniqueSidebar: [
    {
      type: 'category',
      label: 'Documentation technique',
      items: [
        'technique/architecture',
        'technique/front-end',
        'technique/apache-config',
        'technique/back-end',
        'technique/api-reference',
        'technique/database-schema',
        'technique/websockets',
        'technique/tests',
        'technique/securite',
      ],
    },
  ],

  // --- Barre latérale : Gestion de projet ---
  gestionProjetSidebar: [
    {
      type: 'category',
      label: 'Gestion de projet',
      items: [
        'gestion-projet/scrum',
        'gestion-projet/trello',
        'gestion-projet/git',
        'gestion-projet/ia-usage',
      ],
    },
  ],
};

module.exports = sidebars;
