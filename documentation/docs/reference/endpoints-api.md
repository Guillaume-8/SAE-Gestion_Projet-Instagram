---
sidebar_position: 1
title: API publications (3001)
---

# API publications — MariaDB (port 3001)

Base : `PhotoVideo`. Toutes les routes sont préfixées `/api` et passent par
Apache. Les réponses sont en JSON ; les erreurs renvoient
`{ "error": "message" }`.

## Authentification

| Méthode | Route | Corps | Réponse |
| --- | --- | --- | --- |
| GET | `/api/auth/ping` | — | `{status, database}` |
| POST | `/api/auth/login` | `{pseudonyme, mot_de_passe}` | `{token, user}` |
| POST | `/api/auth/register` | `{pseudonyme, email, mot_de_passe}` | `{user}` |

Les mots de passe sont hachés en bcrypt côté serveur. Le pseudonyme et l'e-mail
sont uniques (contrainte `UNIQUE` en base).

## Utilisateurs

| Méthode | Route | Description |
| --- | --- | --- |
| GET | `/api/users` | Liste des comptes |
| GET | `/api/users/me` | Compte courant |
| GET | `/api/users/search?q=` | Recherche par pseudo |
| GET | `/api/users/:pseudonyme` | Profil public |
| PUT | `/api/users/me` | Mise à jour du profil |

:::danger Ordre des routes Express
`/api/users/:pseudonyme` est déclaré **après** `/api/users/me` et
`/api/users/search`. Placé avant, il intercepterait ces deux chemins et
renverrait un profil nommé « me » ou « search ».
:::

## Publications

| Méthode | Route | Description |
| --- | --- | --- |
| GET | `/api/posts` | Fil (pagination par `?limit`) |
| GET | `/api/posts/trending` | Publications tendance |
| GET | `/api/posts/search?q=` | Recherche |
| GET | `/api/posts/:id` | Détail |
| POST | `/api/posts` | Création (multipart : `media`, `legende`) |
| POST | `/api/posts/:id/like` | Like |
| POST | `/api/posts/:id/dislike` | Dislike |
| POST | `/api/posts/:id/comments` | Ajouter un commentaire |
| GET | `/api/posts/:id/comments` | Lister les commentaires |
| POST | `/api/posts/:id/report` | Signaler |
| POST | `/api/posts/:id/republish` | Repartager |
| POST | `/api/posts/:id/share` | Compter un partage |

Le like et le dislike sont stockés dans `Like_Publication.est_un_like`
(booléen) : un même utilisateur ne peut pas cumuler les deux sur une
publication.

## Hashtags

| Méthode | Route | Description |
| --- | --- | --- |
| GET | `/api/hashtags` | Tags et nombre de publications associées |

Les tags proviennent de la table de liaison `Contient_Tag`, avec agrégation
`COUNT`.

## Codes de retour

| Code | Signification |
| --- | --- |
| 200 | Succès |
| 201 | Création |
| 400 | Corps invalide |
| 401 | Authentification requise |
| 404 | Ressource absente |
| 409 | Conflit (pseudo ou e-mail déjà pris) |
| 500 | Erreur serveur |

## Exemple

```bash
curl -k -X POST https://localhost/api/posts/12/like \
  -H "Content-Type: application/json" \
  -d '{"pseudonyme":"eren_rt"}'
```
