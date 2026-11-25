---
sidebar_position: 4
---

# Configuration des bases de données

:::note Page à rédiger
**Responsables** : Thomas (DB utilisateurs), Pierre & Mathias (DB photos/vidéos)

Cette page doit décrire :
- Emplacement des fichiers SQLite
- Schéma des tables
- Initialisation des bases
:::

# Installation de la Base de Données (Médias, Interactions & Modération)

:::info Périmètre de cette documentation
Cette section couvre exclusivement l'installation et la structure de la base de données **Photos, Vidéos, Interactions et Modération** (gérée par **Pierre / Mathias**).  
La base de données dédiée aux **Utilisateurs et à l'Authentification** est gérée séparément par **Thomas** (voir la section dédiée).
:::

---

## 1. Emplacement des fichiers SQLite

Les fichiers de base de données SQLite sont stockés côté serveur dans le répertoire dédié du back-end, isolés des dossiers accessibles publiquement en HTTP :

- **Base Médias & Modération (cette page) :** `backend/database/media_moderation.sqlite` *(ou chemin configuré dans le `.env` du back-end)*
- **Base Utilisateurs (partie Thomas) :** `backend/database/users.sqlite`
- **Stockage physique des médias (Photos / Vidéos / Vocaux) :** Enregistrés sur le disque dans `backend/uploads/` sous un identifiant **UUID v4** ; seule l'URL complète est stockée en base de données.

---

## 2. Schéma des tables

