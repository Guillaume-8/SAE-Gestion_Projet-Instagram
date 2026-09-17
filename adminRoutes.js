cons express = require('express');
const router = express.Router();
const { getDb } = require('./bdd'); 

const isAdmin = (req, res, next) => {
    req.user = { id_utilisateur: 1, role: 'admin' }; 
    if (req.user.role === 'admin') return next();
    return res.status(403).json({ error: "Accès refusé. Droits admin requis." });
};

// ... Routes existantes (report, reports) ...
router.post('/report', async (req, res) => {
    const { id_publication, motif, id_utilisateur } = req.body;
    try {
        const db = await getDb();
        await db.run(`INSERT INTO Signalement (motif, statut, date_signalement, id_publication, id_utilisateur) VALUES (?, 'En attente', ?, ?, ?)`, [motif, new Date().toISOString(), id_publication, id_utilisateur]);
        await db.run(`UPDATE Publication SET nombre_signalement = nombre_signalement + 1 WHERE id_publication = ?`, [id_publication]);
        const row = await db.get(`SELECT nombre_signalement FROM Publication WHERE id_publication = ?`, [id_publication]);
        if (row && row.nombre_signalement >= 10) await db.run(`UPDATE Publication SET is_hidden = 1 WHERE id_publication = ?`, [id_publication]);
        res.json({ message: "Signalement ajouté." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/reports', isAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const reports = await db.all(`
             SELECT s.id_signalement, s.motif, s.date_signalement, p.id_publication, p.texte_description, p.nom_fichier_photo, p.id_utilisateur AS id_auteur, u_plaignant.pseudonyme AS plaignant, u_auteur.pseudonyme AS auteur
             FROM Signalement s
             JOIN Publication p ON s.id_publication = p.id_publication
             JOIN Utilisateur u_plaignant ON s.id_utilisateur = u_plaignant.id_utilisateur
             JOIN Utilisateur u_auteur ON p.id_utilisateur = u_auteur.id_utilisateur
             WHERE s.statut = 'En attente' ORDER BY s.date_signalement DESC
        `);
        res.json(reports);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ROUTE MISE À JOUR : Historique avec récupération de l'auteur
router.get('/history', isAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const history = await db.all(`
             SELECT s.id_signalement, s.motif, s.statut, s.date_signalement, 
                    u_plaignant.pseudonyme AS plaignant, 
                    u_auteur.pseudonyme AS auteur, u_auteur.id_utilisateur AS id_auteur
             FROM Signalement s
             JOIN Publication p ON s.id_publication = p.id_publication
             JOIN Utilisateur u_plaignant ON s.id_utilisateur = u_plaignant.id_utilisateur
             JOIN Utilisateur u_auteur ON p.id_utilisateur = u_auteur.id_utilisateur
             WHERE s.statut != 'En attente' ORDER BY s.date_signalement DESC
        `);
        res.json(history);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// NOUVELLE ROUTE : Le "Casier" de l'utilisateur
router.get('/user/:id/stats', isAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.params.id;
        
        // On compte les bannissements passés
        const bans = await db.get(`SELECT COUNT(*) as count FROM Bannissement WHERE id_utilisateur = ?`, [userId]);
        // On compte ses publications supprimées par la modération
        const deletedPosts = await db.get(`SELECT COUNT(*) as count FROM Publication WHERE id_utilisateur = ? AND is_deleted = 1`, [userId]);
        // On compte combien de fois ses publications ont été signalées
        const reports = await db.get(`
            SELECT COUNT(s.id_signalement) as count 
            FROM Signalement s 
            JOIN Publication p ON s.id_publication = p.id_publication 
            WHERE p.id_utilisateur = ?`, [userId]);

        res.json({ bans: bans.count, deletedPosts: deletedPosts.count, reports: reports.count });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/post/:id', isAdmin, async (req, res) => {
    try {
        const db = await getDb();
        await db.run(`UPDATE Publication SET is_deleted = 1, is_hidden = 1 WHERE id_publication = ?`, [req.params.id]);
        await db.run(`UPDATE Signalement SET statut = 'Traité (Supprimé)' WHERE id_publication = ?`, [req.params.id]);
        res.json({ message: "Publication supprimée." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/post/:id/restore', isAdmin, async (req, res) => {
    try {
        const db = await getDb();
        await db.run(`UPDATE Publication SET is_deleted = 0, is_hidden = 0, nombre_signalement = 0 WHERE id_publication = ?`, [req.params.id]);
        await db.run(`UPDATE Signalement SET statut = 'Traité (Ignoré)' WHERE id_publication = ?`, [req.params.id]);
        res.json({ message: "Publication restaurée." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/user/:id/ban', isAdmin, async (req, res) => {
    if (req.params.id == req.user.id_utilisateur) return res.status(400).json({ error: "Vous ne pouvez pas vous bannir vous-même." });
    
    const { motif, duree_jour, est_definitif } = req.body;
    try {
        const db = await getDb();
        await db.run(`INSERT INTO Bannissement (motif, duree_jour, est_definitif, date_debut, id_utilisateur) VALUES (?, ?, ?, ?, ?)`, [motif, duree_jour, est_definitif, new Date().toISOString(), req.params.id]);
        await db.run(`UPDATE Utilisateur SET nombre_de_bannisement = nombre_de_bannisement + 1 WHERE id_utilisateur = ?`, [req.params.id]);
        res.json({ message: "Utilisateur banni." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
