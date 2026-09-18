--- 1. PUBLICATION ET FIL D'ACTUALITÉ ---
--- requête sql pour récupérer le fil d'actualité global ---
SELECT 
    p.texte_description,
    p.url_photo,
    p.url_video,
    p.date_publication,
    p.est_public,
    p.nombre_like,
	p.nombre_dislike
    p.nombre_repost,
    p.nombre_signalement,
    u.pseudonyme
FROM Publication p
JOIN Utilisateur u ON p.id_utilisateur = u.id_utilisateur
WHERE p.est_public = 1 
  AND p.est_cacher = 0 
  AND p.est_supprimer = 0
ORDER BY p.date_publication DESC;

--- Récupérer les publication (et repost) d'un utilisateur spécifique ---
SELECT 
    p.id_publication, 
    p.texte_description, 
    p.url_photo, 
    p.url_video, 
    p.date_publication AS date_action,
    'publication' AS type_action
FROM Publication p
WHERE p.id_utilisateur = :id_utilisateur AND p.est_supprimer = 0

UNION ALL

SELECT 
    p.id_publication, 
    p.texte_description, 
    p.url_photo, 
    p.url_video, 
    r.date_partage AS date_action,
    'repartage' AS type_action
FROM Repartager r
JOIN Publication p ON r.id_publication = p.id_publication
WHERE r.id_utilisateur = :id_utilisateur AND p.est_supprimer = 0
ORDER BY date_action DESC;

--- Publier une nouvelle publication ---
INSERT INTO Publication (texte_description, url_photo, url_video, date_publication, est_public, id_utilisateur) 
VALUES (:texte_description, :url_photo, :url_video, CURRENT_TIMESTAMP, :est_public, :id_utilisateur);


--- 2. INTERACTION (LIKES / DISLIKES) -> [TRANSACTION OBLIGATOIRES] --- 
--- Ajouter un like (2 requêtes à lancer en même temps) ---
BEGIN TRANSACTION;
    INSERT INTO Like_Publication (id_utilisateur, id_publication, est_un_like)
    VALUES (:id_utilisateur, :id_publication, 1);
    
    UPDATE Publication
    SET nombre_like = nombre_like + 1
    WHERE id_publication = :id_publication;
COMMIT;

--- Retirer un like (2 requêtes à lancer en même temps) ---
BEGIN TRANSACTION;
    DELETE FROM Like_Publication
    WHERE id_utilisateur = :id_utilisateur AND id_publication = :id_publication;
    
    UPDATE Publication
    SET nombre_like = nombre_like - 1
    WHERE id_publication = :id_publication AND nombre_like > 0;
COMMIT;

--- Ajouter un dislike (2 requêtes à lancer en même temps) ---
BEGIN TRANSACTION;
    INSERT INTO Like_Publication (id_utilisateur, id_publication, est_un_like)
    VALUES (:id_utilisateur, :id_publication, 0);
    
    UPDATE Publication
    SET nombre_dislike = nombre_dislike + 1
    WHERE id_publication = :id_publication;
COMMIT;

--- Retirer un dislike (2 requêtes à lancer en même temps) ---
BEGIN TRANSACTION;
    DELETE FROM Like_Publication
    WHERE id_utilisateur = :id_utilisateur AND id_publication = :id_publication;
    
    UPDATE Publication
    SET nombre_dislike = nombre_dislike - 1
    WHERE id_publication = :id_publication AND nombre_dislike > 0;
COMMIT;

--- Repartager (Repost) une publication (2 requête à lancer en même temps) ---
BEGIN TRANSACTION;
    INSERT INTO Repartager (id_utilisateur, id_publication, date_partage) 
    VALUES (:id_utilisateur, :id_publication, CURRENT_TIMESTAMP);
    
    UPDATE Publication 
	SET nombre_repost = nombre_repost + 1 
	WHERE id_publication = :id_publication;
COMMIT;

--- 3. COMMENTAIRES ---
--- Ajouter un commentaire sous une publication ---
SELECT c.id_commentaire, c.contenu, c.date_commentaire, c.nombre_like, c.nombre_dislike, u.pseudonyme
FROM Commentaire c
JOIN Utilisateur u ON c.id_utilisateur = u.id_utilisateur
WHERE c.id_publication = :id_publication
ORDER BY c.date_commentaire ASC;

--- Ajouter un commentaire ---
INSERT INTO Commentaire (contenu, date_commentaire, id_publication, id_utilisateur) 
VALUES (:contenu, CURRENT_TIMESTAMP, :id_publication, :id_utilisateur);

--- Ajouter un like sur un commentaire (2 requête à lancer en même temps) ---
BEGIN TRANSACTION;
    INSERT INTO Like_Commentaire (id_utilisateur, id_commentaire, est_un_like) 
	VALUES (:id_utilisateur, :id_commentaire, 1);
	
    UPDATE Commentaire 
	SET nombre_like = nombre_like + 1 
	WHERE id_commentaire = :id_commentaire;
COMMIT;

--- Retirer un like sur un commentaire (2 requête à lancer en même temps) ---
BEGIN TRANSACTION;
    DELETE FROM Like_Commentaire 
	WHERE id_utilisateur = :id_utilisateur AND id_commentaire = :id_commentaire;
	
    UPDATE Commentaire 
	SET nombre_like = nombre_like - 1 
	WHERE id_commentaire = :id_commentaire AND nombre_like > 0;
COMMIT;

