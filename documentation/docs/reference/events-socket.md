---
sidebar_position: 3
title: Événements Socket.io
---

# Événements Socket.io

Tous les échanges passent par un socket unique (`window.socket`) et sont
rediffusés aux membres de la room `group_<idGroupe>`.

## Événements émis par le client

| Événement | Charge utile | Effet |
| --- | --- | --- |
| `join_group` | `idGroupe` | Rejoint la room de la conversation |
| `typing` | `{idGroupe, pseudonyme}` | Signale la frappe |
| `stop_typing` | `{idGroupe, pseudonyme}` | Fin de frappe |
| `send_message` | `{pseudonyme, idGroupe, contenu, replyData}` | Texte ou GIF |
| `send_media` | `{pseudonyme, idGroupe, mediaBase64, extension, mediaType, replyData}` | Image/vidéo en base64 (repli) |
| `send_audio` | `{pseudonyme, idGroupe, audioBase64, extension, replyData}` | Message vocal |
| `send_reaction` | `{idMessage, pseudonyme, emoji, idGroupe}` | Réaction |
| `delete_message` | `{idMessage, pseudonyme, idGroupe}` | Suppression |
| `edit_message` | `{idMessage, pseudonyme, nouveauContenu, idGroupe}` | Édition |
| `change_group_name` | `{idGroupe, nouveauNom}` | Renommage du groupe |

## Événements reçus par le client

| Événement | Charge utile | Traitement |
| --- | --- | --- |
| `receive_message` | message complet | Ajout de la bulle, aperçu, notification |
| `receive_reaction` | `{idMessage, emoji, action}` | Badge de réaction mis à jour |
| `message_deleted` | `{idMessage}` | Retrait de la bulle |
| `message_edited` | `{idMessage, nouveauContenu}` | Remplacement + badge « modifié » |
| `message_error` | `{message}` | Toast d'erreur (droits insuffisants) |
| `typing` / `stop_typing` | `{idGroupe, pseudonyme}` | Indicateur de saisie |
| `group_name_changed` | `{idGroupe, nouveauNom}` | En-tête et sidebar |
| `group_photo_changed` | `{idGroupe, photo}` | Avatars |
| `group_created` | conversation | Ajout dans la sidebar |
| `post_liked` | `{idPublication, likedBy}` | Notification de like (fil) |

## Exemple complet d'envoi

```js
socket.emit('send_message', {
  pseudonyme: 'eren_rt',
  idGroupe: 1,
  contenu: 'bonjour',
  replyData: null,
});
```

Le serveur répond à toute la room, y compris l'expéditeur : c'est
`receive_message` qui affiche la bulle, jamais une insertion locale. Cela
garantit que l'affichage correspond à ce qui est réellement enregistré.

## Règles d'utilisation

- Ne jamais installer deux fois le même écouteur : utiliser un drapeau
  (`handlersInstalled`) et installer à la première ouverture de la vue.
- Toujours vérifier `idGroupe === currentConversationId` avant d'afficher un
  message dans la zone de chat (sinon il apparaît dans la mauvaise
  conversation).
- Les événements `typing` et `stop_typing` sont temporisés (≈ 1,5 s) pour ne
  pas saturer le réseau.
