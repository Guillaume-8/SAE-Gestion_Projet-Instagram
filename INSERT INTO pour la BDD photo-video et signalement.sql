--- si vous voulez récupérer les INSERT INTO respecter l'ordre de Utilisateur a Concerner_Com pour eviter les erreur de lient 
--- Insert pour la table Utilisateur ---
INSERT INTO Utilisateur (prenom, nom, pseudonyme, email, mot_de_passe, nombre_de_signalement, nombre_de_bannissement, role) VALUES
('Lucas', 'Martin', 'PhantomJoker', 'lucas@mail.com', '$2y$10$ExempleHashMotDePasse1', 0, 0, 'user'),
('Yukiko', 'Amagi', 'YukikoInaba', 'chloe@mail.com', '$2y$10$ExempleHashMotDePasse2', 0, 0, 'user'),
('Thomas', 'Dubois', 'JojoSteelBall', 'thomas@mail.com', '$2y$10$ExempleHashMotDePasse3', 0, 0, 'user'),
('Momo', 'Yaoyorozu', 'MomoCreation', 'sarah@mail.com', '$2y$10$ExempleHashMotDePasse4', 0, 0, 'user'),
('Mitsuru', 'Kirijo', 'Imperatrice', 'mitsuru.kirijo@gekkoukan.edu', '$2y$10$ExempleHashAdminPass', 0, 0, 'admin');


--- Insert pour la table Groupe ---
INSERT INTO Groupe (nom_groupe, date_creation) VALUES
('Phantom Thieves', '2026-05-01 10:00:00'),
('Amagi Inn Fanclub (Yukiko Best Manager)', '2026-05-05 14:30:00'),
('Netflix Jail SBR Part 7 - Merci pour le découpage catastrophique', '2026-06-10 18:00:00'),
('Kingdom Hearts - Keyblade & Organization XIII', '2026-07-01 09:15:00'),
('Bakugo Explosions & Momo Yayorozu Strategy', '2026-08-12 20:45:00'),
('S.E.E.S (Specialized Extracurricular Execution Squad)', '2026-09-15 00:00:00');

--- Insert pour la table Hashtag ---
INSERT INTO Hashtag (nom_hashtag) VALUES
('LosSantos'),
('AmagiInn'),
('SteelBallRunAnime'),
('CreationAlter'),
('NoDiskNoPlaystation'),
('KeybladeMaster');

--- Insert pour la table Publication ---
INSERT INTO Publication (texte_description, nom_fichier_photo, nom_fichier_video, date_publication, est_public, nombre_like, nombre_repost, nombre_signalement, est_cacher, est_supprimer, id_utilisateur) VALUES
('Premier partage sur LifeInvader, le réseau social officiel de Los Santos !', 'lifeinvader_post1.jpg', NULL, '2026-05-02 11:20:00', 1, 1, 1, 0, 0, 0, 1),
('Journée calme et studieuse à l''auberge Amagi, le service géré par Yukiko est toujours au top.', 'amagi_inn.jpg', NULL, '2026-05-06 08:00:00', 1, 1, 0, 0, 0, 0, 2),
('On attend toujours Steel Ball Run en anime dans de bonnes conditions sur la plateforme...', 'sbr_netflix.jpg', NULL, '2026-06-11 19:45:00', 1, 1, 1, 1, 0, 0, 3),
('Petite création de canon plasma pour contrer les crises de colère de Bakugo en cours de soutien.', 'momo_mha.jpg', NULL, '2026-08-15 14:10:00', 1, 1, 0, 0, 0, 0, 4),
('C''est un scandale absolu ! La politique de PlayStation pour 2028 signe la mort du jeu physique. Refusons le tout dématérialisé !', NULL, 'nodisk_rant.mp4', '2026-09-14 16:15:00', 1, 0, 0, 0, 0, 1, 3),
('Opération d''exploration du Tartare prévue ce soir. Préparez vos Evokers.', 'tartarus_gate.jpg', NULL, '2026-09-15 08:00:00', 1, 0, 0, 0, 0, 0, 5);

--- Insert pour la table Bannissement ---
INSERT INTO Bannissement (motif, duree_jour, est_definitif, date_debut, id_utilisateur) VALUES
('Agressivité répétée dans les commentaires', 3, 0, '2026-06-12 10:00:00', 3);

