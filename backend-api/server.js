/**
 * @fileoverview Serveur API InstaClone (SAÉ 5.02) — base MariaDB PhotoVideo.
 *
 * Écoute sur le port 3001 ; Apache route /api/auth, /api/users, /api/posts
 * et /api/hashtags vers ce serveur (la messagerie garde le 3000).
 *
 * Endpoints Utilisateurs :
 *   GET  /api/auth/ping           Disponibilité (sans authentification)
 *   POST /api/auth/register        Inscription
 *   POST /api/auth/login           Connexion (pseudonyme ou email)
 *   GET  /api/users                Liste des pseudonymes (public)
 *   GET  /api/users/search?q=      Recherche d'utilisateurs (public)
 *   GET  /api/users/me             Profil complet + statistiques (auth)
 *   PUT  /api/users/me             Mise à jour du profil (auth)
 *
 * Endpoints Publications / Commentaires / Signalements :
 *   GET  /api/posts                Fil d'actualité (public, état like si auth)
 *   GET  /api/posts/trending       Publications populaires (public)
 *   GET  /api/posts/search?q=      Recherche de publications (public)
 *   GET  /api/posts/:id            Détail d'une publication (public)
 *   POST /api/posts                Création avec média — multipart (auth)
 *   POST /api/posts/:id/like       Like / dé-like (auth)
 *   POST /api/posts/:id/dislike    Dislike / dé-dislike (auth)
 *   POST /api/posts/:id/share      Partage — incrémente nombre_repost
 *   POST /api/posts/:id/republish  Repartage (table Repartager) (auth)
 *   POST /api/posts/:id/report     Signalement (table Signalement) (auth)
 *   GET  /api/posts/:id/comments   Commentaires d'une publication (public)
 *   POST /api/posts/:id/comments   Ajout d'un commentaire (auth)
 *   GET  /api/hashtags             Hashtags avec compteurs (public)
 *   GET  /api/users/media/...      Fichiers médias servis en statique
 */

import express from 'express';
import multer from 'multer';
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

// ============================================================
//  MIDDLEWARES
// ============================================================

/**
 * Authentification obligatoire : rejette en 401 sans jeton valide.
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
 * Authentification optionnelle : renseigne req.userId si un jeton
 * valide est présent, sans bloquer la requête sinon.
 * @param {express.Request} req Requête Express.
 * @param {express.Response} res Réponse Express.
 * @param {Function} next Suite du traitement.
 */
function authOptional(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  req.userId = verifyToken(token) || null;
  next();
}

/**
 * Upload de médias (photos/vidéos) vers le dossier uploads/.
 */
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const unique = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, unique + '_' + safe);
    },
  }),
  limits: {fileSize: 20 * 1024 * 1024},
  fileFilter: (req, file, cb) => {
    const ok = /^(image\/|video\/)/.test(file.mimetype);
    cb(ok ? null : new Error('Type de fichier non autorisé'), ok);
  },
});

// ============================================================
//  HELPERS COMMUNS
// ============================================================

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

/**
 * Sélecteur SQL commun pour les publications (compteurs inclus).
 * @type {string}
 */
const POST_SELECT = `
  SELECT p.id_publication AS id,
         u.pseudonyme AS author,
         u.photo_profil AS avatar,
         p.nom_fichier_photo,
         p.nom_fichier_video,
         p.texte_description AS caption,
         p.date_publication AS createdAt,
         p.est_public,
         (SELECT COUNT(*) FROM Like_Publication lp
           WHERE lp.id_publication = p.id_publication AND lp.est_un_like = 1) AS likesCount,
         (SELECT COUNT(*) FROM Like_Publication lp
           WHERE lp.id_publication = p.id_publication AND lp.est_un_like = 0) AS dislikesCount,
         (SELECT GROUP_CONCAT(CONCAT('#', h.nom_hashtag) SEPARATOR ' ')
            FROM Contient_Tag ct
            JOIN Hashtag h ON ct.id_hashtag = h.id_hashtag
           WHERE ct.id_publication = p.id_publication) AS hashtagsStr
  FROM Publication p
  JOIN Utilisateur u ON p.id_utilisateur = u.id_utilisateur
`;

