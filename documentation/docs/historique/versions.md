---
sidebar_position: 1
title: Historique des versions
---

# Historique des versions du front-end

Chronologie des livraisons, du premier écran statique à la messagerie
complète. Chaque étape correspond à une archive livrée et testée.

## v0.1 — Maquette statique

- `index.html` + `style.css` : fil, profil, exploration en HTML figé.
- Aucun JavaScript applicatif.

## v0.2 — SPA et routeur

- Passage en modules ES6, création de `router.js`.
- Routes par hash, contrat `render()` / `mount()`.
- Navigation sans rechargement, en-tête et menu mobile.

## v0.3 — Client API et mode mock

- `api.js` : appels `/api/posts`, `/api/users`, `/api/hashtags`.
- `mock-data.js` et repli automatique pour les démonstrations.

## v0.4 — Publication et interactions

- Vue `publish.js` (envoi multipart, progression).
- `post-modal.js` : like, dislike, commentaires, signalement, repartage.
- Optimisation des images (640 px).

## v0.5 — Profils et comptes

- `profile.js` avec `?user=` pour consulter un autre compte.
- `edit-profile.js`, compte privé, bouton 🔖 d'enregistrement.
- `friends.js`, `notif.js`, centre de notifications et cloche.

## v0.6 — Messagerie v1

- Conversion de la page `site.html` du binôme en vue SPA.
- Correction du crash de la route `/`.
- WebSocket à travers Apache (`proxy_wstunnel` + `RewriteRule`).

## v0.7 — Liaison de la base publications

- 14 endpoints ajoutés côté API MariaDB.
- `mapRealPost()` : colonnes SQL → objets de vue.
- Hashtags depuis `Contient_Tag`, recherche, tendances.

## v0.8 — Nettoyage pré-commit

- Dump SQL vérifié colonne par colonne.
- Requêtes SQL validées (`sqlglot`).
- Mots de passe retirés du dépôt, `.gitignore`, `GUIDE.txt`.

## v0.9 — Fusion de l'équipe

- LifeInvader (renommage), `toast.js`, notifications.
- Paramètres enrichis (993 lignes), amis, profils publics.
- 99 blocs CSS fusionnés, 21/21 modules validés.

## v1.0 — Messagerie v2

- Nouveau backend : réactions, historique, médias, vocaux, groupes.
- `messages.js` réécrit (~74 Ko) : réponses citées, édition/suppression,
  upload avec progression, GIF, indicateur de saisie.
- Règle Apache `/uploads` ajoutée.

## v1.1 — Corrections v2.1

Quatre régressions signalées après intégration, corrigées et vérifiées dans un
navigateur headless :

| Réclamation | Cause réelle | Correctif |
| --- | --- | --- |
| Bulles invisibles | Couleur de fond identique à la page | Variables de thème sur les bulles |
| Médias non envoyés | Garde `socketConnected` sur l'upload | Garde supprimée + toast d'erreur |
| Sélection impossible | Modales ancrées hors du conteneur | `position: relative` sur `.messages-page` |
| Profils non cliquables | Fonction absente | Pseudos, en-tête DM, membres |

Ajouts : bannière hors-ligne, note « média indisponible », info-bulle d'appui
long, protection anti-doublons des écouteurs socket.

## Prochaines étapes envisagées

- `package.json` racine avec `npm start` orchestrant les deux backends.
- Tests unitaires côté messagerie (portés par le binôme).
- Docker Compose pour un démarrage reproductible.
- Documentation TypeDoc générée depuis le JSDoc.
