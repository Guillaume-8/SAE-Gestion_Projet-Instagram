--- si vous voulez récupérer les INSERT INTO respecter l'ordre de Utilisateur a Concerner_Com pour eviter les erreur de lient 
--- Insert pour la table Utilisateur ---
INSERT INTO Utilisateur (prenom, nom, psudonyme, email, mot_de_passe, nombre_de_signalement, nombre_de_bannisement) VALUES
('Lucas', 'Martin', 'PhantomJoker', 'lucas@mail.com', '$2y$10$ExempleHashMotDePasse1', 0, 0),
('Chloé', 'Bernard', 'YukikoInaba', 'chloe@mail.com', '$2y$10$ExempleHashMotDePasse2', 0, 0),
('Thomas', 'Dubois', 'JojoSteelBall', 'thomas@mail.com', '$2y$10$ExempleHashMotDePasse3', 0, 0),
('Sarah', 'Petit', 'MomoCreation', 'sarah@mail.com', '$2y$10$ExempleHashMotDePasse4', 0, 0);

--- Insert pour la table Groupe ---
INSERT INTO Groupe (nom_groupe, date_creation) VALUES
('Phantom Thieves', '2026-05-01 10:00:00'),
('Amagi Inn Fanclub (Yukiko Best Manager)', '2026-05-05 14:30:00'),
('Netflix Jail SBR Part 7 - Merci pour le découpage catastrophique', '2026-06-10 18:00:00'),
('Kingdom Hearts - Keyblade & Organization XIII', '2026-07-01 09:15:00'),
('Bakugo Explosions & Momo Yayorozu Strategy', '2026-08-12 20:45:00');

--- Insert pour la table Hashtag ---
INSERT INTO Hashtag (nom_hashtag) VALUES
('LosSantos'),
('AmagiInn'),
('SteelBallRunAnime'),
('CreationAlter'),
('NoDiskNoPlaystation'),
('KeybladeMaster');

--- Insert pour la table Publication ---
INSERT INTO Publication (texte_description, nom_fichier_photo, nom_fichier_video, date_publication, est_public, nombre_like, nombre_repost, nombre_signalement, id_utilisateur) VALUES
('Premier partage sur LifeInvader, le réseau social officiel de Los Santos !', 'lifeinvader_post1.jpg', NULL, '2026-05-02 11:20:00', TRUE, 15, 2, 0, 1),
('Journée calme et studieuse à l auberge Amagi, le service géré par Yukiko est toujours au top.', 'amagi_inn.jpg', NULL, '2026-05-06 08:00:00', TRUE, 42, 6, 0, 2),
('On attend toujours Steel Ball Run en anime dans de bonnes conditions sur la plateforme...', 'sbr_netflix.jpg', NULL, '2026-06-11 19:45:00', TRUE, 88, 19, 0, 3),
('Petite création de canon plasma pour contrer les crises de colère de Bakugo en cours de soutien.', 'momo_mha.jpg', NULL, '2026-08-15 14:10:00', TRUE, 37, 5, 0, 4);

--- Insert pour la table Bannissement ---
INSERT INTO Bannissement (motif, duree_jour, est_definitif, date_debut, id_utilisateur) VALUES
('Agressivité répétée dans les commentaires', 3, FALSE, '2026-06-12 10:00:00', 3);

--- Insert pour la table Notification ---
INSERT INTO Notification (libelle, est_lu, id_utilisateur) VALUES
('PhantomJoker a aimé votre publication', FALSE, 2),
('MomoCreation a rejoint votre groupe', TRUE, 4);

--- Insert pour la table Ami ---
INSERT INTO Ami (statut, date_creation, id_demandeur, id_receveur) VALUE
('accepte', '2026-05-03 15:00:00', 1, 2),
('accepte', '2026-05-07 10:11:00', 2, 4),
('en_attente', '2026-06-12 11:00:00', 3, 1);

--- Insert pour la table Appartient_Groupe ---
INSERT INTO Appartient_Groupe (id_utilisateur, id_groupe) VALUES
(1,1),
(2,2),
(3,3),
(4,5);

--- Insert pour la table Commentaire ---
INSERT INTO Commentaire (contenue, date_commentaire, nombre_like, nombre_dislike, nombre_repost, nombre_report, id_publication, id_utilisateur) VALUES
('Incroyable ce cliché sur LifeInvader !', '2026-05-02 12:00:00', 4, 0, 0, 0, 1, 2),
('Yukiko gère cet établissement d une main de maître.', '2026-05-06 09:30:00', 12, 0, 1, 0, 2, 1),
('Leur gestion des plannings de diffusion sur la partie 7 est un véritable sketch.', '2026-06-11 20:15:00', 24, 0, 3, 0, 3, 4),
('Le plan tactique de Momo est validé à 100%.', '2026-08-15 15:00:00', 9, 0, 0, 0, 4, 3);

--- Insert pour la table Message ---
INSERT INTO Message (contenu_message, date_envoie, id_expediteur, id_groupe) VALUES
('On lance l infiltration du palais ce soir ?', '2026-05-02 18:30:00', 1, 1),
('Les réservations de l auberge sont complètes pour cet été !', '2026-05-10 09:00:00', 2, 2),
('Quelqu un a des nouvelles d une vraie adaptation animée pour Gyro et Johnny ?', '2026-06-15 21:00:00', 3, 3),
('J ai analysé l alter de Bakugo, on peut optimiser ses gantelets.', '2026-08-16 10:30:00', 4, 5);

--- Insert pour la table Contient_Tag ---
INSERT INTO Contient_Tag (id_publication, id_hashtag) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4);

--- Insert pour la table Like_Publication ---
INSERT INTO Like_Publication (id_utilisateur, id_publication, est_un_like) VALUES
(2, 1, TRUE),
(1, 2, TRUE),
(4, 3, TRUE),
(3, 4, TRUE);

--- Insert pour la table Repartager ---
INSERT INTO Repartager (id_utilisateur, id_publication, date_partage) VALUES
(1, 3, '2026-06-12 08:15:00'),
(3, 1, '2026-05-03 14:20:00');

--- Insert pour la table Like_Commentaire ---
INSERT INTO Like_Commentaire (id_utilisateur, id_commentaire, est_un_like) VALUES
(1, 2, TRUE),
(2, 4, TRUE);

--- Insert pour la table Recevoir_Msg ---
INSERT INTO Recevoir_Msg (id_utilisateur, id_message, est_lu, date_lecture) VALUES
(1, 1, TRUE, '2026-05-02 18:31:00'),
(2, 2, TRUE, '2026-05-10 09:05:00'),
(3, 3, FALSE, NULL);

--- Insert pour la table Signalement ---
INSERT INTO Signalement (motif, statut, date_signalement, id_publication, id_utilisateur) VALUE
('Spam ou coup de geule agressif contre une plateforme', 'en_attente', '2026-06-11 22:00:00', 3, 1),
('Spam ou acharnemement dans l espace commentaire', 'en_attente', '2026-06-12 09:00:00', NULL, 2);

--- Insert pour la table Concerner_Com ---
INSERT INTO Concerner_Com (id_commentaire, id_signalement) VALUES
(3, 2);