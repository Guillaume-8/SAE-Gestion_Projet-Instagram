/**
 * @fileoverview Serveur API Utilisateurs — InstaClone (SAÉ 5.02).
 * Expose la table Utilisateur de la base MariaDB "PhotoVideo" au
 * front-end via REST. Écoute sur le port 3001 ; Apache route
 * /api/auth et /api/users vers ce serveur (la messagerie garde le 3000).
 *
 * Endpoints :
 *   GET  /api/auth/ping           Disponibilité (sans authentification)
 *   POST /api/auth/register       Inscription
 *   POST /api/auth/login          Connexion (pseudonyme ou email)
 *   GET  /api/users               Liste des pseudonymes (public)
 *   GET  /api/users/search?q=     Recherche d'utilisateurs (public)
 *   GET  /api/users/me            Profil complet + statistiques (auth)
 *   PUT  /api/users/me            Mise à jour du profil (auth)
 *   GET  /api/users/media/...     Fichiers médias servis en statique
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'url';
import config from './config.js';
import db from './db.js';
import {hashPassword, verifyPassword, signToken, verifyToken} from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({limit: '20mb'})); // photo_profil peut être un data URL

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

/**
 * Middleware d'authentification : vérifie le jeton Bearer.
 * @param {express.Request} req Requête Express.
 * @param {express.Response} res Réponse Express.
 * @param {Function} next Suite du traitement.
 */
function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const userId = verifyToken(token);
  if (!userId) {
    res.status(401).json({error: 'Non authentifié'});
    return;
  }
  req.userId = userId;
  next();
}

/**
 * Convertit une ligne Utilisateur au format attendu par le front-end.
 * @param {Object} row Ligne de la table Utilisateur.
 * @param {Object=} extras Champs additionnels (stats, posts).
 * @return {Object} Utilisateur au format front.
 */
function userToFront(row, extras = {}) {
  const name = [row.prenom, row.nom].filter(Boolean).join(' ').trim();
  return {
    id: row.id_utilisateur,
    username: row.pseudonyme,
    name: name || row.pseudonyme,
    avatar: row.photo_profil || null,
    bio: row.bio || '',
    ...extras,
  };
}

/**
 * Récupère une ligne Utilisateur par son id.
 * @param {number} userId Identifiant.
 * @return {Promise<?Object>} Ligne ou null.
 */
async function findUserById(userId) {
  const [rows] = await db.query(
    'SELECT * FROM Utilisateur WHERE id_utilisateur = ?',
    [userId],
  );
  return rows[0] || null;
}

// ============================================================
//  DISPONIBILITÉ
// ============================================================

app.get('/api/auth/ping', (req, res) => {
  res.json({status: 'ok', service: 'users-api', database: config.db.database});
});

// ============================================================
//  INSCRIPTION / CONNEXION
// ============================================================

