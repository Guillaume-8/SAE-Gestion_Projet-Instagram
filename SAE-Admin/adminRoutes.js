const express = require('express');
const router = express.Router();
// On importe la fonction de ton collègue pour se connecter à SQLite
const { getDb } = require('./bdd'); 

/**
 * Middleware simulant un admin.
 * (À modifier quand l'équipe aura géré la connexion/session utilisateur)
 */
const isAdmin = (req, res, next) => {
    req.user = { id_utilisateur: 1, role: 'admin' }; 
    if (req.user.role === 'admin') return next();
    return res.status(403).json({ error: "Accès refusé. Droits admin requis." });
};

/**
 * @api {post} /report Signaler une publication
 * @description Ajoute un signalement. Masque automatiquement un post s'il atteint 10 signalements.
 */
router.post('/report', async (req, res) => {
    const { id_publication, motif, id_utilisateur } = req.body;
    try {
        const db = await getDb();
        const date_signalement = new Date().toISOString();

        // 1. Enregistrer le signalement dans leur table Signalement
        await db.run(
            `INSERT INTO Signalement (motif, statut, date_signalement, id_publication, id_utilisateur) 
             VALUES (?, 'En attente', ?, ?, ?)`, 
            [motif, date_signalement, id_publication, id_utilisateur]
        );
        
        // 2. Incrémenter leur colonne 'nombre_signalement' dans la table Publication
        await db.run(
            `UPDATE Publication SET nombre_signalement = nombre_signalement + 1 WHERE id_publication = ?`,
            [id_publication]
        );

        // 3. BONUS : Masquage auto à 10 signalements (Nécessite la colonne is_hidden)
        const row = await db.get(
            `SELECT nombre_signalement FROM Publication WHERE id_publication = ?`, 
            [id_publication]
        );
        
        if (row && row.nombre_signalement >= 10) {
            await db.run(`UPDATE Publication SET is_hidden = 1 WHERE id_publication = ?`, [id_publication]);
        }

        res.json({ message: "Signalement ajouté avec succès." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @api {get} /reports Lister les signalements en attente (Vue Admin)
 */
router.get('/reports', isAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const reports = await db.all(
            `SELECT s.*, p.texte_description, u.pseudonyme as plaignant
             FROM Signalement s
             JOIN Publication p ON s.id_publication = p.id_publication
             JOIN Utilisateur u ON s.id_utilisateur = u.id_utilisateur
             WHERE s.statut = 'En attente'
             ORDER BY s.date_signalement DESC`
        );
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @api {delete} /post/:id Supprimer un post signalé (Action Admin)
 * @description BONUS : Soft Delete avec la colonne is_deleted
 */
router.delete('/post/:id', isAdmin, async (req, res) => {
    try {
        const db = await getDb();
        // Soft delete du post
        await db.run(
            `UPDATE Publication SET is_deleted = 1, is_hidden = 1 WHERE id_publication = ?`, 
            [req.params.id]
        );
        // On clôture les signalements liés
        await db.run(
            `UPDATE Signalement SET statut = 'Traité (Supprimé)' WHERE id_publication = ?`,
            [req.params.id]
        );
        res.json({ message: "Publication supprimée par la modération." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @api {put} /user/:id/ban Bannir un utilisateur (Action Admin)
 * @description Utilise la table Bannissement de tes collègues.
 */
router.put('/user/:id/ban', isAdmin, async (req, res) => {
    const { motif, duree_jour, est_definitif } = req.body;
    try {
        const db = await getDb();
        const date_debut = new Date().toISOString();

        await db.run(
            `INSERT INTO Bannissement (motif, duree_jour, est_definitif, date_debut, id_utilisateur) 
             VALUES (?, ?, ?, ?, ?)`,
            [motif, duree_jour, est_definitif, date_debut, req.params.id]
        );
        
        // On incrémente le compteur de bannissements de l'utilisateur
        await db.run(
            `UPDATE Utilisateur SET nombre_de_bannisement = nombre_de_bannisement + 1 WHERE id_utilisateur = ?`,
            [req.params.id]
        );

        res.json({ message: "Utilisateur banni." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;