/**
 * Convertit une ligne publication SQL au format front.
 * @param {Object} row Ligne de publication.
 * @return {Object} Publication au format front.
 */
function rowToFrontPost(row) {
  const filename = row.nom_fichier_photo || row.nom_fichier_video;
  return {
    id: row.id,
    author: row.author,
    avatar: row.avatar || null,
    mediaUrl: filename ? '/api/users/media/' + encodeURIComponent(filename) : '',
    isVideo: !row.nom_fichier_photo && Boolean(row.nom_fichier_video),
    caption: row.caption || '',
    createdAt: row.createdAt,
    visibility: row.est_public ? 'public' : 'friends',
    likesCount: row.likesCount,
    dislikesCount: row.dislikesCount,
    liked: false,
    disliked: false,
    comments: [],
    hashtags: row.hashtagsStr ? row.hashtagsStr.split(' ') : [],
  };
}

/**
 * Attache les commentaires à une liste de publications.
 * @param {Array<Object>} posts Publications (mutées en place).
 */
async function attachComments(posts) {
  if (posts.length === 0) return;
  const ids = posts.map((p) => p.id);
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await db.query(
    `SELECT c.id_commentaire AS id, c.id_publication AS postId,
            c.contenu AS text, c.date_commentaire AS createdAt,
            u.pseudonyme AS author
     FROM Commentaire c
     JOIN Utilisateur u ON c.id_utilisateur = u.id_utilisateur
     WHERE c.id_publication IN (${placeholders})
     ORDER BY c.date_commentaire ASC`,
    ids,
  );
  const byPost = new Map();
  for (const c of rows) {
    if (!byPost.has(c.postId)) byPost.set(c.postId, []);
    byPost.get(c.postId).push({
      id: c.id,
      author: c.author,
      text: c.text,
      createdAt: c.createdAt,
    });
  }
  for (const post of posts) {
    post.comments = byPost.get(post.id) || [];
  }
}

/**
 * Attache l'état like/dislike de l'utilisateur courant.
 * @param {Array<Object>} posts Publications (mutées en place).
 * @param {?number} userId Identifiant utilisateur (null si anonyme).
 */
async function attachUserLikes(posts, userId) {
  if (!userId || posts.length === 0) return;
  const ids = posts.map((p) => p.id);
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await db.query(
    `SELECT id_publication AS postId, est_un_like
     FROM Like_Publication
     WHERE id_utilisateur = ? AND id_publication IN (${placeholders})`,
    [userId, ...ids],
  );
  const byPost = new Map(rows.map((r) => [r.postId, r.est_un_like]));
  for (const post of posts) {
    const state = byPost.get(post.id);
    post.liked = state === 1;
    post.disliked = state === 0;
  }
}

/**
 * Exécute une requête de sélection de publications et la met en forme.
 * @param {string} suffix Clause WHERE/ORDER/LIMIT à concaténer.
 * @param {Array<*>} params Paramètres de la requête.
 * @param {?number} userId Identifiant utilisateur (état like).
 * @return {Promise<Array<Object>>} Publications au format front.
 */
async function queryPosts(suffix, params, userId) {
  const [rows] = await db.query(POST_SELECT + suffix, params);
  const posts = rows.map(rowToFrontPost);
  await attachComments(posts);
  await attachUserLikes(posts, userId);
  return posts;
}

/**
 * Retourne les compteurs like/dislike d'une publication.
 * @param {number} postId Identifiant de la publication.
 * @return {Promise<Object>} {likesCount, dislikesCount}.
 */
async function getLikeCounts(postId) {
  const [[row]] = await db.query(
    `SELECT (SELECT COUNT(*) FROM Like_Publication
              WHERE id_publication = ? AND est_un_like = 1) AS likesCount,
            (SELECT COUNT(*) FROM Like_Publication
              WHERE id_publication = ? AND est_un_like = 0) AS dislikesCount`,
    [postId, postId],
  );
  return row;
}

/**
 * Extrait les hashtags d'un texte (#mot), les enregistre dans la table
 * Hashtag et les lie à la publication dans Contient_Tag.
 * @param {number} postId Identifiant de la publication.
 * @param {string} caption Texte de la publication.
 */
