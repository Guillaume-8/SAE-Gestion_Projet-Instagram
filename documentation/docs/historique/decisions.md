---
sidebar_position: 2
title: Décisions techniques
---

# Décisions techniques

Pourquoi le front est construit ainsi. Ces choix ont été faits sous contrainte
de temps, de compétences et d'intégration avec le travail des autres binômes.

## JavaScript natif plutôt qu'un framework

**Décision** : modules ES6, aucune dépendance de framework.

| Avantage | Inconvénient |
| --- | --- |
| Aucune compilation, déploiement = copier des fichiers | Pas de réactivité automatique du DOM |
| Code lisible pour l'évaluation | Plus de code de manipulation manuelle |
| Compatible avec le serveur Apache statique | Pas d'écosystème de composants |

Le sujet porte sur l'administration Apache et le réseau, pas sur React. Un
build step aurait ajouté une couche inutile à expliquer en soutenance.

## Routage par hash

**Décision** : `#/route` plutôt que `/route` avec `history.pushState`.

Un routage par chemin exigerait une réécriture Apache (`FallbackResource`) et
que chaque backend ignore ces chemins. Le hash évite tout réglage serveur et
fonctionne même servi depuis un sous-dossier.

## Deux backends derrière un proxy unique

**Décision** : Apache agrège l'API MariaDB (3001) et la messagerie (3000).

C'est la contrainte du projet d'équipe : deux groupes ont développé deux
serveurs indépendants. Le reverse proxy donne au navigateur une origine unique,
ce qui supprime CORS, contenu mixte et duplication des cookies.

Conséquence : **l'ordre des `ProxyPass` est critique**. Les routes spécifiques
(`/api/auth`, `/api/users`, `/api/posts`, `/api/hashtags`) passent avant la
règle générale `/api`.

## Repli mock systématique

**Décision** : chaque appel API a un `catch` qui renvoie des données fictives.

Une démonstration ne doit jamais échouer sur une base non démarrée. Le
compromis est assumé : le mode mock est signalé (bannière, toasts) pour ne pas
faire croire à un fonctionnement réel.

## Un seul socket pour toute l'application

**Décision** : `window.socket` créé par `notification.js`, réutilisé par la
messagerie.

Deux connexions Socket.io multiplieraient les événements reçus et les
reconnexions. Le socket partagé permet aussi au fil de recevoir les likes en
temps réel (`post_liked`) sans ouvrir de canal supplémentaire.

## Contenu préfixé plutôt que colonnes dédiées

**Décision** : `[IMAGE]:`, `[VIDEO]:`, `[AUDIO]:`, `[REPLY:…]` dans le champ
`Contenu_message`.

Le schéma de la messagerie était déjà figé côté binôme. Préfixer le contenu a
évité une migration de base et reste lisible en SQL. Le coût est un parsing
côté client (`stripReplyPrefix`, détection des préfixes).

## Clés `localStorage` en `instaclone_*`

**Décision** : conserver l'ancien préfixe malgré le renommage LifeInvader.

Renommer aurait déconnecté les utilisateurs déjà en session et réinitialisé le
thème. La compatibilité a primé sur la cohérence du nom.

## Images à 640 px

**Décision** : redimensionnement systématique avant livraison.

Les photos d'origine (plusieurs Mo) saturaient le réseau local et ralentissaient
le fil. 640 px suffisent pour les cartes et la visionneuse.

## Ce qui a été écarté

| Piste | Raison du rejet |
| --- | --- |
| Framework (React/Vue) | Hors sujet, ajoute une étape de build |
| `history.pushState` | Réécritures Apache supplémentaires |
| Stockage du jeton en `localStorage` | Risque XSS, préféré côté serveur |
| CDN pour les images | Le sujet exige des fichiers maîtrisés |
| Service worker / PWA | Temps de projet insuffisant |