/**
 * POST /api/auth/register
 * Corps : {pseudonyme, email, motDePasse, prenom, nom}
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const {pseudonyme, email, motDePasse, prenom, nom} = req.body || {};

    if (!pseudonyme || !email || !motDePasse) {
      res.status(400).json({error: 'Champs obligatoires manquants'});
      return;
    }
    if (String(motDePasse).length < 6) {
      res.status(400).json({error: 'Le mot de passe doit faire au moins 6 caractères'});
      return;
    }

    const [existing] = await db.query(
      'SELECT id_utilisateur FROM Utilisateur WHERE pseudonyme = ? OR email = ?',
      [pseudonyme, email],
    );
    if (existing.length > 0) {
      res.status(409).json({error: 'Pseudonyme ou email déjà utilisé'});
      return;
    }

    const hash = await hashPassword(String(motDePasse));
    const [result] = await db.query(
      `INSERT INTO Utilisateur
         (prenom, nom, pseudonyme, email, mot_de_passe)
       VALUES (?, ?, ?, ?, ?)`,
      [prenom || '', nom || '', pseudonyme, email, hash],
    );

    const user = await findUserById(result.insertId);
    res.status(201).json({token: signToken(result.insertId), user: userToFront(user)});
  } catch (err) {
    console.error('Erreur inscription :', err.message);
    res.status(500).json({error: 'Erreur serveur lors de l\'inscription'});
  }
});

/**
 * POST /api/auth/login
 * Corps : {identifiant (pseudonyme ou email), motDePasse}
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const {identifiant, motDePasse} = req.body || {};
    if (!identifiant || !motDePasse) {
      res.status(400).json({error: 'Identifiant et mot de passe requis'});
      return;
    }

    const [rows] = await db.query(
      'SELECT * FROM Utilisateur WHERE pseudonyme = ? OR email = ?',
      [identifiant, identifiant],
    );
    const user = rows[0];

    if (!user || !(await verifyPassword(String(motDePasse), user.mot_de_passe))) {
      res.status(401).json({error: 'Identifiants incorrects'});
      return;
    }

    res.json({token: signToken(user.id_utilisateur), user: userToFront(user)});
  } catch (err) {
    console.error('Erreur connexion :', err.message);
    res.status(500).json({error: 'Erreur serveur lors de la connexion'});
  }
});

// ============================================================
//  UTILISATEURS (PUBLIC)
// ============================================================

/**
 * GET /api/users — pseudonymes de tous les utilisateurs.
 */
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT pseudonyme FROM Utilisateur');
    res.json(rows.map((r) => r.pseudonyme));
  } catch (err) {
    console.error('Erreur liste utilisateurs :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

/**
 * GET /api/users/search?q= — recherche par pseudonyme.
 */
app.get('/api/users/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().replace(/^#/, '');
    if (!q) {
      res.json({users: []});
      return;
    }
    const [rows] = await db.query(
      `SELECT u.id_utilisateur, u.pseudonyme, u.photo_profil,
              (SELECT COUNT(*) FROM Publication p
                WHERE p.id_utilisateur = u.id_utilisateur) AS postsCount
       FROM Utilisateur u
       WHERE u.pseudonyme LIKE ?
       ORDER BY u.pseudonyme
       LIMIT 20`,
      [`%${q}%`],
    );
    res.json({
      users: rows.map((r) => ({
        username: r.pseudonyme,
        avatar: r.photo_profil || null,
        postsCount: r.postsCount,
      })),
    });
  } catch (err) {
    console.error('Erreur recherche utilisateurs :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

// ============================================================
//  PROFIL (AUTHENTIFIÉ)
// ============================================================

/**
 * GET /api/users/me — profil complet avec statistiques et publications.
 */
app.get('/api/users/me', authRequired, async (req, res) => {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      res.status(404).json({error: 'Utilisateur introuvable'});
      return;
    }

    // Statistiques (valeurs 0 si une requête échoue)
    const stats = {postsCount: 0, followersCount: 0, followingCount: 0};
    try {
      const [[p]] = await db.query(
        'SELECT COUNT(*) AS c FROM Publication WHERE id_utilisateur = ?',
        [req.userId],
      );
      const [[f]] = await db.query(
        'SELECT COUNT(*) AS c FROM Ami WHERE id_receveur = ?',
        [req.userId],
      );
      const [[g]] = await db.query(
        'SELECT COUNT(*) AS c FROM Ami WHERE id_demandeur = ?',
        [req.userId],
      );
      stats.postsCount = p.c;
      stats.followersCount = f.c;
      stats.followingCount = g.c;
    } catch (statErr) {
      console.warn('Statistiques indisponibles :', statErr.message);
    }

    // Publications de l'utilisateur (miniatures)
    let posts = [];
    try {
      const [rows] = await db.query(
        `SELECT id_publication, nom_fichier_photo, nom_fichier_video
         FROM Publication
         WHERE id_utilisateur = ?
         ORDER BY date_publication DESC`,
        [req.userId],
      );
      posts = rows
        .filter((r) => r.nom_fichier_photo || r.nom_fichier_video)
        .map((r) => ({
          id: r.id_publication,
          mediaUrl: '/api/users/media/' +
            encodeURIComponent(r.nom_fichier_photo || r.nom_fichier_video),
          isVideo: !r.nom_fichier_photo && Boolean(r.nom_fichier_video),
        }));
    } catch (postErr) {
      console.warn('Publications indisponibles :', postErr.message);
    }

    res.json(userToFront(user, {...stats, posts}));
  } catch (err) {
    console.error('Erreur profil :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

/**
 * PUT /api/users/me — mise à jour du profil.
 * Corps : {pseudonyme, prenom, nom, bio, photoProfil}
 */
app.put('/api/users/me', authRequired, async (req, res) => {
  try {
    const {pseudonyme, prenom, nom, bio, photoProfil} = req.body || {};

    if (!pseudonyme) {
      res.status(400).json({error: 'Le pseudonyme est obligatoire'});
      return;
    }

    const [taken] = await db.query(
      'SELECT id_utilisateur FROM Utilisateur WHERE pseudonyme = ? AND id_utilisateur != ?',
      [pseudonyme, req.userId],
    );
    if (taken.length > 0) {
      res.status(409).json({error: 'Ce nom d\'utilisateur est déjà pris'});
      return;
    }

    const user = await findUserById(req.userId);
    if (!user) {
      res.status(404).json({error: 'Utilisateur introuvable'});
      return;
    }

    await db.query(
      'UPDATE Utilisateur SET pseudonyme = ?, prenom = ?, nom = ?, bio = ?, photo_profil = ? WHERE id_utilisateur = ?',
      [
        pseudonyme,
        prenom !== undefined ? prenom : user.prenom,
        nom !== undefined ? nom : user.nom,
        bio !== undefined ? bio : user.bio || '',
        photoProfil !== undefined ? photoProfil : user.photo_profil || null,
        req.userId,
      ],
    );

    const updated = await findUserById(req.userId);
    res.json({success: true, user: userToFront(updated)});
  } catch (err) {
    console.error('Erreur mise à jour :', err.message);
    res.status(500).json({error: 'Erreur serveur lors de la mise à jour'});
  }
});

// Médias servis en statique (chemin sous /api/users pour passer
// par le même proxy Apache que l'API).
app.use('/api/users/media', express.static(uploadsDir));

app.listen(config.port, () => {
  console.log(`API Utilisateurs démarrée sur http://localhost:${config.port}`);
  console.log(`Base : ${config.db.database} @ ${config.db.host}:${config.db.port}`);
});
