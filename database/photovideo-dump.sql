/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.6-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: PhotoVideo
-- ------------------------------------------------------
-- Server version	11.8.6-MariaDB-0+deb13u1 from Debian

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Current Database: `PhotoVideo`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `PhotoVideo` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;

USE `PhotoVideo`;

--
-- Table structure for table `Ami`
--

DROP TABLE IF EXISTS `Ami`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Ami` (
  `id_ami` int(11) NOT NULL AUTO_INCREMENT,
  `statut` varchar(50) DEFAULT NULL,
  `date_creation` datetime DEFAULT NULL,
  `id_demandeur` int(11) NOT NULL,
  `id_receveur` int(11) NOT NULL,
  PRIMARY KEY (`id_ami`),
  KEY `id_demandeur` (`id_demandeur`),
  KEY `id_receveur` (`id_receveur`),
  CONSTRAINT `Ami_ibfk_1` FOREIGN KEY (`id_demandeur`) REFERENCES `Utilisateur` (`id_utilisateur`),
  CONSTRAINT `Ami_ibfk_2` FOREIGN KEY (`id_receveur`) REFERENCES `Utilisateur` (`id_utilisateur`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Ami`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Ami` WRITE;
/*!40000 ALTER TABLE `Ami` DISABLE KEYS */;
INSERT INTO `Ami` VALUES
(1,'accepte','2026-05-03 15:00:00',1,2),
(2,'accepte','2026-05-07 10:11:00',2,4),
(3,'en_attente','2026-06-12 11:00:00',3,1);
/*!40000 ALTER TABLE `Ami` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Appartient_Groupe`
--