--- Ajouter un dislike sur une commentaire (2 requêtes à lancer en même temps) ---
BEGIN TRANSACTION;
    INSERT INTO Like_Commentaire (id_utilisateur, id_commentaire, est_un_like)
    VALUES (:id_utilisateur, :id_commentaire, 0);
    
    UPDATE Commentaire
    SET nombre_dislike = nombre_dislike + 1
    WHERE id_commentaire = :id_commentaire;
COMMIT;

--- Retirer un dislike sur un commentaire (2 requêtes à lancer en même temps) ---
BEGIN TRANSACTION;
    DELETE FROM Like_Commentaire
    WHERE id_utilisateur = :id_utilisateur AND id_commentaire = :id_commentaire;
    
    UPDATE Commentaire
    SET nombre_dislike = nombre_dislike - 1
    WHERE id_commentaire = :id_commentaire AND nombre_dislike > 0;
COMMIT;


--- 4. HASHTAG ---
--- Lier un hashtag existant à une nouvelle publication ---
INSERT INTO Contient_Tag (id_publication, id_hashtag) 
VALUES (:id_publication, :id_hashtag);

--- Rechercher le fil d'actualité via un Hashtag précis ---
SELECT p.*, u.pseudonyme
FROM Publication p
JOIN Utilisateur u ON p.id_utilisateur = u.id_utilisateur
JOIN Contient_Tag ct ON p.id_publication = ct.id_publication
JOIN Hashtag h ON ct.id_hashtag = h.id_hashtag
WHERE h.nom_hashtag = :nom_hashtag AND p.est_cacher = 0 AND p.est_supprimer = 0;


--- 5. MESSAGERIE, GROUPES ET AMIS ---
--- Envoyer une demande d'ami ---
INSERT INTO Ami (statut, date_creation, id_demandeur, id_receveur) 
VALUES ('En attente', CURRENT_TIMESTAMP, :id_demandeur, :id_receveur);

--- Récupérer les messages d'un groupe (Conversation) ---
SELECT m.id_message, m.contenu_message, m.url_vocal, m.date_envoie, u.pseudonyme
FROM Message m
JOIN Utilisateur u ON m.id_expediteur = u.id_utilisateur
WHERE m.id_groupe = :id_groupe
ORDER BY m.date_envoie ASC;

--- Envoyer un message dans un groupe (ou MP si le groupe = 2 personnes) ---
INSERT INTO Message (contenu_message, url_vocal, date_envoie, id_expediteur, id_groupe)
VALUES (:contenu_message, :url_vocal, CURRENT_TIMESTAMP, :id_expediteur, :id_groupe);

--- Ajouter une réaction à un message ---
INSERT INTO Reaction_Msg (id_utilisateur, id_message, type_reaction, date_reaction)
VALUES (:id_utilisateur, :id_message, :type_reaction, CURRENT_TIMESTAMP);


--- 6. MODéRATION : SIGNALEMENTS ET BANNISSEMENTS
--- Créer un signalement sur une publication (par un utilisateur humain) ---
BEGIN TRANSACTION;
    INSERT INTO Signalement (motif, est_automatique, date_signalement, id_publication, id_utilisateur) 
    VALUES (:motif, 0, CURRENT_TIMESTAMP, :id_publication, :id_utilisateur_plaignant);
    
    UPDATE Publication 
	SET nombre_signalement = nombre_signalement + 1 
	WHERE id_publication = :id_publication;
COMMIT;

--- Créer un signalement sur un commentaire (utilise la table Concerner_Com) ---
BEGIN TRANSACTION;
    -- Note Backend: Récupérez l'ID du signalement inséré pour la 2ème requête
    INSERT INTO Signalement (motif, est_automatique, date_signalement, id_utilisateur) 
    VALUES (:motif, 0, CURRENT_TIMESTAMP, :id_utilisateur_plaignant);
    
    INSERT INTO Concerner_Com (id_commentaire, id_signalement) 
    VALUES (:id_commentaire, :id_du_signalement_tout_juste_cree);
    
    UPDATE Commentaire 
	SET nombre_report = nombre_report + 1 
	WHERE id_commentaire = :id_commentaire;
COMMIT;

--- Dashboard Modération : Afficher les signalements "En attente" avec le plaignant ---
SELECT 
    s.id_signalement, 
    s.motif, 
    s.id_publication,
    s.date_signalement,
    COALESCE(u.pseudonyme, '[Système Automatique]') AS plaignant
FROM Signalement s
LEFT JOIN Utilisateur u ON s.id_utilisateur = u.id_utilisateur
WHERE s.statut = 'En attente'
ORDER BY s.est_automatique DESC, s.date_signalement DESC

--- Modifier le statut d'un signalement ---
UPDATE Signalement 
SET statut = :nouveau_statut 
WHERE id_signalement = :id_signalement;

--- Cacher (Masquer) une publication ---
UPDATE Publication 
SET est_cacher = 1 
WHERE id_publication = :id_publication;

--- Supprimer une publication (Soft Delete) ---
UPDATE Publication 
SET est_supprimer = 1 
WHERE id_publication = :id_publication;

--- Prononcer un bannissement contre un utilisateur ---
INSERT INTO Bannissement (motif, duree_jour, est_definitif, date_debut, id_utilisateur)
VALUES (:motif, :duree_en_jours, :est_definitif, CURRENT_TIMESTAMP, :id_utilisateur_sanctionne);

