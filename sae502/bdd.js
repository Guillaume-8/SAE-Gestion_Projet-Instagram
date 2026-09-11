const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let db = null;

// Initialisation et connexion à la base SQLite
async function getDb() {
  if (!db) {
    db = await open({
      filename: './database_lifeinvader.db', // Remplace par le nom/chemin de ton fichier .sqlite
      driver: sqlite3.Database
    });
    // Active la prise en compte des clés étrangères
    await db.run('PRAGMA foreign_keys = ON;');
  }
  return db;
}

/**
 * Ajoute un utilisateur s'il n'existe pas encore (basé sur le pseudonyme).
 */
async function ajouterUtilisateur(pseudonyme) {
  const database = await getDb();
  const user = await database.get(
    'SELECT id_utilisateur FROM Utilisateur WHERE pseudonyme = ?',
    [pseudonyme]
  );

  if (!user) {
    const res = await database.run(
      'INSERT INTO Utilisateur (pseudonyme) VALUES (?)',
      [pseudonyme]
    );
    return res.lastID;
  }
  return user.id_utilisateur;
}

/**
 * Crée un groupe et associe les membres dans Appartient_Groupe.
 */
async function creerGroupe(idGroupe, pseudonymes) {
  const database = await getDb();

  // 1. Insertion du groupe
  await database.run(
    'INSERT INTO Groupe (id_groupe, nom_groupe, date_creation) VALUES (?, ?, ?)',
    [idGroupe, `Groupe ${idGroupe}`, new Date().toISOString()]
  );

  // 2. Association des membres via leur id_utilisateur
  for (const pseudo of pseudonymes) {
    const user = await database.get(
      'SELECT id_utilisateur FROM Utilisateur WHERE pseudonyme = ?',
      [pseudo]
    );

    if (user) {
      await database.run(
        'INSERT INTO Appartient_Groupe (id_utilisateur, id_groupe) VALUES (?, ?)',
        [user.id_utilisateur, idGroupe]
      );
    }
  }
}

/**
 * Ajoute un message envoyé par un utilisateur dans un groupe.
 */
async function ajouterMessage(pseudonyme, idGroupe, contenu) {
  const database = await getDb();

  const user = await database.get(
    'SELECT id_utilisateur FROM Utilisateur WHERE pseudonyme = ?',
    [pseudonyme]
  );

  if (!user) throw new Error("Utilisateur introuvable");

  const res = await database.run(
    'INSERT INTO Message (contenu_message, date_envoie, id_expediteur, id_groupe) VALUES (?, ?, ?, ?)',
    [contenu, new Date().toISOString(), user.id_utilisateur, idGroupe]
  );

  return res.lastID;
}

/**
 * Récupère tous les messages d'un groupe avec le pseudonyme de l'expéditeur.
 */
async function obtenirMessagesGroupe(idGroupe) {
  const database = await getDb();

  return await database.all(
    `SELECT 
        m.id_message,
        m.contenu_message AS Contenu_message,
        m.date_envoie AS Date_message,
        u.pseudonyme AS Pseudonyme_utilisateur
     FROM Message m
     JOIN Utilisateur u ON m.id_expediteur = u.id_utilisateur
     WHERE m.id_groupe = ?
     ORDER BY m.date_envoie ASC`,
    [idGroupe]
  );
}

/**
 * Récupère les pseudonymes de tous les membres d'un groupe.
 */
async function obtenirMembresGroupe(idGroupe) {
  const database = await getDb();
  const rows = await database.all(
    `SELECT u.pseudonyme 
     FROM Appartient_Groupe ag
     JOIN Utilisateur u ON ag.id_utilisateur = u.id_utilisateur
     WHERE ag.id_groupe = ?`,
    [idGroupe]
  );
  return rows.map(r => r.pseudonyme);
}

/**
 * Supprime la relation entre un utilisateur et un groupe.
 */
async function supprimerConversationUtilisateur(idGroupe, pseudonyme) {
  const database = await getDb();
  const user = await database.get(
    'SELECT id_utilisateur FROM Utilisateur WHERE pseudonyme = ?',
    [pseudonyme]
  );

  if (user) {
    await database.run(
      'DELETE FROM Appartient_Groupe WHERE id_groupe = ? AND id_utilisateur = ?',
      [idGroupe, user.id_utilisateur]
    );
  }
}

module.exports = {
  getDb,
  ajouterUtilisateur,
  creerGroupe,
  ajouterMessage,
  obtenirMessagesGroupe,
  obtenirMembresGroupe,
  supprimerConversationUtilisateur
};