DROP TABLE IF EXISTS `Appartient_Groupe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Appartient_Groupe` (
  `id_utilisateur` int(11) NOT NULL,
  `id_groupe` int(11) NOT NULL,
  PRIMARY KEY (`id_utilisateur`,`id_groupe`),
  KEY `id_groupe` (`id_groupe`),
  CONSTRAINT `Appartient_Groupe_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `Utilisateur` (`id_utilisateur`),
  CONSTRAINT `Appartient_Groupe_ibfk_2` FOREIGN KEY (`id_groupe`) REFERENCES `Groupe` (`id_groupe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Appartient_Groupe`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Appartient_Groupe` WRITE;
/*!40000 ALTER TABLE `Appartient_Groupe` DISABLE KEYS */;
INSERT INTO `Appartient_Groupe` VALUES
(1,1),
(2,2),
(3,3),
(4,5),
(5,6);
/*!40000 ALTER TABLE `Appartient_Groupe` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Bannissement`
--

DROP TABLE IF EXISTS `Bannissement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Bannissement` (
  `id_bannissement` int(11) NOT NULL AUTO_INCREMENT,
  `motif` varchar(255) DEFAULT NULL,
  `duree_jour` int(11) DEFAULT NULL,
  `est_definitif` tinyint(1) DEFAULT 0,
  `date_debut` datetime DEFAULT NULL,
  `id_utilisateur` int(11) NOT NULL,
  PRIMARY KEY (`id_bannissement`),
  KEY `id_utilisateur` (`id_utilisateur`),
  CONSTRAINT `Bannissement_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `Utilisateur` (`id_utilisateur`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Bannissement`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Bannissement` WRITE;
/*!40000 ALTER TABLE `Bannissement` DISABLE KEYS */;
INSERT INTO `Bannissement` VALUES
(1,'Agressivité répétée dans les commentaires',3,0,'2026-06-12 10:00:00',3);
/*!40000 ALTER TABLE `Bannissement` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Commentaire`
--

DROP TABLE IF EXISTS `Commentaire`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Commentaire` (
  `id_commentaire` int(11) NOT NULL AUTO_INCREMENT,
  `contenu` text DEFAULT NULL,
  `date_commentaire` datetime DEFAULT NULL,
  `nombre_like` int(11) DEFAULT 0,
  `nombre_dislike` int(11) DEFAULT 0,
  `nombre_repost` int(11) DEFAULT 0,
  `nombre_report` int(11) DEFAULT 0,
  `id_publication` int(11) NOT NULL,
  `id_utilisateur` int(11) NOT NULL,
  PRIMARY KEY (`id_commentaire`),
  KEY `id_publication` (`id_publication`),
  KEY `id_utilisateur` (`id_utilisateur`),
  CONSTRAINT `Commentaire_ibfk_1` FOREIGN KEY (`id_publication`) REFERENCES `Publication` (`id_publication`),
  CONSTRAINT `Commentaire_ibfk_2` FOREIGN KEY (`id_utilisateur`) REFERENCES `Utilisateur` (`id_utilisateur`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Commentaire`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Commentaire` WRITE;
/*!40000 ALTER TABLE `Commentaire` DISABLE KEYS */;
INSERT INTO `Commentaire` VALUES
(1,'Incroyable ce cliché sur LifeInvader !','2026-05-02 12:00:00',0,0,0,0,1,2),
(2,'Yukiko gère cet établissement d\'une main de maître.','2026-05-06 09:30:00',1,0,0,0,2,1),
(3,'Leur gestion des plannings de diffusion sur la partie 7 est un véritable sketch.','2026-06-11 20:15:00',0,0,0,1,3,4),
(4,'Le plan tactique de Momo est validé à 100%.','2026-08-15 15:00:00',1,0,0,0,4,3);
/*!40000 ALTER TABLE `Commentaire` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Concerner_Com`
--

DROP TABLE IF EXISTS `Concerner_Com`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Concerner_Com` (
  `id_commentaire` int(11) NOT NULL,
  `id_signalement` int(11) NOT NULL,
  PRIMARY KEY (`id_commentaire`,`id_signalement`),
  KEY `id_signalement` (`id_signalement`),
  CONSTRAINT `Concerner_Com_ibfk_1` FOREIGN KEY (`id_commentaire`) REFERENCES `Commentaire` (`id_commentaire`),
  CONSTRAINT `Concerner_Com_ibfk_2` FOREIGN KEY (`id_signalement`) REFERENCES `Signalement` (`id_signalement`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Concerner_Com`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Concerner_Com` WRITE;
/*!40000 ALTER TABLE `Concerner_Com` DISABLE KEYS */;
INSERT INTO `Concerner_Com` VALUES
(3,1);
/*!40000 ALTER TABLE `Concerner_Com` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Contient_Tag`
--

DROP TABLE IF EXISTS `Contient_Tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Contient_Tag` (
  `id_publication` int(11) NOT NULL,
  `id_hashtag` int(11) NOT NULL,
  PRIMARY KEY (`id_publication`,`id_hashtag`),
  KEY `id_hashtag` (`id_hashtag`),
  CONSTRAINT `Contient_Tag_ibfk_1` FOREIGN KEY (`id_publication`) REFERENCES `Publication` (`id_publication`),
  CONSTRAINT `Contient_Tag_ibfk_2` FOREIGN KEY (`id_hashtag`) REFERENCES `Hashtag` (`id_hashtag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Contient_Tag`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Contient_Tag` WRITE;
/*!40000 ALTER TABLE `Contient_Tag` DISABLE KEYS */;
INSERT INTO `Contient_Tag` VALUES
(1,1),
(2,2),
(3,3),
(4,4),
(5,5);
/*!40000 ALTER TABLE `Contient_Tag` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Groupe`
--

DROP TABLE IF EXISTS `Groupe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Groupe` (
  `id_groupe` int(11) NOT NULL AUTO_INCREMENT,
  `nom_groupe` varchar(100) DEFAULT NULL,
  `date_creation` datetime DEFAULT NULL,
  PRIMARY KEY (`id_groupe`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Groupe`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Groupe` WRITE;
/*!40000 ALTER TABLE `Groupe` DISABLE KEYS */;
INSERT INTO `Groupe` VALUES
(1,'Phantom Thieves','2026-05-01 10:00:00'),
(2,'Amagi Inn Fanclub (Yukiko Best Manager)','2026-05-05 14:30:00'),
(3,'Netflix Jail SBR Part 7 - Merci pour le découpage catastrophique','2026-06-10 18:00:00'),
(4,'Kingdom Hearts - Keyblade & Organization XIII','2026-07-01 09:15:00'),
(5,'Bakugo Explosions & Momo Yayorozu Strategy','2026-08-12 20:45:00'),
(6,'S.E.E.S (Specialized Extracurricular Execution Squad)','2026-09-15 00:00:00');
/*!40000 ALTER TABLE `Groupe` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Hashtag`
--

DROP TABLE IF EXISTS `Hashtag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Hashtag` (
  `id_hashtag` int(11) NOT NULL AUTO_INCREMENT,
  `nom_hashtag` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_hashtag`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Hashtag`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Hashtag` WRITE;
/*!40000 ALTER TABLE `Hashtag` DISABLE KEYS */;
INSERT INTO `Hashtag` VALUES
(1,'LosSantos'),
(2,'AmagiInn'),
(3,'SteelBallRunAnime'),
(4,'CreationAlter'),
(5,'NoDiskNoPlaystation'),
(6,'KeybladeMaster');
/*!40000 ALTER TABLE `Hashtag` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Like_Commentaire`
--

DROP TABLE IF EXISTS `Like_Commentaire`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Like_Commentaire` (
  `id_utilisateur` int(11) NOT NULL,
  `id_commentaire` int(11) NOT NULL,
  `est_un_like` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_utilisateur`,`id_commentaire`),
  KEY `id_commentaire` (`id_commentaire`),
  CONSTRAINT `Like_Commentaire_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `Utilisateur` (`id_utilisateur`),
  CONSTRAINT `Like_Commentaire_ibfk_2` FOREIGN KEY (`id_commentaire`) REFERENCES `Commentaire` (`id_commentaire`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Like_Commentaire`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Like_Commentaire` WRITE;
/*!40000 ALTER TABLE `Like_Commentaire` DISABLE KEYS */;
INSERT INTO `Like_Commentaire` VALUES
(1,2,1),
(2,4,1);
/*!40000 ALTER TABLE `Like_Commentaire` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Like_Publication`
--

DROP TABLE IF EXISTS `Like_Publication`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Like_Publication` (
  `id_utilisateur` int(11) NOT NULL,
  `id_publication` int(11) NOT NULL,
  `est_un_like` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_utilisateur`,`id_publication`),
  KEY `id_publication` (`id_publication`),
  CONSTRAINT `Like_Publication_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `Utilisateur` (`id_utilisateur`),
  CONSTRAINT `Like_Publication_ibfk_2` FOREIGN KEY (`id_publication`) REFERENCES `Publication` (`id_publication`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Like_Publication`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Like_Publication` WRITE;
/*!40000 ALTER TABLE `Like_Publication` DISABLE KEYS */;
INSERT INTO `Like_Publication` VALUES
(1,2,1),
(2,1,1),
(3,4,1),
(4,3,1);
/*!40000 ALTER TABLE `Like_Publication` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Message`
--

DROP TABLE IF EXISTS `Message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Message` (
  `id_message` int(11) NOT NULL AUTO_INCREMENT,
  `contenu_message` text DEFAULT NULL,
  `url_vocal` varchar(255) DEFAULT NULL,
  `date_envoie` datetime DEFAULT NULL,
  `id_expediteur` int(11) NOT NULL,
  `id_groupe` int(11) NOT NULL,
  PRIMARY KEY (`id_message`),
  KEY `id_expediteur` (`id_expediteur`),
  KEY `id_groupe` (`id_groupe`),
  CONSTRAINT `Message_ibfk_1` FOREIGN KEY (`id_expediteur`) REFERENCES `Utilisateur` (`id_utilisateur`),
  CONSTRAINT `Message_ibfk_2` FOREIGN KEY (`id_groupe`) REFERENCES `Groupe` (`id_groupe`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Message`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Message` WRITE;
/*!40000 ALTER TABLE `Message` DISABLE KEYS */;
INSERT INTO `Message` VALUES
(1,'On lance l\'infiltration du palais ce soir ?',NULL,'2026-05-02 18:30:00',1,1),
(2,'Les réservations de l\'auberge sont complètes pour cet été !',NULL,'2026-05-10 09:00:00',2,2),
(3,'Quelqu\'un a des nouvelles d\'une vraie adaptation animée pour Gyro et Johnny ?',NULL,'2026-06-15 21:00:00',3,3),
(4,'J\'ai analysé l\'alter de Bakugo, on peut optimiser ses gantelets.',NULL,'2026-08-16 10:30:00',4,5),
(5,'Briefing opérationnel : Rendez-vous au dortoir Iwatodai ce soir.','briefing_sees_septembre.mp3','2026-09-15 10:00:00',5,6);
/*!40000 ALTER TABLE `Message` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Notification`
--

DROP TABLE IF EXISTS `Notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notification` (
  `id_notification` int(11) NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) DEFAULT NULL,
  `est_lu` tinyint(1) DEFAULT 0,
  `id_utilisateur` int(11) NOT NULL,
  PRIMARY KEY (`id_notification`),
  KEY `id_utilisateur` (`id_utilisateur`),
  CONSTRAINT `Notification_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `Utilisateur` (`id_utilisateur`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notification`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Notification` WRITE;
/*!40000 ALTER TABLE `Notification` DISABLE KEYS */;
INSERT INTO `Notification` VALUES
(1,'PhantomJoker a aimé votre publication',0,2),
(2,'MomoCreation a rejoint votre groupe',1,4),
(3,'L\'administratrice Mitsuru a modéré votre post sur PlayStation',0,3);
/*!40000 ALTER TABLE `Notification` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Publication`
--

DROP TABLE IF EXISTS `Publication`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Publication` (
  `id_publication` int(11) NOT NULL AUTO_INCREMENT,
  `texte_description` text DEFAULT NULL,
  `nom_fichier_photo` varchar(255) DEFAULT NULL,
  `nom_fichier_video` varchar(255) DEFAULT NULL,
  `date_publication` datetime DEFAULT NULL,
  `est_public` tinyint(1) DEFAULT 1,
  `nombre_like` int(11) DEFAULT 0,
  `nombre_repost` int(11) DEFAULT 0,
  `nombre_signalement` int(11) DEFAULT 0,
  `est_cacher` tinyint(1) DEFAULT 0,
  `est_supprimer` tinyint(1) DEFAULT 0,
  `id_utilisateur` int(11) NOT NULL,
  PRIMARY KEY (`id_publication`),
  KEY `id_utilisateur` (`id_utilisateur`),
  CONSTRAINT `Publication_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `Utilisateur` (`id_utilisateur`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Publication`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Publication` WRITE;
/*!40000 ALTER TABLE `Publication` DISABLE KEYS */;
INSERT INTO `Publication` VALUES
(1,'Premier partage sur LifeInvader, le réseau social officiel de Los Santos !','lifeinvader_post1.jpg',NULL,'2026-05-02 11:20:00',1,1,1,0,0,0,1),
(2,'Journée calme et studieuse à l\'auberge Amagi, le service géré par Yukiko est toujours au top.','amagi_inn.jpg',NULL,'2026-05-06 08:00:00',1,1,0,0,0,0,2),
(3,'On attend toujours Steel Ball Run en anime dans de bonnes conditions sur la plateforme...','sbr_netflix.jpg',NULL,'2026-06-11 19:45:00',1,1,1,1,0,0,3),
(4,'Petite création de canon plasma pour contrer les crises de colère de Bakugo en cours de soutien.','momo_mha.jpg',NULL,'2026-08-15 14:10:00',1,1,0,0,0,0,4),
(5,'C\'est un scandale absolu ! La politique de PlayStation pour 2028 signe la mort du jeu physique. Refusons le tout dématérialisé !',NULL,'nodisk_rant.mp4','2026-09-14 16:15:00',1,0,0,0,0,1,3),
(6,'Opération d\'exploration du Tartare prévue ce soir. Préparez vos Evokers.','tartarus_gate.jpg',NULL,'2026-09-15 08:00:00',1,0,0,0,0,0,5);
/*!40000 ALTER TABLE `Publication` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Reaction_Msg`
--

DROP TABLE IF EXISTS `Reaction_Msg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Reaction_Msg` (
  `id_utilisateur` int(11) NOT NULL,
  `id_message` int(11) NOT NULL,
  `type_reaction` varchar(50) DEFAULT NULL,
  `date_reaction` datetime DEFAULT NULL,
  PRIMARY KEY (`id_utilisateur`,`id_message`),
  KEY `id_message` (`id_message`),
  CONSTRAINT `Reaction_Msg_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `Utilisateur` (`id_utilisateur`),
  CONSTRAINT `Reaction_Msg_ibfk_2` FOREIGN KEY (`id_message`) REFERENCES `Message` (`id_message`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Reaction_Msg`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Reaction_Msg` WRITE;
/*!40000 ALTER TABLE `Reaction_Msg` DISABLE KEYS */;
INSERT INTO `Reaction_Msg` VALUES
(1,2,'coeur','2026-05-10 09:10:00'),
(4,1,'pouce_haut','2026-05-02 18:35:00');
/*!40000 ALTER TABLE `Reaction_Msg` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Recevoir_Msg`
--

DROP TABLE IF EXISTS `Recevoir_Msg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Recevoir_Msg` (
  `id_utilisateur` int(11) NOT NULL,
  `id_message` int(11) NOT NULL,
  `est_lu` tinyint(1) DEFAULT 0,
  `date_lecture` datetime DEFAULT NULL,
  PRIMARY KEY (`id_utilisateur`,`id_message`),
  KEY `id_message` (`id_message`),
  CONSTRAINT `Recevoir_Msg_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `Utilisateur` (`id_utilisateur`),
  CONSTRAINT `Recevoir_Msg_ibfk_2` FOREIGN KEY (`id_message`) REFERENCES `Message` (`id_message`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Recevoir_Msg`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Recevoir_Msg` WRITE;
/*!40000 ALTER TABLE `Recevoir_Msg` DISABLE KEYS */;
INSERT INTO `Recevoir_Msg` VALUES
(1,1,1,'2026-05-02 18:31:00'),
(2,2,1,'2026-05-10 09:05:00'),
(3,3,0,NULL);
/*!40000 ALTER TABLE `Recevoir_Msg` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Repartager`
--

DROP TABLE IF EXISTS `Repartager`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Repartager` (
  `id_utilisateur` int(11) NOT NULL,
  `id_publication` int(11) NOT NULL,
  `date_partage` datetime DEFAULT NULL,
  PRIMARY KEY (`id_utilisateur`,`id_publication`),
  KEY `id_publication` (`id_publication`),
  CONSTRAINT `Repartager_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `Utilisateur` (`id_utilisateur`),
  CONSTRAINT `Repartager_ibfk_2` FOREIGN KEY (`id_publication`) REFERENCES `Publication` (`id_publication`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Repartager`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Repartager` WRITE;
/*!40000 ALTER TABLE `Repartager` DISABLE KEYS */;
INSERT INTO `Repartager` VALUES
(1,3,'2026-06-12 08:15:00'),
(3,1,'2026-05-03 14:20:00');
/*!40000 ALTER TABLE `Repartager` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Signalement`
--

DROP TABLE IF EXISTS `Signalement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Signalement` (
  `id_signalement` int(11) NOT NULL AUTO_INCREMENT,
  `motif` varchar(255) DEFAULT NULL,
  `statut` varchar(50) DEFAULT 'En attente',
  `est_automatique` tinyint(1) DEFAULT 0,
  `date_signalement` datetime DEFAULT NULL,
  `id_publication` int(11) NOT NULL,
  `id_utilisateur` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_signalement`),
  KEY `id_publication` (`id_publication`),
  KEY `id_utilisateur` (`id_utilisateur`),
  CONSTRAINT `Signalement_ibfk_1` FOREIGN KEY (`id_publication`) REFERENCES `Publication` (`id_publication`),
  CONSTRAINT `Signalement_ibfk_2` FOREIGN KEY (`id_utilisateur`) REFERENCES `Utilisateur` (`id_utilisateur`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Signalement`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Signalement` WRITE;
/*!40000 ALTER TABLE `Signalement` DISABLE KEYS */;
INSERT INTO `Signalement` VALUES
(1,'Spam abusif dans les commentaires','En attente',0,'2026-09-15 14:30:00',3,1),
(2,'[ALERTE IA] Détection de contenu explicite/nudité','En attente',1,'2026-09-16 09:45:00',5,NULL),
(3,'Usurpation d identité','Traité',0,'2026-09-10 11:20:00',2,4);
/*!40000 ALTER TABLE `Signalement` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Utilisateur`
--

DROP TABLE IF EXISTS `Utilisateur`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Utilisateur` (
  `id_utilisateur` int(11) NOT NULL AUTO_INCREMENT,
  `prenom` varchar(50) DEFAULT NULL,
  `nom` varchar(50) DEFAULT NULL,
  `pseudonyme` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `mot_de_passe` varchar(255) DEFAULT NULL,
  `photo_profil` mediumtext DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `nombre_de_signalement` int(11) DEFAULT 0,
  `nombre_de_bannissement` int(11) DEFAULT 0,
  `role` varchar(20) DEFAULT 'user',
  PRIMARY KEY (`id_utilisateur`),
  UNIQUE KEY `pseudonyme` (`pseudonyme`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Utilisateur`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Utilisateur` WRITE;
/*!40000 ALTER TABLE `Utilisateur` DISABLE KEYS */;
INSERT INTO `Utilisateur` VALUES
(1,'Lucas','Martin','PhantomJoker','lucas@mail.com','$2a$10$ac5Gqbr5kYag9XaVmSzkceB30sni.bSf35fmRkCgPWjKIQ7oWqASK',NULL,NULL,0,0,'user'),
(2,'Yukiko','Amagi','YukikoInaba','chloe@mail.com','$2a$10$59OnaMhNHwhcwqewqtMMy.60UvTUIKioQ0FNbp.RkfuKQtTA0Wuvm',NULL,NULL,0,0,'user'),
(3,'Thomas','Dubois','JojoSteelBall','thomas@mail.com','$2a$10$iFufA7kY5nKbmPSQLtGLPuCYKOSbM.g/8stMQjIamVYL2PZ/1buBm',NULL,NULL,0,0,'user'),
(4,'Momo','Yaoyorozu','MomoCreation','sarah@mail.com','$2a$10$3ldNbVKWMKCC8MtENUHu1uNTf4tK2CIdbnl6tKLmmGdu3aQRPUpWG',NULL,NULL,0,0,'user'),
(5,'Mitsuru','Kirijo','Imperatrice','mitsuru.kirijo@gekkoukan.edu','$2a$10$8dkLNMx6AqaPJfd703bar.5gbRq4VkRL4XVGz/xl9/S3C8fhCom5K',NULL,NULL,0,0,'admin');
/*!40000 ALTER TABLE `Utilisateur` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-09-17 14:05:20
