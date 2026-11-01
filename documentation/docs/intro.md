---
sidebar_position: 1
title: Introduction
---

# Documentation front-end — LifeInvader

**LifeInvader** est un clone d'Instagram réalisé dans le cadre de la SAÉ 5.02
du BUT Réseaux & Télécommunications (3ᵉ année). Le projet est mené en équipe :
un groupe développe la messagerie temps réel, un autre l'API et la base de
données, et cette documentation couvre la **partie front-end Web Apache**.

## Ce que fait le front-end

Le front-end est une **Single Page Application** (SPA) écrite en JavaScript
natif (modules ES6), sans framework : pas de React, pas de bundler, pas
d'étape de compilation. Le navigateur charge directement les fichiers servis
par Apache.

Il assure quatre rôles :

1. **Afficher l'interface** — fil d'actualité, profils, exploration,
   publications, notifications, paramètres, messagerie.
2. **Dialoguer avec deux backends** — l'API MariaDB (publications, comptes,
   hashtags) et le serveur de messagerie Socket.io (conversations temps réel).
3. **Router côté client** — la navigation se fait par hash (`#/feed`,
   `#/messages`…), sans rechargement de page.
4. **Rester utilisable en démonstration** — un mode « mock » prend le relais
   quand un backend n'est pas disponible, pour ne jamais présenter une page
   blanche lors d'une soutenance.

## Périmètre de cette documentation

| Inclus | Non couvert ici |
| --- | --- |
| Structure et conventions du front | Schéma SQL détaillé de la base |
| Routeur, vues, modules partagés | Code interne du serveur de messagerie |
| Client API et mode mock | Déploiement Docker |
| Messagerie temps réel côté client | Gestion de projet (Scrum, Trello) |
| Configuration Apache et proxy | |
| Tests, dépannage, historique des versions | |

## Chiffres clés (état actuel)

- **21 modules JavaScript** (10 modules transverses + 11 vues)
- **≈ 11 900 lignes** au total (`index.html` + CSS + JS)
- **13 routes** SPA
- **21 endpoints** API MariaDB et **11 endpoints** messagerie consommés
- **18 événements** Socket.io échangés avec le serveur de messagerie

## Par où commencer

- Pour lancer le projet : [Prérequis](./demarrage/prerequis.md) puis
  [Lancement local](./demarrage/lancement.md).
- Pour comprendre le code : [Vue d'ensemble de l'architecture](./architecture/vue-ensemble.md).
- Pour modifier une page : [Les vues](./developpement/vues.md).
- En cas de problème : [Dépannage](./exploitation/depannage.md).
