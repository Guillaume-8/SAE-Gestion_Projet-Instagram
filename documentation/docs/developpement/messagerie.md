---
sidebar_position: 5
title: Messagerie temps réel
---

# Messagerie temps réel

`js/views/messages.js` est le module le plus volumineux du front (≈ 2 000
lignes). Il combine trois transports : HTTP classique, Socket.io et upload XHR.

## Écran

```
┌──────────────┬──────────────────────────────────────────┐
│ Conversations│ En-tête (nom, membres, statut)           │
│ ─────────    ├──────────────────────────────────────────┤
│ Groupe test  │ Messages (bulles, réactions, réponses)   │
│ DM tanguy    │ Indicateur de saisie                     │
│ …            ├──────────────────────────────────────────┤
│ [+ Nouveau]  │ 😊  [message…]  GIF  +  Envoyer          │
└──────────────┴──────────────────────────────────────────┘
```

## Cycle de vie socket

```js
function tryConnectSocket() {
  if (typeof io !== 'undefined' || typeof window.io !== 'undefined') {
    socket = window.socket || (window.socket = io());
    socketConnected = true;
  }
}
```

- Un **seul** socket pour l'application (`window.socket`, créé par
  `notification.js`).
- `socketConnected` reste `false` si le script `/socket.io/socket.io.js` n'a pas
  chargé — c'est-à-dire si le serveur de messagerie est éteint.
- Les écouteurs sont installés **une seule fois** (drapeau `handlersInstalled`) :
  sans cela, quitter puis revenir sur la vue dupliquerait chaque message reçu.

## Rooms

Chaque conversation est une room `group_<idGroupe>` :

```js
socket.emit('join_group', convId);
```

Le serveur rediffuse ensuite les événements à toute la room, ce qui permet
l'échange entre plusieurs fenêtres du navigateur (démonstration à deux écrans).

## Formats de contenu

Le contenu d'un message est une chaîne préfixée, stockée telle quelle en base :

| Préfixe | Sens | Rendu |
| --- | --- | --- |
| *(aucun)* | Texte simple | Bulle de texte |
| `[IMAGE]:/uploads/x.png` | Image | `<img class="msg-image">` + lightbox |
| `[VIDEO]:/uploads/x.mp4` | Vidéo | `<video controls>` |
| `[AUDIO]:/uploads/x.webm` | Message vocal | Lecteur audio |
| `[REPLY:<base64>]` | Réponse citée | Bandeau « En réponse à … » |

Une réponse citée précède toujours le contenu réel :

```
[REPLY:eyJhdXRldXIiOiJ0YW5ndXkifQ==]salut !
```

Le base64 contient un JSON `{auteur, contenu}` du message cité.

## Envoi d'un message texte

```js
socket.emit('send_message', {
  pseudonyme: currentUser,
  idGroupe: currentConversationId,
  contenu: texte,
  replyData: replyingTo,   // null si pas de réponse
});
```

Le serveur préfixe `[REPLY:…]` si `replyData` est fourni, enregistre en SQLite
puis rediffuse `receive_message` à la room.

## Envoi d'une photo ou d'une vidéo

Deux étapes, **sans passer par le socket** :

1. `XMLHttpRequest` en `POST /api/upload` avec `FormData` (`media`,
   `pseudonyme`, `idGroupe`, `mediaType`, `replyData`).
2. Le serveur écrit le fichier dans `uploads/`, enregistre le message et
   rediffuse `receive_message` à la room.

```js
const xhr = new XMLHttpRequest();
xhr.open('POST', '/api/upload', true);
xhr.upload.onprogress = (e) => {
  if (e.lengthComputable) {
    const pourcentage = Math.round((e.loaded / e.total) * 100);
    barre.style.width = pourcentage + '%';
  }
};
xhr.onload = () => { /* masquer la progression, vider le champ */ };
xhr.send(formData);
```

