CREATE TABLE Utilisateur(
   id_utilisateur INT AUTO_INCREMENT,
   prenom VARCHAR(50),
   nom VARCHAR(50),
   pseudonyme VARCHAR(50),
   email VARCHAR(100),
   mot_de_passe VARCHAR(255),
   nombre_de_signalement INT DEFAULT 0,
   nombre_de_bannisement INT DEFAULT 0,
   PRIMARY KEY(id_utilisateur)
);

CREATE TABLE Publication(
   id_publication INT AUTO_INCREMENT,
   texte_description TEXT,
   nom_fichier_photo VARCHAR(255),
   nom_fichier_video VARCHAR(255),
   date_publication DATETIME,
   est_public BOOLEAN,
   nombre_like INT DEFAULT 0,
   nombre_repost INT DEFAULT 0,
   nombre_signalement INT DEFAULT 0,
   id_utilisateur INT NOT NULL,
   PRIMARY KEY(id_publication),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE Commentaire(
   id_commentaire INT AUTO_INCREMENT,
   contenue TEXT,
   date_commentaire DATETIME,
   nombre_like INT DEFAULT 0,
   nombre_dislike INT DEFAULT 0,
   nombre_repost INT DEFAULT 0,
   nombre_report INT DEFAULT 0,
   id_publication INT NOT NULL,
   id_utilisateur INT NOT NULL,
   PRIMARY KEY(id_commentaire),
   FOREIGN KEY(id_publication) REFERENCES Publication(id_publication),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE Hashtag(
   id_hashtag INT AUTO_INCREMENT,
   nom_hashtag VARCHAR(50),
   PRIMARY KEY(id_hashtag)
);

CREATE TABLE Signalement(
   id_signalement INT AUTO_INCREMENT,
   motif VARCHAR(255),
   statut VARCHAR(50),
   date_signalement DATETIME,
   id_publication INT,
   id_utilisateur INT NOT NULL,
   PRIMARY KEY(id_signalement),
   FOREIGN KEY(id_publication) REFERENCES Publication(id_publication),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE Bannissement(
   id_bannisement INT AUTO_INCREMENT,
   motif VARCHAR(255),
   duree_jour INT,
   est_definitif BOOLEAN,
   date_debut DATETIME,
   id_utilisateur INT NOT NULL,
   PRIMARY KEY(id_bannisement),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE Groupe(
   id_groupe INT AUTO_INCREMENT,
   nom_groupe VARCHAR(100),
   date_creation DATETIME,
   PRIMARY KEY(id_groupe)
);

CREATE TABLE Message(
   id_message INT AUTO_INCREMENT,
   contenu_message TEXT,
   date_envoie DATETIME,
   id_expediteur INT NOT NULL,
   id_groupe INT NOT NULL,
   PRIMARY KEY(id_message),
   FOREIGN KEY(id_expediteur) REFERENCES Utilisateur(id_utilisateur),
   FOREIGN KEY(id_groupe) REFERENCES Groupe(id_groupe)
);

CREATE TABLE Notification(
   id_notification INT AUTO_INCREMENT,
   libelle VARCHAR(255),
   est_lu BOOLEAN DEFAULT FALSE,
   id_utilisateur INT NOT NULL,
   PRIMARY KEY(id_notification),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE Ami(
   id_ami INT AUTO_INCREMENT,
   statut VARCHAR(50),
   date_creation DATETIME,
   id_demandeur INT NOT NULL,
   id_receveur INT NOT NULL,
   PRIMARY KEY(id_ami),
   FOREIGN KEY(id_demandeur) REFERENCES Utilisateur(id_utilisateur),
   FOREIGN KEY(id_receveur) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE Like_Publication(
   id_utilisateur INT,
   id_publication INT,
   est_un_like BOOLEAN,
   PRIMARY KEY(id_utilisateur, id_publication),
   FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur),
   FOREIGN KEY(id_publication) REFERENCES Publication(id_publication)
);

CREATE TABLE Like_Commentaire(
   id_utilisateur INT,
   id_commentaire INT,
   est_un_like BOOLEAN,
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
   est_lu BOOLEAN DEFAULT FALSE,
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

