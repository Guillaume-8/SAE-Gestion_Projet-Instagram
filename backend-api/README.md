# API Utilisateurs — InstaClone (SAÉ 5.02)

Serveur Node.js/Express qui expose la table `Utilisateur` de la base
MariaDB **PhotoVideo** au front-end. Écoute sur le **port 3001**
(la messagerie de Yanis & Enes occupe déjà le port 3000).

## Endpoints

| Méthode | Chemin                    | Description                                | Auth |
|:--------|:--------------------------|:-------------------------------------------|:-----|
| GET     | `/api/auth/ping`          | Disponibilité du serveur                   | Non  |
| POST    | `/api/auth/register`      | Inscription (pseudonyme, email, mot de passe, prénom, nom) | Non |
| POST    | `/api/auth/login`         | Connexion par pseudonyme **ou** email      | Non  |
| GET     | `/api/users`              | Liste des pseudonymes                      | Non  |
| GET     | `/api/users/search?q=`    | Recherche d'utilisateurs                   | Non  |
| GET     | `/api/users/me`           | Profil complet + stats + publications      | Oui  |
| PUT     | `/api/users/me`           | Mise à jour du profil                       | Oui  |
| GET     | `/api/posts`              | Fil d'actualité (état like si connecté)    | Non  |
| GET     | `/api/posts/trending`     | Publications populaires                    | Non  |
| GET     | `/api/posts/search?q=`    | Recherche (texte, auteur, hashtag)         | Non  |
| GET     | `/api/posts/:id`          | Détail d'une publication + commentaires    | Non  |
| POST    | `/api/posts`              | Création avec média (multipart champ media)| Oui  |
| POST    | `/api/posts/:id/like`     | Bascule like (table Like_Publication)      | Oui  |
| POST    | `/api/posts/:id/dislike`  | Bascule dislike                            | Oui  |
| POST    | `/api/posts/:id/share`    | Partage (compteur nombre_repost)           | Non  |
| POST    | `/api/posts/:id/republish`| Repartage (table Repartager)              | Oui  |
| POST    | `/api/posts/:id/report`   | Signalement (table Signalement)           | Oui  |
| GET     | `/api/posts/:id/comments` | Commentaires                               | Non  |
| POST    | `/api/posts/:id/comments` | Ajout d'un commentaire                     | Oui  |
| GET     | `/api/hashtags`           | Hashtags avec compteurs (Contient_Tag)    | Non  |
| GET     | `/api/users/media/...`    | Fichiers médias servis en statique         | Non  |
