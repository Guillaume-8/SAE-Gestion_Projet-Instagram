/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  front: [
    'intro',
    {
      type: 'category',
      label: 'Front-end — Démarrage',
      collapsed: false,
      items: [
        'demarrage/prerequis',
        'demarrage/lancement',
        'demarrage/apache',
      ],
    },
    {
      type: 'category',
      label: 'Front-end — Architecture',
      collapsed: false,
      items: [
        'architecture/vue-ensemble',
        'architecture/spa-router',
        'architecture/arborescence',
        'architecture/conventions',
      ],
    },
    {
      type: 'category',
      label: 'Front-end — Développement',
      collapsed: false,
      items: [
        'developpement/api-client',
        'developpement/vues',
        'developpement/composants',
        'developpement/styles-themes',
        'developpement/messagerie',
      ],
    },
    {
      type: 'category',
      label: 'Front-end — Référence',
      collapsed: true,
      items: [
        'reference/endpoints-api',
        'reference/endpoints-messagerie',
        'reference/events-socket',
        'reference/stockage-local',
      ],
    },
    {
      type: 'category',
      label: 'Front-end — Exploitation',
      collapsed: true,
      items: [
        'exploitation/tests',
        'exploitation/depannage',
      ],
    },
    {
      type: 'category',
      label: 'Front-end — Historique',
      collapsed: true,
      items: [
        'historique/versions',
        'historique/decisions',
      ],
    },
    {
      type: 'category',
      label: 'Projet — Installation',
      collapsed: true,
      items: [
        'installation/prerequis',
        'installation/front-end',
        'installation/back-end',
        'installation/database',
        'installation/docker',
        'installation/ssl',
      ],
    },
    {
      type: 'category',
      label: 'Projet — Technique',
      collapsed: true,
      items: [
        'technique/architecture',
        'technique/front-end',
        'technique/back-end',
        'technique/apache-config',
        'technique/api-reference',
        'technique/database-schema',
        'technique/websockets',
        'technique/securite',
        'technique/tests',
      ],
    },
    {
      type: 'category',
      label: 'Projet — Guide utilisateur',
      collapsed: true,
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
    {
      type: 'category',
      label: 'Projet — Base de données',
      collapsed: true,
      items: ['database_user/documentation-db'],
    },
    {
      type: 'category',
      label: 'Projet — Gestion de projet',
      collapsed: true,
      items: [
        'gestion-projet/scrum',
        'gestion-projet/trello',
        'gestion-projet/git',
        'gestion-projet/ia-usage',
      ],
    },
  ],
};

export default sidebars;
