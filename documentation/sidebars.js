/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  front: [
    'intro',
    {
      type: 'category',
      label: 'Démarrage',
      collapsed: false,
      items: [
        'demarrage/prerequis',
        'demarrage/lancement',
        'demarrage/apache',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
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
      label: 'Développement',
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
      label: 'Référence',
      items: [
        'reference/endpoints-api',
        'reference/endpoints-messagerie',
        'reference/events-socket',
        'reference/stockage-local',
      ],
    },
    {
      type: 'category',
      label: 'Exploitation',
      items: [
        'exploitation/tests',
        'exploitation/depannage',
      ],
    },
    {
      type: 'category',
      label: 'Historique',
      items: [
        'historique/versions',
        'historique/decisions',
      ],
    },
  ],
};

export default sidebars;
