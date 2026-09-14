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
    component: ComponentCreator('/docs', '1d4'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', 'd0e'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', 'b52'),
            routes: [
              {
                path: '/docs/gestion-projet/git',
                component: ComponentCreator('/docs/gestion-projet/git', '4e7'),
                exact: true,
                sidebar: "gestionProjetSidebar"
              },
              {
                path: '/docs/gestion-projet/ia-usage',
                component: ComponentCreator('/docs/gestion-projet/ia-usage', '934'),
                exact: true,
                sidebar: "gestionProjetSidebar"
              },
              {
                path: '/docs/gestion-projet/scrum',
                component: ComponentCreator('/docs/gestion-projet/scrum', 'f68'),
                exact: true,
                sidebar: "gestionProjetSidebar"
              },
              {
                path: '/docs/gestion-projet/trello',
                component: ComponentCreator('/docs/gestion-projet/trello', '764'),
                exact: true,
                sidebar: "gestionProjetSidebar"
              },
              {
                path: '/docs/installation/back-end',
                component: ComponentCreator('/docs/installation/back-end', 'e9e'),
                exact: true,
                sidebar: "installationSidebar"
              },
              {
                path: '/docs/installation/database',
                component: ComponentCreator('/docs/installation/database', 'd34'),
                exact: true,
                sidebar: "installationSidebar"
              },
              {
                path: '/docs/installation/docker',
                component: ComponentCreator('/docs/installation/docker', 'd4c'),
                exact: true,
                sidebar: "installationSidebar"
              },
              {
                path: '/docs/installation/front-end',
                component: ComponentCreator('/docs/installation/front-end', '3fd'),
                exact: true,
                sidebar: "installationSidebar"
              },
              {
                path: '/docs/installation/prerequis',
                component: ComponentCreator('/docs/installation/prerequis', '293'),
                exact: true,
                sidebar: "installationSidebar"
              },
              {
                path: '/docs/installation/ssl',
                component: ComponentCreator('/docs/installation/ssl', '580'),
                exact: true,
                sidebar: "installationSidebar"
              },
              {
                path: '/docs/technique/apache-config',
                component: ComponentCreator('/docs/technique/apache-config', 'fad'),
                exact: true,
                sidebar: "techniqueSidebar"
              },
              {
                path: '/docs/technique/api-reference',
                component: ComponentCreator('/docs/technique/api-reference', '4c7'),
                exact: true,
                sidebar: "techniqueSidebar"
              },
              {
                path: '/docs/technique/architecture',
                component: ComponentCreator('/docs/technique/architecture', 'c61'),
                exact: true,
                sidebar: "techniqueSidebar"
              },
              {
                path: '/docs/technique/back-end',
                component: ComponentCreator('/docs/technique/back-end', 'fbc'),
                exact: true,
                sidebar: "techniqueSidebar"
              },
              {
                path: '/docs/technique/database-schema',
                component: ComponentCreator('/docs/technique/database-schema', 'b21'),
                exact: true,
                sidebar: "techniqueSidebar"
              },
              {
                path: '/docs/technique/front-end',
                component: ComponentCreator('/docs/technique/front-end', '4a6'),
                exact: true,
                sidebar: "techniqueSidebar"
              },
              {
                path: '/docs/technique/securite',
                component: ComponentCreator('/docs/technique/securite', '112'),
                exact: true,
                sidebar: "techniqueSidebar"
              },
              {
                path: '/docs/technique/tests',
                component: ComponentCreator('/docs/technique/tests', '649'),
                exact: true,
                sidebar: "techniqueSidebar"
              },
              {
                path: '/docs/technique/websockets',
                component: ComponentCreator('/docs/technique/websockets', '7be'),
                exact: true,
                sidebar: "techniqueSidebar"
              },
              {
                path: '/docs/utilisateur/filtres',
                component: ComponentCreator('/docs/utilisateur/filtres', '3fb'),
                exact: true,
                sidebar: "utilisateurSidebar"
              },
              {
                path: '/docs/utilisateur/inscription-connexion',
                component: ComponentCreator('/docs/utilisateur/inscription-connexion', '3f6'),
                exact: true,
                sidebar: "utilisateurSidebar"
              },
              {
                path: '/docs/utilisateur/interactions',
                component: ComponentCreator('/docs/utilisateur/interactions', 'eb6'),
                exact: true,
                sidebar: "utilisateurSidebar"
              },
              {
                path: '/docs/utilisateur/introduction',
                component: ComponentCreator('/docs/utilisateur/introduction', '5aa'),
                exact: true,
                sidebar: "utilisateurSidebar"
              },
              {
                path: '/docs/utilisateur/messagerie',
                component: ComponentCreator('/docs/utilisateur/messagerie', '518'),
                exact: true,
                sidebar: "utilisateurSidebar"
              },
              {
                path: '/docs/utilisateur/publications',
                component: ComponentCreator('/docs/utilisateur/publications', '721'),
                exact: true,
                sidebar: "utilisateurSidebar"
              },
              {
                path: '/docs/utilisateur/signalement',
                component: ComponentCreator('/docs/utilisateur/signalement', '970'),
                exact: true,
                sidebar: "utilisateurSidebar"
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
