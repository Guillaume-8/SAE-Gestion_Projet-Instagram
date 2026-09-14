
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

    // Création de la table Reaction_Message si elle n'existe pas
    await db.run(`
      CREATE TABLE IF NOT EXISTS Reaction_Message(
        id_reaction INTEGER PRIMARY KEY AUTOINCREMENT,
        id_message INT NOT NULL,
        id_utilisateur INT NOT NULL,
        emoji VARCHAR(10),
        FOREIGN KEY(id_message) REFERENCES Message(id_message),
        FOREIGN KEY(id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
      )
    `);

    // Création de la table Message_History si elle n'existe pas
    await db.run(`
      CREATE TABLE IF NOT EXISTS Message_History(
        id_history INTEGER PRIMARY KEY AUTOINCREMENT,
        id_message INT NOT NULL,
        ancien_contenu TEXT NOT NULL,
        date_modification DATETIME NOT NULL,
        FOREIGN KEY(id_message) REFERENCES Message(id_message) ON DELETE CASCADE
      )
    `);
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
 * Récupère tous les messages d'un groupe avec le pseudonyme de l'expéditeur et les réactions.
 */
async function obtenirMessagesGroupe(idGroupe) {
  const database = await getDb();

  const messages = await database.all(
    `SELECT 
        m.id_message,
        m.contenu_message AS Contenu_message,
        m.date_envoie AS Date_message,
        u.pseudonyme AS Pseudonyme_utilisateur,
        CASE WHEN (SELECT COUNT(*) FROM Message_History mh WHERE mh.id_message = m.id_message) > 0 THEN 1 ELSE 0 END AS est_modifie
     FROM Message m
     JOIN Utilisateur u ON m.id_expediteur = u.id_utilisateur
     WHERE m.id_groupe = ?
     ORDER BY m.date_envoie ASC`,
    [idGroupe]
  );

  // Pour chaque message, récupérer les réactions
  for (const msg of messages) {
    const reactions = await database.all(
      `SELECT r.emoji, u.pseudonyme 
       FROM Reaction_Message r 
       JOIN Utilisateur u ON r.id_utilisateur = u.id_utilisateur 
       WHERE r.id_message = ?`,
      [msg.id_message]
    );
    msg.reactions = reactions;
  }

  return messages;
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

/**
 * Ajoute une réaction à un message
 */
async function ajouterReaction(idMessage, pseudonyme, emoji) {
  const database = await getDb();

  const user = await database.get(
    'SELECT id_utilisateur FROM Utilisateur WHERE pseudonyme = ?',
    [pseudonyme]
  );
  if (!user) throw new Error("Utilisateur introuvable");

  // Vérifier si l'utilisateur a déjà réagi avec cet emoji
  const existing = await database.get(
    'SELECT id_reaction FROM Reaction_Message WHERE id_message = ? AND id_utilisateur = ? AND emoji = ?',
    [idMessage, user.id_utilisateur, emoji]
  );

  if (existing) {
    await database.run(
      'DELETE FROM Reaction_Message WHERE id_reaction = ?',
      [existing.id_reaction]
    );
    return 'removed';
  } else {
    await database.run(
      'INSERT INTO Reaction_Message (id_message, id_utilisateur, emoji) VALUES (?, ?, ?)',
      [idMessage, user.id_utilisateur, emoji]
    );
    return 'added';
  }
}

/**
 * Récupère tous les utilisateurs
 */
async function obtenirTousLesUtilisateurs() {
  const database = await getDb();
  const users = await database.all('SELECT pseudonyme FROM Utilisateur');
  return users.map(u => u.pseudonyme);
}

/**
 * Supprime un message (et ses réactions)
 */
async function supprimerMessage(idMessage, pseudonyme) {
  const database = await getDb();

  const user = await database.get(
    'SELECT id_utilisateur FROM Utilisateur WHERE pseudonyme = ?',
    [pseudonyme]
  );
  if (!user) throw new Error("Utilisateur introuvable");

  const msg = await database.get(
    'SELECT id_expediteur FROM Message WHERE id_message = ?',
    [idMessage]
  );

  if (!msg || msg.id_expediteur !== user.id_utilisateur) {
    throw new Error("Non autorisé à supprimer ce message");
  }

  // Delete history and reactions first to avoid foreign key constraints
  await database.run('DELETE FROM Message_History WHERE id_message = ?', [idMessage]);
  await database.run('DELETE FROM Reaction_Message WHERE id_message = ?', [idMessage]);
  // Delete the message
  await database.run('DELETE FROM Message WHERE id_message = ?', [idMessage]);
}

/**
 * Modifie un message (s'il date de moins de 10 min)
 */
async function modifierMessage(idMessage, pseudonyme, nouveauContenu) {
  const database = await getDb();

  const user = await database.get(
    'SELECT id_utilisateur FROM Utilisateur WHERE pseudonyme = ?',
    [pseudonyme]
  );
  if (!user) throw new Error("Utilisateur introuvable");

  const msg = await database.get(
    'SELECT id_expediteur, date_envoie FROM Message WHERE id_message = ?',
    [idMessage]
  );

  if (!msg || msg.id_expediteur !== user.id_utilisateur) {
    throw new Error("Non autorisé à modifier ce message");
  }

  const now = new Date();
  const sentDate = new Date(msg.date_envoie);
  const diffMinutes = (now - sentDate) / (1000 * 60);

  if (diffMinutes > 10) {
    throw new Error("Délai de 10 minutes dépassé pour la modification");
  }

  // Obtenir le contenu actuel du message pour l'historique
  const currentMsg = await database.get('SELECT contenu_message FROM Message WHERE id_message = ?', [idMessage]);

  if (currentMsg && currentMsg.contenu_message !== nouveauContenu) {
    await database.run(
      'INSERT INTO Message_History (id_message, ancien_contenu, date_modification) VALUES (?, ?, ?)',
      [idMessage, currentMsg.contenu_message, now.toISOString()]
    );
  }

  await database.run(
    'UPDATE Message SET contenu_message = ? WHERE id_message = ?',
    [nouveauContenu, idMessage]
  );
}

/**
 * Récupère les 3 dernières modifications d'un message
 */
async function obtenirHistoriqueMessage(idMessage) {
  const database = await getDb();
  return await database.all(
    'SELECT ancien_contenu, date_modification FROM Message_History WHERE id_message = ? ORDER BY date_modification DESC LIMIT 3',
    [idMessage]
  );
}

/**
 * Récupère les détails d'un groupe (nom et membres)
 */
async function obtenirDetailsGroupe(idGroupe) {
  const database = await getDb();
  const groupe = await database.get('SELECT nom_groupe, photo_groupe FROM Groupe WHERE id_groupe = ?', [idGroupe]);
  const membres = await database.all(
    `SELECT u.pseudonyme 
     FROM Appartient_Groupe ag 
     JOIN Utilisateur u ON ag.id_utilisateur = u.id_utilisateur 
     WHERE ag.id_groupe = ?`,
    [idGroupe]);

  if (!groupe) return null;
  return {
    nom_groupe: groupe.nom_groupe,
    photo_groupe: groupe.photo_groupe,
    membres: membres.map(m => m.pseudonyme)
  };
}

/**
 * Modifie le nom d'un groupe
 */
async function modifierNomGroupe(idGroupe, nouveauNom) {
  const database = await getDb();
  await database.run('UPDATE Groupe SET nom_groupe = ? WHERE id_groupe = ?', [nouveauNom, idGroupe]);
}

/**
 * Modifie la photo d'un groupe
 */
async function modifierPhotoGroupe(idGroupe, cheminPhoto) {
  const database = await getDb();
  await database.run('UPDATE Groupe SET photo_groupe = ? WHERE id_groupe = ?', [cheminPhoto, idGroupe]);
}

module.exports = {
  getDb,
  ajouterUtilisateur,
  creerGroupe,
  ajouterMessage,
  obtenirMessagesGroupe,
  obtenirMembresGroupe,
  supprimerConversationUtilisateur,
  ajouterReaction,
  obtenirTousLesUtilisateurs,
  supprimerMessage,
  modifierMessage,
  obtenirHistoriqueMessage,
  obtenirDetailsGroupe,
  modifierNomGroupe,
  modifierPhotoGroupe
};

