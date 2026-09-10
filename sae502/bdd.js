// bdd.js - Mock correspondant à votre structure SQL

// Tables simulées en mémoire
const db = {
  utilisateur: [
    { Id_utilisateur: 1, Pseudonyme: 'Enes', Amis: ['Lucas', 'Inès'] },
    { Id_utilisateur: 2, Pseudonyme: 'Lucas', Amis: ['Enes'] }
  ],
  groupe: [
    // Un groupe à 2 (Chat privé)
    { id_groupe: 101, id_utilisateur: 1, id_notification: null, "Pseudonyme Utilisateur": 'Enes' },
    { id_groupe: 101, id_utilisateur: 2, id_notification: null, "Pseudonyme Utilisateur": 'Lucas' },
    
    // Un groupe à 3+ (Chat de groupe)
    { id_groupe: 202, id_utilisateur: 1, id_notification: null, "Pseudonyme Utilisateur": 'Enes' },
    { id_groupe: 202, id_utilisateur: 2, id_notification: null, "Pseudonyme Utilisateur": 'Lucas' },
    { id_groupe: 202, id_utilisateur: 3, id_notification: null, "Pseudonyme Utilisateur": 'Inès' }
  ],
  message: []
};

// Fonctions simulant les requêtes SQL futures
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

async function getGroupMessages(idGroupe) {
  return db.message.filter(m => m.id_groupe === parseInt(idGroupe));
}

async function getGroupMembers(idGroupe) {
  return db.groupe
    .filter(g => g.id_groupe === parseInt(idGroupe))
    .map(g => g["Pseudonyme Utilisateur"]);
}

module.exports = {
  saveMessage,
  getGroupMessages,
  getGroupMembers
};