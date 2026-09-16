-- Mise à niveau du schéma pour l'intégration front-end InstaClone.
-- À exécuter dans MariaDB (base PhotoVideo) :
--   mysql -u root -p PhotoVideo < schema-upgrade.sql
--
-- Ajoute les colonnes utilisées par le front mais absentes du schéma
-- initial : biographie et photo de profil (URL ou data URL base64).

USE PhotoVideo;

ALTER TABLE Utilisateur ADD COLUMN IF NOT EXISTS bio MEDIUMTEXT;

ALTER TABLE Utilisateur ADD COLUMN IF NOT EXISTS photo_profil MEDIUMTEXT;
