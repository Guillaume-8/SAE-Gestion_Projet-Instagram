const express = require('express');
const router = express.Router();
const { getDb } = require('./bdd'); 

const getRole = (req) => req.headers['x-user-role'] || 'admin';

const requireModOrAdmin = (req, res, next) => {
    const role = getRole(req);
    if (role === 'admin' || role === 'moderateur') return next();
    return res.status(403).json({ error: "Accès refusé. Droits Modérateur requis." });
};

const requireAdmin = (req, res, next) => {
    if (getRole(req) === 'admin') return next();
    return res.status(403).json({ error: "Accès refusé. Droits Administrateur requis." });
};

// --- RÉCUPÉRATION DES SIGNALEMENTS (REGROUPEMENT SÉCURISÉ EN JAVASCRIPT) ---
router.get('/reports', requireModOrAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const rawReports = await db.all(`
            SELECT 
                s.id_signalement, s.motif, s.date_signalement, s.est_automatique,
                u_plaignant.pseudonyme AS plaignant,
                p.id_publication, p.texte_description, p.nom_fichier_photo,
                u_auteur.pseudonyme AS auteur, u_auteur.id_utilisateur AS id_auteur,
                c.id_commentaire, c.contenu AS contenu_commentaire,
                u_auteur_com.pseudonyme AS auteur_com, u_auteur_com.id_utilisateur AS id_auteur_com
            FROM Signalement s
            LEFT JOIN Concerner_Com cc ON s.id_signalement = cc.id_signalement
            LEFT JOIN Commentaire c ON cc.id_commentaire = c.id_commentaire
            LEFT JOIN Utilisateur u_auteur_com ON c.id_utilisateur = u_auteur_com.id_utilisateur
            JOIN Publication p ON s.id_publication = p.id_publication
            JOIN Utilisateur u_auteur ON p.id_utilisateur = u_auteur.id_utilisateur
            LEFT JOIN Utilisateur u_plaignant ON s.id_utilisateur = u_plaignant.id_utilisateur
            WHERE s.statut = 'En attente'
            ORDER BY s.date_signalement DESC
        `);

        // Regroupement en Javascript (Fonctionne sur 100% des machines)
        const grouped = {};
        for (let r of rawReports) {
            const key = r.id_commentaire ? `com_${r.id_commentaire}` : `pub_${r.id_publication}`;
            if (!grouped[key]) {
                grouped[key] = {
                    id_publication: r.id_publication, texte_description: r.texte_description,
                    nom_fichier_photo: r.nom_fichier_photo, auteur: r.auteur, id_auteur: r.id_auteur,
                    id_commentaire: r.id_commentaire, contenu_commentaire: r.contenu_commentaire,
                    auteur_com: r.auteur_com, id_auteur_com: r.id_auteur_com,
                    total_reports: 0, details_signalements: []
                };
            }
            grouped[key].total_reports += 1;
            grouped[key].details_signalements.push({
                id_signalement: r.id_signalement, motif: r.motif, 
                date_signalement: r.date_signalement, est_automatique: r.est_automatique, 
                plaignant: r.plaignant
            });
        }
        res.json(Object.values(grouped));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/history', requireModOrAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const history = await db.all(`
             SELECT s.id_signalement, s.motif, s.statut, s.date_signalement, s.est_automatique, 
                    u_plaignant.pseudonyme AS plaignant, u_auteur.pseudonyme AS auteur
             FROM Signalement s
             JOIN Publication p ON s.id_publication = p.id_publication
             LEFT JOIN Utilisateur u_plaignant ON s.id_utilisateur = u_plaignant.id_utilisateur
             JOIN Utilisateur u_auteur ON p.id_utilisateur = u_auteur.id_utilisateur
             WHERE s.statut != 'En attente' ORDER BY s.date_signalement DESC
        `);
        res.json(history);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- GESTION DES UTILISATEURS (ADMIN) ---
router.get('/banned-users', requireModOrAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const banned = await db.all(`
             SELECT b.id_bannissement, b.motif, b.duree_jour, b.est_definitif, b.date_debut, 
                    u.id_utilisateur, u.pseudonyme
             FROM Bannissement b
             JOIN Utilisateur u ON b.id_utilisateur = u.id_utilisateur
             ORDER BY b.est_definitif DESC, b.duree_jour DESC, b.date_debut DESC
        `);
        res.json(banned);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/users', requireAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const users = await db.all(`
             SELECT id_utilisateur, pseudonyme, role, nombre_de_bannissement 
             FROM Utilisateur 
             ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'moderateur' THEN 2 ELSE 3 END, pseudonyme ASC
        `);
        res.json(users);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/user/:id/stats', requireModOrAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.params.id;
        const user = await db.get(`SELECT role FROM Utilisateur WHERE id_utilisateur = ?`, [userId]);
        const bans = await db.get(`SELECT COUNT(*) as count FROM Bannissement WHERE id_utilisateur = ?`, [userId]);
        const deletedPosts = await db.get(`SELECT COUNT(*) as count FROM Publication WHERE id_utilisateur = ? AND est_supprimer = 1`, [userId]);
        const reports = await db.get(`SELECT COUNT(*) as count FROM Signalement WHERE id_utilisateur = ?`, [userId]);

        res.json({ role: user ? user.role : 'Inconnu', bans: bans.count, deletedPosts: deletedPosts.count, reports: reports.count });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ACTIONS MODÉRATEURS (CONTENUS) ---
router.delete('/post/:id', requireModOrAdmin, async (req, res) => {
    try {
        const db = await getDb();
        await db.run(`UPDATE Publication SET est_supprimer = 1, est_cacher = 1 WHERE id_publication = ?`, [req.params.id]);
        await db.run(`UPDATE Signalement SET statut = 'Traité (Supprimé)' WHERE id_publication = ?`, [req.params.id]);
        res.json({ message: "Publication supprimée." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/comment/:id', requireModOrAdmin, async (req, res) => {
    try {
        const db = await getDb();
        await db.run(`DELETE FROM Commentaire WHERE id_commentaire = ?`, [req.params.id]);
        await db.run(`UPDATE Signalement SET statut = 'Traité (Supprimé)' WHERE id_signalement IN (SELECT id_signalement FROM Concerner_Com WHERE id_commentaire = ?)`, [req.params.id]);
        res.json({ message: "Commentaire supprimé." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/post/:id/restore', requireModOrAdmin, async (req, res) => {
    try {
        const db = await getDb();
        await db.run(`UPDATE Publication SET est_supprimer = 0, est_cacher = 0, nombre_signalement = 0 WHERE id_publication = ?`, [req.params.id]);
        await db.run(`UPDATE Signalement SET statut = 'Traité (Ignoré)' WHERE id_publication = ?`, [req.params.id]);
        res.json({ message: "Signalement ignoré." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ACTIONS ADMINISTRATEUR (COMPTES & RÔLES) ---
router.put('/user/:id/ban', requireAdmin, async (req, res) => {
    const { motif, duree_jour, est_definitif } = req.body;
    try {
        const db = await getDb();
        await db.run(`INSERT INTO Bannissement (motif, duree_jour, est_definitif, date_debut, id_utilisateur) VALUES (?, ?, ?, ?, ?)`, 
            [motif, duree_jour, est_definitif ? 1 : 0, new Date().toISOString(), req.params.id]);
        await db.run(`UPDATE Utilisateur SET nombre_de_bannissement = nombre_de_bannissement + 1 WHERE id_utilisateur = ?`, [req.params.id]);
        res.json({ message: "Utilisateur banni." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/ban/:id', requireAdmin, async (req, res) => {
    try {
        const db = await getDb();
        await db.run(`DELETE FROM Bannissement WHERE id_bannissement = ?`, [req.params.id]);
        res.json({ message: "Bannissement révoqué." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/user/:id/role', requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const db = await getDb();
        await db.run(`UPDATE Utilisateur SET role = ? WHERE id_utilisateur = ?`, [role, req.params.id]);
        res.json({ message: `Le rôle a été mis à jour.` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;