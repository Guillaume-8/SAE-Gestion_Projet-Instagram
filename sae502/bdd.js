// bdd.js - Simulation des tables SQLite

const db = {
  utilisateur: [
    { Id_utilisateur: 1, Pseudonyme: 'Enes' },
    { Id_utilisateur: 2, Pseudonyme: 'Lucas' },
    { Id_utilisateur: 3, Pseudonyme: 'Ines' }
  ],
  groupe: [], // Contient les associations id_groupe <-> Pseudonyme
  message: []
};

// 1. Démarrer ou Récupérer un DM 1-à-1 entre 2 utilisateurs
async function getOrCreateDM(pseudo1, pseudo2) {
  // Recherche d'un groupe existant avec exactement ces 2 personnes
  const groupIds = [...new Set(db.groupe.map(g => g.id_groupe))];
  
  for (const id of groupIds) {
    const meMbres = db.groupe.filter(g => g.id_groupe === id).map(g => g["Pseudonyme Utilisateur"]);
    if (meMbres.length === 2 && meMbres.includes(pseudo1) && meMbres.includes(pseudo2)) {
      return id; // DM déjà existant trouvé
    }
  }

  // Si aucun DM n'existe, on en crée un nouveau
  const newGroupId = Date.now();
  db.groupe.push({ id_groupe: newGroupId, id_utilisateur: 1, id_notification: null, "Pseudonyme Utilisateur": pseudo1 });
  db.groupe.push({ id_groupe: newGroupId, id_utilisateur: 2, id_notification: null, "Pseudonyme Utilisateur": pseudo2 });
  
  return newGroupId;
}

// 2. Créer un Groupe avec plusieurs membres (3+)
async function createGroup(createurPseudo, membresPseudos) {
  const newGroupId = Date.now();
  const tousLesMembres = [createurPseudo, ...membresPseudos];

  tousLesMembres.forEach((pseudo, index) => {
    db.groupe.push({
      id_groupe: newGroupId,
      id_utilisateur: index + 1,
      id_notification: null,
      "Pseudonyme Utilisateur": pseudo.trim()
    });
  });

  return newGroupId;
}

// 3. Sauvegarder un message
async function saveMessage({ pseudonyme, idGroupe, idNotification = null, contenu }) {
  const newMessage = {
    id_message: db.message.length + 1,
    Pseudonyme_utilisateur: pseudonyme,
    id_groupe: parseInt(idGroupe),
    id_notification: idNotification,
    Contenu_message: contenu,
    created_at: new Date().toISOString()
  };
  db.message.push(newMessage);
  return newMessage;
}

// 4. Récupérer les messages
async function getGroupMessages(idGroupe) {
  return db.message.filter(m => m.id_groupe === parseInt(idGroupe));
}

module.exports = {
  getOrCreateDM,
  createGroup,
  saveMessage,
  getGroupMessages
};