--- Insert pour la table Notification ---
INSERT INTO Notification (libelle, est_lu, id_utilisateur) VALUES
('PhantomJoker a aimé votre publication', 0, 2),
('MomoCreation a rejoint votre groupe', 1, 4),
('L''administratrice Mitsuru a modéré votre post sur PlayStation', 0, 3);

--- Insert pour la table Ami ---
INSERT INTO Ami (statut, date_creation, id_demandeur, id_receveur) VALUES
('accepte', '2026-05-03 15:00:00', 1, 2),
('accepte', '2026-05-07 10:11:00', 2, 4),
('en_attente', '2026-06-12 11:00:00', 3, 1);

--- Insert pour la table Appartient_Groupe ---
INSERT INTO Appartient_Groupe (id_utilisateur, id_groupe) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 5),
(5, 6);

--- Insert pour la table Commentaire ---
INSERT INTO Commentaire (contenu, date_commentaire, nombre_like, nombre_dislike, nombre_repost, nombre_report, id_publication, id_utilisateur) VALUES
('Incroyable ce cliché sur LifeInvader !', '2026-05-02 12:00:00', 0, 0, 0, 0, 1, 2),
('Yukiko gère cet établissement d''une main de maître.', '2026-05-06 09:30:00', 1, 0, 0, 0, 2, 1),
('Leur gestion des plannings de diffusion sur la partie 7 est un véritable sketch.', '2026-06-11 20:15:00', 0, 0, 0, 1, 3, 4),
('Le plan tactique de Momo est validé à 100%.', '2026-08-15 15:00:00', 1, 0, 0, 0, 4, 3);

--- Insert pour la table Message ---
INSERT INTO Message (contenu_message, url_vocal, date_envoie, id_expediteur, id_groupe) VALUES
('On lance l''infiltration du palais ce soir ?', NULL, '2026-05-02 18:30:00', 1, 1),
('Les réservations de l''auberge sont complètes pour cet été !', NULL, '2026-05-10 09:00:00', 2, 2),
('Quelqu''un a des nouvelles d''une vraie adaptation animée pour Gyro et Johnny ?', NULL, '2026-06-15 21:00:00', 3, 3),
('J''ai analysé l''alter de Bakugo, on peut optimiser ses gantelets.', NULL, '2026-08-16 10:30:00', 4, 5),
('Briefing opérationnel : Rendez-vous au dortoir Iwatodai ce soir.', 'briefing_sees_septembre.mp3', '2026-09-15 10:00:00', 5, 6);


--- Insert pour la table Reaction_Msg ---
INSERT INTO Reaction_Msg (id_utilisateur, id_message, type_reaction, date_reaction) VALUES
(1, 2, 'coeur', '2026-05-10 09:10:00'),
(4, 1, 'pouce_haut', '2026-05-02 18:35:00');

--- Insert pour la table Contient_Tag ---
INSERT INTO Contient_Tag (id_publication, id_hashtag) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5);

--- Insert pour la table Like_Publication ---
INSERT INTO Like_Publication (id_utilisateur, id_publication, est_un_like) VALUES
(2, 1, 1),
(1, 2, 1),
(4, 3, 1),
(3, 4, 1);

--- Insert pour la table Repartager ---
INSERT INTO Repartager (id_utilisateur, id_publication, date_partage) VALUES
(1, 3, '2026-06-12 08:15:00'),
(3, 1, '2026-05-03 14:20:00');

--- Insert pour la table Like_Commentaire ---
INSERT INTO Like_Commentaire (id_utilisateur, id_commentaire, est_un_like) VALUES
(1, 2, 1),
(2, 4, 1);

--- Insert pour la table Recevoir_Msg ---
INSERT INTO Recevoir_Msg (id_utilisateur, id_message, est_lu, date_lecture) VALUES
(1, 1, 1, '2026-05-02 18:31:00'),
(2, 2, 1, '2026-05-10 09:05:00'),
(3, 3, 0, NULL);

--- Insert pour la table Signalement ---
INSERT INTO Signalement (motif, statut, date_signalement, est_automatique, id_utilisateur, id_publication) VALUES 
('Spam abusif dans les commentaires', 'En attente', '2026-09-15 14:30:00', 0, 1, 3),
('[ALERTE IA] Détection de contenu explicite/nudité', 'En attente', '2026-09-16 09:45:00', 1, NULL, 5),
('Usurpation d identité', 'Traité', '2026-09-10 11:20:00', 0, 4, 2);

--- Insert pour la table Concerner_Com ---
INSERT INTO Concerner_Com (id_commentaire, id_signalement) VALUES
(3, 2);