La base regroupe **17 tables fonctionnelles** (ainsi que la table pivot `Utilisateur` permettant le lien avec la base de Thomas et l'intégrité des clés étrangères `id_utilisateur`) réparties en 4 domaines :

| Domaine | Tables concernées | Rôle principal |
|---|---|---|
| **Contenu & Tags** | `Publication`, `Commentaire`, `Hashtag`, `Contient_Tag` | Stockage des posts, URLs médias, compteurs et indexation par hashtags |
| **Interactions** | `Like_Publication`, `Like_Commentaire`, `Repartager` | Gestion des likes, dislikes et reposts par utilisateur |
| **Modération** | `Signalement`, `Concerner_Com`, `Bannissement` | Signalements humains et automatiques (IA), suivi des sanctions |
| **Social & Messagerie** | `Groupe`, `Message`, `Appartient_Groupe`, `Recevoir_Msg`, `Reaction_Msg`, `Ami`, `Notification` | Salons de discussion, messages texte/vocaux, réactions, amis et alertes |

### Script SQL complet de création (DDL)
```sql
-- =====================================================================
-- TABLE PIVOT (Lien avec la BDD Utilisateurs gérée par Thomas)
-- =====================================================================
CREATE TABLE Utilisateur(
   id_utilisateur INTEGER PRIMARY KEY AUTOINCREMENT,
   prenom VARCHAR(50),
   nom VARCHAR(50),
   pseudonyme VARCHAR(50),
   email VARCHAR(100),
   mot_de_passe VARCHAR(255),
   nombre_de_signalement INT DEFAULT 0,
   nombre_de_bannissement INT DEFAULT 0,
   role VARCHAR(20) DEFAULT 'user'
);

-- =====================================================================
-- 1. PUBLICATIONS, COMMENTAIRES ET HASHTAGS
-- =====================================================================
CREATE TABLE Publication(
   id_publication INTEGER PRIMARY KEY AUTOINCREMENT,
   texte_description TEXT,
   url_photo TEXT,
   url_video TEXT,
   date_publication DATETIME,
   est_public BOOLEAN DEFAULT 1,
   nombre_like INT DEFAULT 0,
   nombre_dislike INT DEFAULT 0,
   nombre_repost INT DEFAULT 0,
   nombre_signalement INT DEFAULT 0,
   est_cacher BOOLEAN DEFAULT 0,
   est_supprimer BOOLEAN DEFAULT 0,
   id_utilisateur INT NOT NULL,
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE Commentaire(
   id_commentaire INTEGER PRIMARY KEY AUTOINCREMENT,
   contenu TEXT,
   date_commentaire DATETIME,
   nombre_like INT DEFAULT 0,
   nombre_dislike INT DEFAULT 0,
   nombre_repost INT DEFAULT 0,
   nombre_report INT DEFAULT 0,
   id_publication INT NOT NULL,
   id_utilisateur INT NOT NULL,
   FOREIGN KEY(id_publication) REFERENCES Publication(id_publication),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE Hashtag(
   id_hashtag INTEGER PRIMARY KEY AUTOINCREMENT,
   nom_hashtag VARCHAR(50)
);

CREATE TABLE Contient_Tag(
   id_publication INT,
   id_hashtag INT,
   PRIMARY KEY(id_publication, id_hashtag),
   FOREIGN KEY(id_publication) REFERENCES Publication(id_publication),
   FOREIGN KEY(id_hashtag) REFERENCES Hashtag(id_hashtag)
);

-- =====================================================================
-- 2. INTERACTIONS (LIKES, DISLIKES, REPOSTS)
-- =====================================================================
CREATE TABLE Like_Publication(
   id_utilisateur INT,
   id_publication INT,
   est_un_like BOOLEAN DEFAULT 1,
   PRIMARY KEY(id_utilisateur, id_publication),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur),
   FOREIGN KEY(id_publication) REFERENCES Publication(id_publication)
);

CREATE TABLE Like_Commentaire(
   id_utilisateur INT,
   id_commentaire INT,
   est_un_like BOOLEAN DEFAULT 1,
   PRIMARY KEY(id_utilisateur, id_commentaire),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur),
   FOREIGN KEY(id_commentaire) REFERENCES Commentaire(id_commentaire)
);

CREATE TABLE Repartager(
   id_utilisateur INT,
   id_publication INT,
   date_partage DATETIME,
   PRIMARY KEY(id_utilisateur, id_publication),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur),
   FOREIGN KEY(id_publication) REFERENCES Publication(id_publication)
);

-- =====================================================================
-- 3. MODÉRATION : SIGNALEMENTS ET BANNISSEMENTS
-- =====================================================================
CREATE TABLE Signalement(
   id_signalement INTEGER PRIMARY KEY AUTOINCREMENT,
   motif VARCHAR(255),
   statut VARCHAR(50) DEFAULT 'En attente',
   est_automatique BOOLEAN DEFAULT 0,
   date_signalement DATETIME,
   id_publication INT NULL,
   id_utilisateur INT NULL,
   FOREIGN KEY(id_publication) REFERENCES Publication(id_publication),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE Concerner_Com(
   id_commentaire INT,
   id_signalement INT,
   PRIMARY KEY(id_commentaire, id_signalement),
   FOREIGN KEY(id_commentaire) REFERENCES Commentaire(id_commentaire),
   FOREIGN KEY(id_signalement) REFERENCES Signalement(id_signalement)
);

CREATE TABLE Bannissement(
   id_bannissement INTEGER PRIMARY KEY AUTOINCREMENT,
   motif VARCHAR(255),
   duree_jour INT,
   est_definitif BOOLEAN DEFAULT 0,
   date_debut DATETIME,
   id_utilisateur INT NOT NULL,
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
);

-- =====================================================================
-- 4. MESSAGERIE, GROUPES, AMIS ET NOTIFICATIONS
-- =====================================================================
CREATE TABLE Groupe(
   id_groupe INTEGER PRIMARY KEY AUTOINCREMENT,
   nom_groupe VARCHAR(100),
   date_creation DATETIME
);

CREATE TABLE Message(
   id_message INTEGER PRIMARY KEY AUTOINCREMENT,
   contenu_message TEXT,
   url_vocal TEXT,
   date_envoie DATETIME,
   id_expediteur INT NOT NULL,
   id_groupe INT NOT NULL,
   FOREIGN KEY(id_expediteur) REFERENCES Utilisateur(id_utilisateur),
   FOREIGN KEY(id_groupe) REFERENCES Groupe(id_groupe)
);

CREATE TABLE Appartient_Groupe(
   id_utilisateur INT,
   id_groupe INT,
   PRIMARY KEY(id_utilisateur, id_groupe),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur),
   FOREIGN KEY(id_groupe) REFERENCES Groupe(id_groupe)
);

CREATE TABLE Recevoir_Msg(
   id_utilisateur INT,
   id_message INT,
   est_lu BOOLEAN DEFAULT 0,
   date_lecture DATETIME,
   PRIMARY KEY(id_utilisateur, id_message),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur),
   FOREIGN KEY(id_message) REFERENCES Message(id_message)
);

CREATE TABLE Reaction_Msg(
   id_utilisateur INT,
   id_message INT,
   type_reaction VARCHAR(50),
   date_reaction DATETIME,
   PRIMARY KEY(id_utilisateur, id_message),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur),
   FOREIGN KEY(id_message) REFERENCES Message(id_message)
);

CREATE TABLE Ami(
   id_ami INTEGER PRIMARY KEY AUTOINCREMENT,
   statut VARCHAR(50),
   date_creation DATETIME,
   id_demandeur INT NOT NULL,
   id_receveur INT NOT NULL,
   FOREIGN KEY(id_demandeur) REFERENCES Utilisateur(id_utilisateur),
   FOREIGN KEY(id_receveur) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE Notification(
   id_notification INTEGER PRIMARY KEY AUTOINCREMENT,
   libelle VARCHAR(255),
   est_lu BOOLEAN DEFAULT 0,
   id_utilisateur INT NOT NULL,
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
);
```

---

## 3. Initialisation des bases

### Étape 1 : Création de la structure vierge

Depuis la racine du projet dans un terminal WSL, exécutez les commandes suivantes pour créer le fichier SQLite et importer le schéma des tables :

```bash
mkdir -p backend/database
sqlite3 backend/database/media_moderation.sqlite < backend/database/schema_media_moderation.sql
```

### Étape 2 : Activation de l'intégrité référentielle

Sous SQLite, la vérification des clés étrangères (`FOREIGN KEY`) est désactivée par défaut à chaque ouverture de connexion. Le back-end exécute systématiquement la directive suivante lors de l'initialisation de la connexion :

```sql
PRAGMA foreign_keys = ON;
```

### Étape 3 : Injection du jeu d'essai (Optionnel — Tests & Évaluation)

:::tip Données de démonstration
Pour tester rapidement les fonctionnalités (fil d'actualité, médias UUID, compteurs de likes/dislikes synchronisés, soft-delete et signalements humains/IA) sans partir d'une base vierge, exécutez le script ci-dessous **après** l'insertion des 5 utilisateurs de test (`id_utilisateur` de `1` à `5`).
:::

<details>
<summary>Afficher le script SQL du jeu d'essai (INSERT INTO)</summary>

```sql
-- 1. Publications 
INSERT INTO Publication (texte_description, url_photo, url_video, date_publication, est_public, nombre_like, nombre_dislike, nombre_repost, nombre_signalement, est_cacher, est_supprimer, id_utilisateur) VALUES
('Premier partage sur LifeInvader, le réseau social officiel de Los Santos !', 'https://api.lifeinvader.com/uploads/images/1a2b3c4d-5e6f-7a8b-9c0d.jpg', NULL, '2026-05-02 11:20:00', 1, 2, 0, 1, 0, 0, 0, 1),
('Journée calme et studieuse à l''auberge Amagi, le service géré par Yukiko est toujours au top.', 'https://api.lifeinvader.com/uploads/images/2b3c4d5e-6f7a-8b9c-0d1e.jpg', NULL, '2026-05-06 08:00:00', 1, 0, 0, 0, 0, 0, 0, 2),
('On attend toujours Steel Ball Run en anime dans de bonnes conditions sur la plateforme...', 'https://api.lifeinvader.com/uploads/images/3c4d5e6f-7a8b-9c0d-1e2f.jpg', NULL, '2026-06-11 19:45:00', 1, 1, 1, 1, 1, 0, 0, 3),
('Petite création de canon plasma pour contrer les crises de colère de Bakugo en cours de soutien.', 'https://api.lifeinvader.com/uploads/images/4d5e6f7a-8b9c-0d1e-2f3a.jpg', NULL, '2026-08-15 14:10:00', 1, 3, 0, 0, 0, 0, 0, 4),
('C''est un scandale absolu ! La politique de PlayStation pour 2028 signe la mort du jeu physique. Refusons le tout dématérialisé !', NULL, 'https://api.lifeinvader.com/uploads/videos/5e6f7a8b-9c0d-1e2f-3a4b.mp4', '2026-09-14 16:15:00', 1, 0, 3, 0, 0, 0, 1, 3),
('Opération d''exploration du Tartare prévue ce soir. Préparez vos Evokers.', 'https://api.lifeinvader.com/uploads/images/6f7a8b9c-0d1e-2f3a-4b5c.jpg', NULL, '2026-09-15 08:00:00', 1, 1, 0, 0, 0, 0, 0, 5);

-- 2. Likes / Dislikes (est_un_like : 1 = Like, 0 = Dislike)
INSERT INTO Like_Publication (id_utilisateur, id_publication, est_un_like) VALUES
(2, 1, 1),
(3, 1, 1),
(4, 3, 1),
(1, 3, 0),
(1, 4, 1),
(2, 4, 1), 
(5, 4, 1),
(1, 5, 0),
(2, 5, 0),
(4, 5, 0),
(2, 6, 1);

-- 3. Hashtags et liaisons
--- Insert pour la table Hashtag ---
INSERT INTO Hashtag (nom_hashtag) VALUES
('LosSantos'),
('AmagiInn'),
('SteelBallRunAnime'),
('CreationAlter'),
('NoDiskNoPlaystation'),
('KeybladeMaster');

INSERT INTO Contient_Tag (id_publication, id_hashtag) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5);

-- 4. Signalements (Humain vs IA)
INSERT INTO Signalement (motif, statut, date_signalement, est_automatique, id_utilisateur, id_publication) VALUES 
('Spam abusif dans les commentaires', 'En attente', '2026-09-15 14:30:00', 0, 1, 3),
('[ALERTE IA] Détection de contenu explicite/nudité', 'En attente', '2026-09-16 09:45:00', 1, NULL, 5),
('Usurpation d identité', 'Traité', '2026-09-10 11:20:00', 0, 4, 2);
```

</details>
