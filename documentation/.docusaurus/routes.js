import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '2e1'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '0ce'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '956'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', 'dfb'),
            routes: [
              {
                path: '/architecture/arborescence',
                component: ComponentCreator('/architecture/arborescence', 'e14'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/architecture/conventions',
                component: ComponentCreator('/architecture/conventions', '8a8'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/architecture/spa-router',
                component: ComponentCreator('/architecture/spa-router', '542'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/architecture/vue-ensemble',
                component: ComponentCreator('/architecture/vue-ensemble', '0d3'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/database_user/documentation-db',
                component: ComponentCreator('/database_user/documentation-db', '288'),
                exact: true
              },
              {
                path: '/demarrage/apache',
                component: ComponentCreator('/demarrage/apache', '004'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/demarrage/lancement',
                component: ComponentCreator('/demarrage/lancement', 'd7e'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/demarrage/prerequis',
                component: ComponentCreator('/demarrage/prerequis', 'f29'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/developpement/api-client',
                component: ComponentCreator('/developpement/api-client', '330'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/developpement/composants',
                component: ComponentCreator('/developpement/composants', 'f8b'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/developpement/messagerie',
                component: ComponentCreator('/developpement/messagerie', 'c40'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/developpement/styles-themes',
                component: ComponentCreator('/developpement/styles-themes', '9c5'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/developpement/vues',
                component: ComponentCreator('/developpement/vues', '527'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/exploitation/depannage',
                component: ComponentCreator('/exploitation/depannage', '2b2'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/exploitation/tests',
                component: ComponentCreator('/exploitation/tests', 'cd7'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/gestion-projet/git',
                component: ComponentCreator('/gestion-projet/git', '4f1'),
                exact: true
              },
              {
                path: '/gestion-projet/ia-usage',
                component: ComponentCreator('/gestion-projet/ia-usage', '51a'),
                exact: true
              },
              {
                path: '/gestion-projet/scrum',
                component: ComponentCreator('/gestion-projet/scrum', '21d'),
                exact: true
              },
              {
                path: '/gestion-projet/trello',
                component: ComponentCreator('/gestion-projet/trello', 'e75'),
                exact: true
              },
              {
                path: '/historique/decisions',
                component: ComponentCreator('/historique/decisions', 'f13'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/historique/versions',
                component: ComponentCreator('/historique/versions', '93c'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/installation/back-end',
                component: ComponentCreator('/installation/back-end', '8e7'),
                exact: true
              },
              {
                path: '/installation/database',
                component: ComponentCreator('/installation/database', '922'),
                exact: true
              },
              {
                path: '/installation/docker',
                component: ComponentCreator('/installation/docker', '665'),
                exact: true
              },
              {
                path: '/installation/front-end',
                component: ComponentCreator('/installation/front-end', 'f96'),
                exact: true
              },
              {
                path: '/installation/prerequis',
                component: ComponentCreator('/installation/prerequis', '3fe'),
                exact: true
              },
              {
                path: '/installation/ssl',
                component: ComponentCreator('/installation/ssl', 'bf5'),
                exact: true
              },
              {
                path: '/intro',
                component: ComponentCreator('/intro', 'c5d'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/reference/endpoints-api',
                component: ComponentCreator('/reference/endpoints-api', 'd91'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/reference/endpoints-messagerie',
                component: ComponentCreator('/reference/endpoints-messagerie', '8b6'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/reference/events-socket',
                component: ComponentCreator('/reference/events-socket', '548'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/reference/stockage-local',
                component: ComponentCreator('/reference/stockage-local', '4b2'),
                exact: true,
                sidebar: "front"
              },
              {
                path: '/technique/apache-config',
                component: ComponentCreator('/technique/apache-config', '1ea'),
                exact: true
              },
              {
                path: '/technique/api-reference',
                component: ComponentCreator('/technique/api-reference', '07a'),
                exact: true
              },
              {
                path: '/technique/architecture',
                component: ComponentCreator('/technique/architecture', '39e'),
                exact: true
              },
              {
                path: '/technique/back-end',
                component: ComponentCreator('/technique/back-end', '1db'),
                exact: true
              },
              {
                path: '/technique/database-schema',
                component: ComponentCreator('/technique/database-schema', 'f4b'),
                exact: true
              },
              {
                path: '/technique/front-end',
                component: ComponentCreator('/technique/front-end', '85b'),
                exact: true
              },
              {
                path: '/technique/securite',
                component: ComponentCreator('/technique/securite', '8e2'),
                exact: true
              },
              {
                path: '/technique/tests',
                component: ComponentCreator('/technique/tests', '4f8'),
                exact: true
              },
              {
                path: '/technique/websockets',
                component: ComponentCreator('/technique/websockets', '2f5'),
                exact: true
              },
              {
                path: '/utilisateur/filtres',
                component: ComponentCreator('/utilisateur/filtres', '37b'),
                exact: true
              },
              {
                path: '/utilisateur/inscription-connexion',
                component: ComponentCreator('/utilisateur/inscription-connexion', '46d'),
                exact: true
              },
              {
                path: '/utilisateur/interactions',
                component: ComponentCreator('/utilisateur/interactions', '9a7'),
                exact: true
              },
              {
                path: '/utilisateur/introduction',
                component: ComponentCreator('/utilisateur/introduction', '7ab'),
                exact: true
              },
              {
                path: '/utilisateur/messagerie',
                component: ComponentCreator('/utilisateur/messagerie', '114'),
                exact: true
              },
              {
                path: '/utilisateur/publications',
                component: ComponentCreator('/utilisateur/publications', 'e9a'),
                exact: true
              },
              {
                path: '/utilisateur/signalement',
                component: ComponentCreator('/utilisateur/signalement', 'e6a'),
                exact: true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
