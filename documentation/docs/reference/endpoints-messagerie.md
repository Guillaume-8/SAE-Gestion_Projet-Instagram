---
sidebar_position: 2
title: API messagerie (3000)
---

# API messagerie — SQLite (port 3000)

Base : `database_lifeinvader.db`. Ces routes sont servies par le même processus
que Socket.io.

## Conversations et messages

| Méthode | Route | Description |
| --- | --- | --- |
| GET | `/` | État du serveur (JSON) |
| GET | `/api/conversations/:pseudonyme` | Conversations d'un utilisateur |
| GET | `/api/messages/:idGroupe` | Messages d'une conversation |
| GET | `/api/utilisateurs` | Liste des pseudonymes |
| POST | `/api/dm` | Créer (ou retrouver) une conversation privée |
| POST | `/api/groupe` | Créer un groupe |
| DELETE | `/api/conversations/:idGroupe` | Quitter / supprimer |
| GET | `/api/groupe/:idGroupe/details` | Nom, membres, médias |

## Médias

| Méthode | Route | Corps |
| --- | --- | --- |
| POST | `/api/upload` | multipart : `media`, `pseudonyme`, `idGroupe`, `mediaType`, `replyData` |
| POST | `/api/upload-group-photo` | multipart : `photo`, `idGroupe` |

Les fichiers sont écrits dans `uploads/` (200 Mo maximum) et servis par
`/uploads/...` à travers Apache. Sans la règle `ProxyPass /uploads`, ils
renvoient 404 alors qu'ils existent bien sur le disque.

## Historique

| Méthode | Route | Description |
| --- | --- | --- |
| GET | `/api/message-history/:idMessage` | Versions précédentes d'un message modifié |

## Format d'une conversation

```json
{
  "id": 1,
  "type": "GROUPE",
  "name": "Groupe test",
  "members": ["eren_rt", "tanguy_rt", "guillaume_rt"],
  "lastMessage": "salut les gars",
  "lastMessageSender": "tanguy_rt",
  "lastMessageDate": "2026-10-31T09:41:00.000Z"
}
```

## Format d'un message

```json
{
  "id_message": 42,
  "Pseudonyme_utilisateur": "tanguy_rt",
  "id_groupe": 1,
  "Contenu_message": "[IMAGE]:/uploads/1730000000_ab12.png",
  "Date_message": "2026-10-31T09:41:00.000Z",
  "reactions": [{"emoji": "👍", "u": "eren_rt"}],
  "est_modifie": 1
}
```

Le contenu peut être préfixé (`[IMAGE]:`, `[VIDEO]:`, `[AUDIO]:`,
`[REPLY:…]`) : voir [Messagerie temps réel](../developpement/messagerie.md).
