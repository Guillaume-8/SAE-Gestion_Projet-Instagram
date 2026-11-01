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
    path: '/docs',
    component: ComponentCreator('/docs', '523'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '143'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '664'),
            routes: [
              {
                path: '/docs/architecture/arborescence',
                component: ComponentCreator('/docs/architecture/arborescence', 'fc5'),
                exact: true
              },
              {
                path: '/docs/architecture/conventions',
                component: ComponentCreator('/docs/architecture/conventions', 'b3d'),
                exact: true
              },
              {
                path: '/docs/architecture/spa-router',
                component: ComponentCreator('/docs/architecture/spa-router', 'b16'),
                exact: true
              },
              {
                path: '/docs/architecture/vue-ensemble',
                component: ComponentCreator('/docs/architecture/vue-ensemble', 'd05'),
                exact: true
              },
              {
                path: '/docs/database_user/documentation-db',
                component: ComponentCreator('/docs/database_user/documentation-db', 'ad1'),
                exact: true
              },
              {
                path: '/docs/demarrage/apache',
                component: ComponentCreator('/docs/demarrage/apache', '2dc'),
                exact: true
              },
              {
                path: '/docs/demarrage/lancement',
                component: ComponentCreator('/docs/demarrage/lancement', '527'),
                exact: true
              },
              {
                path: '/docs/demarrage/prerequis',
                component: ComponentCreator('/docs/demarrage/prerequis', '35a'),
                exact: true
              },
              {
                path: '/docs/developpement/api-client',
                component: ComponentCreator('/docs/developpement/api-client', 'bca'),
                exact: true
              },
              {
                path: '/docs/developpement/composants',
                component: ComponentCreator('/docs/developpement/composants', 'a1e'),
                exact: true
              },
              {
                path: '/docs/developpement/messagerie',
                component: ComponentCreator('/docs/developpement/messagerie', '3b0'),
                exact: true
              },
              {
                path: '/docs/developpement/styles-themes',
                component: ComponentCreator('/docs/developpement/styles-themes', '887'),
                exact: true
              },
              {
                path: '/docs/developpement/vues',
                component: ComponentCreator('/docs/developpement/vues', '237'),
                exact: true
              },
              {
                path: '/docs/exploitation/depannage',
                component: ComponentCreator('/docs/exploitation/depannage', 'eeb'),
                exact: true
              },
              {
                path: '/docs/exploitation/tests',
                component: ComponentCreator('/docs/exploitation/tests', '603'),
                exact: true
              },
              {
                path: '/docs/gestion-projet/git',
                component: ComponentCreator('/docs/gestion-projet/git', '16d'),
                exact: true
              },
              {
                path: '/docs/gestion-projet/ia-usage',
                component: ComponentCreator('/docs/gestion-projet/ia-usage', 'cb4'),
                exact: true
              },
              {
                path: '/docs/gestion-projet/scrum',
                component: ComponentCreator('/docs/gestion-projet/scrum', 'c7a'),
                exact: true
              },
              {
                path: '/docs/gestion-projet/trello',
                component: ComponentCreator('/docs/gestion-projet/trello', '5cd'),
                exact: true
              },
              {
                path: '/docs/historique/decisions',
                component: ComponentCreator('/docs/historique/decisions', 'db1'),
                exact: true
              },
              {
                path: '/docs/historique/versions',
                component: ComponentCreator('/docs/historique/versions', 'e76'),
                exact: true
              },
              {
                path: '/docs/installation/back-end',
                component: ComponentCreator('/docs/installation/back-end', 'e7a'),
                exact: true
              },
              {
                path: '/docs/installation/database',
                component: ComponentCreator('/docs/installation/database', '788'),
                exact: true
              },
              {
                path: '/docs/installation/docker',
                component: ComponentCreator('/docs/installation/docker', 'b50'),
                exact: true
              },
              {
                path: '/docs/installation/front-end',
                component: ComponentCreator('/docs/installation/front-end', 'fc3'),
                exact: true
              },
              {
                path: '/docs/installation/prerequis',
                component: ComponentCreator('/docs/installation/prerequis', '6bc'),
                exact: true
              },
              {
                path: '/docs/installation/ssl',
                component: ComponentCreator('/docs/installation/ssl', '071'),
                exact: true
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '853'),
                exact: true
              },
              {
                path: '/docs/reference/endpoints-api',
                component: ComponentCreator('/docs/reference/endpoints-api', 'd71'),
                exact: true
              },
              {
                path: '/docs/reference/endpoints-messagerie',
                component: ComponentCreator('/docs/reference/endpoints-messagerie', '173'),
                exact: true
              },
              {
                path: '/docs/reference/events-socket',
                component: ComponentCreator('/docs/reference/events-socket', 'a5c'),
                exact: true
              },
              {
                path: '/docs/reference/stockage-local',
                component: ComponentCreator('/docs/reference/stockage-local', '62b'),
                exact: true
              },
              {
                path: '/docs/technique/apache-config',
                component: ComponentCreator('/docs/technique/apache-config', 'e09'),
                exact: true
              },
              {
                path: '/docs/technique/api-reference',
                component: ComponentCreator('/docs/technique/api-reference', 'eb1'),
                exact: true
              },
              {
                path: '/docs/technique/architecture',
                component: ComponentCreator('/docs/technique/architecture', '84d'),
                exact: true
              },
              {
                path: '/docs/technique/back-end',
                component: ComponentCreator('/docs/technique/back-end', '528'),
                exact: true
              },
              {
                path: '/docs/technique/database-schema',
                component: ComponentCreator('/docs/technique/database-schema', 'b71'),
                exact: true
              },
              {
                path: '/docs/technique/front-end',
                component: ComponentCreator('/docs/technique/front-end', '736'),
                exact: true
              },
              {
                path: '/docs/technique/securite',
                component: ComponentCreator('/docs/technique/securite', 'cb9'),
                exact: true
              },
              {
                path: '/docs/technique/tests',
                component: ComponentCreator('/docs/technique/tests', '831'),
                exact: true
              },
              {
                path: '/docs/technique/websockets',
                component: ComponentCreator('/docs/technique/websockets', '5f9'),
                exact: true
              },
              {
                path: '/docs/utilisateur/filtres',
                component: ComponentCreator('/docs/utilisateur/filtres', 'f1c'),
                exact: true
              },
              {
                path: '/docs/utilisateur/inscription-connexion',
                component: ComponentCreator('/docs/utilisateur/inscription-connexion', 'c5e'),
                exact: true
              },
              {
                path: '/docs/utilisateur/interactions',
                component: ComponentCreator('/docs/utilisateur/interactions', '4d0'),
                exact: true
              },
              {
                path: '/docs/utilisateur/introduction',
                component: ComponentCreator('/docs/utilisateur/introduction', '3df'),
                exact: true
              },
              {
                path: '/docs/utilisateur/messagerie',
                component: ComponentCreator('/docs/utilisateur/messagerie', '1ac'),
                exact: true
              },
              {
                path: '/docs/utilisateur/publications',
                component: ComponentCreator('/docs/utilisateur/publications', 'c9c'),
                exact: true
              },
              {
                path: '/docs/utilisateur/signalement',
                component: ComponentCreator('/docs/utilisateur/signalement', '322'),
                exact: true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', '2e1'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