async function linkHashtags(postId, caption) {
  const tags = (caption || '').match(/#[\wàâäéèêëîïôöùûüç]+/gi) || [];
  const unique = [...new Set(tags.map((t) => t.slice(1)))];
  for (const tag of unique) {
    const [rows] = await db.query(
      'SELECT id_hashtag FROM Hashtag WHERE nom_hashtag = ?',
      [tag],
    );
    let hashtagId = rows.length > 0 ? rows[0].id_hashtag : null;
    if (!hashtagId) {
      const [result] = await db.query(
        'INSERT INTO Hashtag (nom_hashtag) VALUES (?)',
        [tag],
      );
      hashtagId = result.insertId;
    }
    await db.query(
      'INSERT IGNORE INTO Contient_Tag (id_publication, id_hashtag) VALUES (?, ?)',
      [postId, hashtagId],
    );
  }
}

// ============================================================
//  DISPONIBILITÉ & AUTHENTIFICATION
// ============================================================

app.get('/api/auth/ping', (req, res) => {
  res.json({status: 'ok', service: 'instaclone-api', database: config.db.database});
});

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

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT pseudonyme FROM Utilisateur');
    res.json(rows.map((r) => r.pseudonyme));
  } catch (err) {
    console.error('Erreur liste utilisateurs :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

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

app.get('/api/users/me', authRequired, async (req, res) => {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      res.status(404).json({error: 'Utilisateur introuvable'});
      return;
    }

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

// ============================================================
//  PROFIL PUBLIC D'UN UTILISATEUR
// ============================================================

/** GET /api/users/:pseudonyme — profil public + publications. */
app.get('/api/users/:pseudonyme', async (req, res) => {
  try {
    const pseudo = String(req.params.pseudonyme || '').trim();
    const [rows] = await db.query(
      'SELECT * FROM Utilisateur WHERE pseudonyme = ?',
      [pseudo],
    );
    const user = rows[0];
    if (!user) {
      res.status(404).json({error: 'Utilisateur introuvable'});
      return;
    }

    const [[p]] = await db.query(
      'SELECT COUNT(*) AS c FROM Publication WHERE id_utilisateur = ?',
      [user.id_utilisateur],
    );
    const [[f]] = await db.query(
      'SELECT COUNT(*) AS c FROM Ami WHERE id_receveur = ?',
      [user.id_utilisateur],
    );
    const [[g]] = await db.query(
      'SELECT COUNT(*) AS c FROM Ami WHERE id_demandeur = ?',
      [user.id_utilisateur],
    );

    let posts = [];
    try {
      const [prows] = await db.query(
        `SELECT id_publication, nom_fichier_photo, nom_fichier_video
         FROM Publication
         WHERE id_utilisateur = ? AND est_supprimer = 0
         ORDER BY date_publication DESC`,
        [user.id_utilisateur],
      );
      posts = prows
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

    res.json({
      username: user.pseudonyme,
      name: [user.prenom, user.nom].filter(Boolean).join(' ').trim(),
      avatar: user.photo_profil || null,
      bio: user.bio || '',
      postsCount: p.c,
      followersCount: f.c,
      followingCount: g.c,
      posts,
    });
  } catch (err) {
    console.error('Erreur profil public :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

// ============================================================
//  PUBLICATIONS
// ============================================================

/** GET /api/posts — fil d'actualité. */
app.get('/api/posts', authOptional, async (req, res) => {
  try {
    const posts = await queryPosts(
      'WHERE p.est_supprimer = 0 AND p.est_cacher = 0 ' +
      'ORDER BY p.date_publication DESC LIMIT 50',
      [],
      req.userId,
    );
    res.json(posts);
  } catch (err) {
    console.error('Erreur fil :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

/** GET /api/posts/trending — publications populaires. */
app.get('/api/posts/trending', authOptional, async (req, res) => {
  try {
    const posts = await queryPosts(
      'WHERE p.est_supprimer = 0 AND p.est_cacher = 0 AND p.est_public = 1 ' +
      'ORDER BY likesCount DESC, p.date_publication DESC LIMIT 20',
      [],
      req.userId,
    );
    res.json(posts);
  } catch (err) {
    console.error('Erreur tendances :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

/** GET /api/posts/search?q= — recherche par texte, auteur ou hashtag. */
app.get('/api/posts/search', authOptional, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().replace(/^#/, '');
    if (!q) {
      res.json([]);
      return;
    }
    const posts = await queryPosts(
      `WHERE p.est_supprimer = 0 AND p.est_cacher = 0
         AND (p.texte_description LIKE ? OR u.pseudonyme LIKE ?
              OR EXISTS (SELECT 1 FROM Contient_Tag ct
                         JOIN Hashtag h ON ct.id_hashtag = h.id_hashtag
                         WHERE ct.id_publication = p.id_publication
                           AND h.nom_hashtag LIKE ?))
       ORDER BY p.date_publication DESC LIMIT 20`,
      [`%${q}%`, `%${q}%`, `%${q}%`],
      req.userId,
    );
    res.json(posts);
  } catch (err) {
    console.error('Erreur recherche publications :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

/** GET /api/posts/:id — détail d'une publication. */
app.get('/api/posts/:id', authOptional, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const posts = await queryPosts(
      'WHERE p.id_publication = ?',
      [postId],
      req.userId,
    );
    if (posts.length === 0) {
      res.status(404).json({error: 'Publication introuvable'});
      return;
    }
    res.json(posts[0]);
  } catch (err) {
    console.error('Erreur publication :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

/** POST /api/posts — création avec média (multipart : champ "media"). */
app.post('/api/posts', authRequired, upload.single('media'), async (req, res) => {
  try {
    const {caption, visibility} = req.body || {};
    if (!req.file) {
      res.status(400).json({error: 'Aucun fichier média fourni'});
      return;
    }

    const isVideo = /^video\//.test(req.file.mimetype);
    const estPublic = visibility === 'friends' ? 0 : 1;

    const [result] = await db.query(
      `INSERT INTO Publication
         (texte_description, nom_fichier_photo, nom_fichier_video,
          date_publication, est_public, id_utilisateur)
       VALUES (?, ?, ?, NOW(), ?, ?)`,
      [
        caption || '',
        isVideo ? null : req.file.filename,
        isVideo ? req.file.filename : null,
        estPublic,
        req.userId,
      ],
    );

    await linkHashtags(result.insertId, caption || '');

    const posts = await queryPosts(
      'WHERE p.id_publication = ?',
      [result.insertId],
      req.userId,
    );
    res.status(201).json(posts[0]);
  } catch (err) {
    console.error('Erreur création publication :', err.message);
    res.status(500).json({error: 'Erreur serveur lors de la publication'});
  }
});

/** POST /api/posts/:id/like — bascule le like. */
app.post('/api/posts/:id/like', authRequired, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const {like} = req.body || {};

    await db.query(
      'DELETE FROM Like_Publication WHERE id_utilisateur = ? AND id_publication = ?',
      [req.userId, postId],
    );
    if (like) {
      await db.query(
        'INSERT INTO Like_Publication (id_utilisateur, id_publication, est_un_like) VALUES (?, ?, 1)',
        [req.userId, postId],
      );
    }
    await db.query(
      `UPDATE Publication
       SET nombre_like = (SELECT COUNT(*) FROM Like_Publication
                           WHERE id_publication = ? AND est_un_like = 1)
       WHERE id_publication = ?`,
      [postId, postId],
    );

    const counts = await getLikeCounts(postId);
    res.json({...counts, liked: Boolean(like), disliked: false});
  } catch (err) {
    console.error('Erreur like :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

/** POST /api/posts/:id/dislike — bascule le dislike. */
app.post('/api/posts/:id/dislike', authRequired, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const {dislike} = req.body || {};

    await db.query(
      'DELETE FROM Like_Publication WHERE id_utilisateur = ? AND id_publication = ?',
      [req.userId, postId],
    );
    if (dislike) {
      await db.query(
        'INSERT INTO Like_Publication (id_utilisateur, id_publication, est_un_like) VALUES (?, ?, 0)',
        [req.userId, postId],
      );
    }

    const counts = await getLikeCounts(postId);
    res.json({...counts, liked: false, disliked: Boolean(dislike)});
  } catch (err) {
    console.error('Erreur dislike :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

/** POST /api/posts/:id/share — partage (incrémente le compteur). */
app.post('/api/posts/:id/share', authOptional, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    await db.query(
      'UPDATE Publication SET nombre_repost = nombre_repost + 1 WHERE id_publication = ?',
      [postId],
    );
    if (req.userId) {
      await db.query(
        'INSERT IGNORE INTO Repartager (id_utilisateur, id_publication, date_partage) VALUES (?, ?, NOW())',
        [req.userId, postId],
      );
    }
    res.json({
      success: true,
      shareUrl: `${req.protocol}://${req.get('host')}/post/${postId}`,
    });
  } catch (err) {
    console.error('Erreur partage :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

/** POST /api/posts/:id/republish — repartage (table Repartager). */
app.post('/api/posts/:id/republish', authRequired, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    await db.query(
      'INSERT IGNORE INTO Repartager (id_utilisateur, id_publication, date_partage) VALUES (?, ?, NOW())',
      [req.userId, postId],
    );
    await db.query(
      'UPDATE Publication SET nombre_repost = nombre_repost + 1 WHERE id_publication = ?',
      [postId],
    );
    res.json({success: true});
  } catch (err) {
    console.error('Erreur republication :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

/** POST /api/posts/:id/report — signalement de la publication. */
app.post('/api/posts/:id/report', authRequired, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const {motif} = req.body || {};

    await db.query(
      `INSERT INTO Signalement
         (motif, statut, date_signalement, est_automatique, id_utilisateur, id_publication)
       VALUES (?, 'En attente', NOW(), 0, ?, ?)`,
      [motif || 'Signalement utilisateur', req.userId, postId],
    );
    await db.query(
      'UPDATE Publication SET nombre_signalement = nombre_signalement + 1 WHERE id_publication = ?',
      [postId],
    );
    res.json({success: true});
  } catch (err) {
    console.error('Erreur signalement :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

// ============================================================
//  COMMENTAIRES
// ============================================================

/** GET /api/posts/:id/comments — liste des commentaires. */
app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const [rows] = await db.query(
      `SELECT c.id_commentaire AS id, c.contenu AS text,
              c.date_commentaire AS createdAt, u.pseudonyme AS author
       FROM Commentaire c
       JOIN Utilisateur u ON c.id_utilisateur = u.id_utilisateur
       WHERE c.id_publication = ?
       ORDER BY c.date_commentaire ASC`,
      [postId],
    );
    res.json(rows);
  } catch (err) {
    console.error('Erreur commentaires :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

/** POST /api/posts/:id/comments — ajout d'un commentaire. */
app.post('/api/posts/:id/comments', authRequired, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const {text} = req.body || {};
    if (!text || !String(text).trim()) {
      res.status(400).json({error: 'Le commentaire est vide'});
      return;
    }

    const [result] = await db.query(
      `INSERT INTO Commentaire (contenu, date_commentaire, id_publication, id_utilisateur)
       VALUES (?, NOW(), ?, ?)`,
      [String(text).trim(), postId, req.userId],
    );

    const user = await findUserById(req.userId);
    res.status(201).json({
      id: result.insertId,
      author: user ? user.pseudonyme : 'inconnu',
      text: String(text).trim(),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Erreur ajout commentaire :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

// ============================================================
//  HASHTAGS
// ============================================================

/** GET /api/hashtags — hashtags avec compteurs de publications. */
app.get('/api/hashtags', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT h.nom_hashtag, COUNT(ct.id_publication) AS count
       FROM Hashtag h
       LEFT JOIN Contient_Tag ct ON ct.id_hashtag = h.id_hashtag
       GROUP BY h.id_hashtag, h.nom_hashtag
       ORDER BY count DESC, h.nom_hashtag ASC`,
    );
    res.json(rows.map((r) => ({tag: '#' + r.nom_hashtag, count: r.count})));
  } catch (err) {
    console.error('Erreur hashtags :', err.message);
    res.status(500).json({error: 'Erreur serveur'});
  }
});

// Médias servis en statique (chemin sous /api/users pour passer
// par le même proxy Apache que l'API).
app.use('/api/users/media', express.static(uploadsDir));

app.listen(config.port, () => {
  console.log(`API InstaClone démarrée sur http://localhost:${config.port}`);
  console.log(`Base : ${config.db.database} @ ${config.db.host}:${config.db.port}`);
});