L'upload est en HTTP : il fonctionne même si le WebSocket est tombé. La
progression est obligatoire pour les vidéos (jusqu'à 200 Mo).

:::danger Ne pas conditionner l'upload à `socketConnected`
Une garde de ce type a existé en v2.0 : serveur éteint, le sélecteur de
fichier s'ouvrait puis **rien ne partait, sans message d'erreur**. Supprimée en
v2.1.
:::

## Message vocal

`MediaRecorder` capture le micro, puis le blob est envoyé via
`socket.emit('send_audio', {audioBase64, extension, replyData})`.

```js
const flux = await navigator.mediaDevices.getUserMedia({audio: true});
const enregistreur = new MediaRecorder(flux);
```

:::warning HTTPS obligatoire
`getUserMedia` n'existe qu'en contexte sécurisé : `https://localhost` (ou
`http://localhost`). Sur `http://<ip-lan>`, le bouton vocal échoue.
:::

## GIF

Le sélecteur interroge l'API Giphy et envoie l'URL distante comme un message
`[IMAGE]:https://media.giphy.com/…`. Aucun fichier n'est stocké côté serveur.

La clé utilisée est une clé de test publique : si elle expire, le sélecteur
affiche « Clé API Giphy expirée ou invalide ». Il suffit alors de créer une clé
gratuite sur `developers.giphy.com` et de la remplacer dans `fetchGifs()`.

## Réactions, édition, suppression

| Action | Émission | Diffusion |
| --- | --- | --- |
| Réagir | `send_reaction` | `receive_reaction` |
| Modifier | `edit_message` | `message_edited` |
| Supprimer | `delete_message` | `message_deleted` |
| Historique | `GET /api/message-history/:id` | — |

Le serveur vérifie l'auteur pour l'édition et la suppression ; en cas de refus
il renvoie `message_error`, affiché en toast.

## Appui long sur un message

Un clic maintenu 800 ms ouvre la modale d'options :

```js
div.addEventListener('mousedown', () => {
  minuteur = setTimeout(() => {
    openMessageOptions(id, estTexte, date, texte, estMoi, auteur);
  }, 800);
});
```

La modale propose :

- **Répondre** (toujours),
- **Modifier** et **Supprimer** (uniquement ses propres messages, serveur
  connecté),
- **Historique** si le message a été modifié.

## Pseudo cliquable → profil

Le nom de l'auteur de chaque message porte `class="msg-sender"` et
`data-user`. Un écouteur délégué sur `#chat-messages` intercepte le clic :

```js
const senderSpan = e.target.closest('.msg-sender');
if (senderSpan && senderSpan.dataset.user) {
  window.location.hash =
    '#/profile?user=' + encodeURIComponent(senderSpan.dataset.user);
  return;
}
```

Même principe pour l'en-tête d'une conversation privée et pour les membres
listés dans les détails d'un groupe.

## Détails de groupe

Le panneau latéral (`#group-details-sidebar`) charge
`GET /api/groupe/:id/details` : nom, membres, médias partagés. On peut y changer
le nom (`change_group_name`) et la photo (`POST /api/upload-group-photo`).

## Indicateur de saisie

`typing` / `stop_typing` sont émis à la frappe (avec temporisation) et affichés
sous la forme « X est en train d'écrire… ». L'état est un `Set` de pseudos,
vidé à chaque changement de conversation.

## Notifications

À la réception d'un message d'un autre utilisateur :

- son (Web Audio, pas de fichier à charger),
- toast cliquable qui ouvre la conversation,
- notification navigateur si l'onglet est masqué,
- badge dans le titre de l'onglet.

## Mode hors-ligne

Si `socketConnected` est faux au montage, une **bannière orange** s'affiche en
haut de la messagerie :

> ⚠️ Serveur de messagerie non connecté — les messages ne seront ni envoyés ni
> reçus. Lancez `node index.js` dans `backend-messagerie`.

Les conversations basculent alors sur les données mock. C'est un mode de
démonstration, pas un mode de production.

## Résumé des correctifs v2.1

| Problème | Cause | Correctif |
| --- | --- | --- |
| Bulles invisibles | Couleur = fond de page | Variables de thème sur les bulles |
| Médias non envoyés | Garde `socketConnected` sur l'upload | Garde retirée |
| Modales mal placées | `.messages-page` sans `position: relative` | Ajouté |
| Profils non cliquables | Fonction absente | Pseudos, en-tête DM, membres |
| Messages dupliqués | Écouteurs socket réinstallés | Drapeau `handlersInstalled` |
