-- Migration : genre du profil + option de visibilité.
-- À exécuter UNE fois sur une base PhotoVideo déjà importée :
--   mysql -u root -p PhotoVideo < database/migration-genre-visibilite.sql
-- (Le serveur backend-api applique aussi ces ajouts tout seul au démarrage ;
--  ce script sert si vous préférez migrer à la main. Il est idempotent.)

ALTER TABLE Utilisateur ADD COLUMN IF NOT EXISTS genre VARCHAR(10) DEFAULT NULL;
ALTER TABLE Utilisateur ADD COLUMN IF NOT EXISTS afficher_genre TINYINT(1) NOT NULL DEFAULT 0;
