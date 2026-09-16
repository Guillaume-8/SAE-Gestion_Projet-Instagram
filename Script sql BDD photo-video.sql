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

CREATE TABLE Publication(
   id_publication INTEGER PRIMARY KEY AUTOINCREMENT,
   texte_description TEXT,
   nom_fichier_photo VARCHAR(255),
   nom_fichier_video VARCHAR(255),
   date_publication DATETIME,
   est_public BOOLEAN DEFAULT 1,
   nombre_like INT DEFAULT 0,
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

CREATE TABLE Signalement(
   id_signalement INTEGER PRIMARY KEY AUTOINCREMENT,
   motif VARCHAR(255),
   statut VARCHAR(50) DEFAULT 'En attente',
   est_automatique BOOLEAN DEFAULT 0,
   date_signalement DATETIME,
   id_publication INT NULL,
   id_utilisateur INT NOT NULL,
   FOREIGN KEY(id_publication) REFERENCES Publication(id_publication),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
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

CREATE TABLE Groupe(
   id_groupe INTEGER PRIMARY KEY AUTOINCREMENT,
   nom_groupe VARCHAR(100),
   date_creation DATETIME
);

CREATE TABLE Message(
   id_message INTEGER PRIMARY KEY AUTOINCREMENT,
   contenu_message TEXT,
   url_vocal VARCHAR(255) DEFAULT NULL,
   date_envoie DATETIME,
   id_expediteur INT NOT NULL,
   id_groupe INT NOT NULL,
   FOREIGN KEY(id_expediteur) REFERENCES Utilisateur(id_utilisateur),
   FOREIGN KEY(id_groupe) REFERENCES Groupe(id_groupe)
);

CREATE TABLE Notification(
   id_notification INTEGER PRIMARY KEY AUTOINCREMENT,
   libelle VARCHAR(255),
   est_lu BOOLEAN DEFAULT 0,
   id_utilisateur INT NOT NULL,
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
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

CREATE TABLE Contient_Tag(
   id_publication INT,
   id_hashtag INT,
   PRIMARY KEY(id_publication, id_hashtag),
   FOREIGN KEY(id_publication) REFERENCES Publication(id_publication),
   FOREIGN KEY(id_hashtag) REFERENCES Hashtag(id_hashtag)
);

CREATE TABLE Appartient_Groupe(
   id_utilisateur INT,
   id_groupe INT,
   PRIMARY KEY(id_utilisateur, id_groupe),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur),
   FOREIGN KEY(id_groupe) REFERENCES Groupe(id_groupe)
);

CREATE TABLE Concerner_Com(
   id_commentaire INT,
   id_signalement INT,
   PRIMARY KEY(id_commentaire, id_signalement),
   FOREIGN KEY(id_commentaire) REFERENCES Commentaire(id_commentaire),
   FOREIGN KEY(id_signalement) REFERENCES Signalement(id_signalement)
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

