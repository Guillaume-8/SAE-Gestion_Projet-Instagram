const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bdd = require('./bdd.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/site.html');
});

app.get('/api/messages/:idGroupe', async (req, res) => {
  try {
    const messages = await bdd.obtenirMessagesGroupe(req.params.idGroupe);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/dm', async (req, res) => {
  try {
    const { pseudo1, pseudo2 } = req.body;
    const idGroupe = Math.floor(100 + Math.random() * 9000);

    await bdd.ajouterUtilisateur(pseudo1);
    await bdd.ajouterUtilisateur(pseudo2);
    await bdd.creerGroupe(idGroupe, [pseudo1, pseudo2]);

    const newConv = {
      id: idGroupe,
      type: 'DM',
      members: [pseudo1, pseudo2],
      lastMessage: 'Discussion démarrée',
      lastTime: 'Aujourd\'hui'
    };

    io.emit('group_created', newConv);

    res.json({ idGroupe, conv: newConv });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/groupe', async (req, res) => {
  try {
    const { createur, membres } = req.body;
    const tousLesMembres = [createur, ...membres];
    const idGroupe = Math.floor(100 + Math.random() * 9000);

    for (const m of tousLesMembres) {
      await bdd.ajouterUtilisateur(m);
    }
    await bdd.creerGroupe(idGroupe, tousLesMembres);

    const groupName = `Groupe (${tousLesMembres.length})`;
    const newConv = {
      id: idGroupe,
      name: groupName,
      type: 'GROUPE',
      lastMessage: 'Groupe créé',
      lastTime: 'Aujourd\'hui',
      members: tousLesMembres
    };

    io.emit('group_created', newConv);

    res.json({ idGroupe, conv: newConv });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/conversations/:pseudonyme', async (req, res) => {
  try {
    const { pseudonyme } = req.params;
    const db = await bdd.getDb();
    
    const user = await db.get('SELECT id_utilisateur FROM Utilisateur WHERE pseudonyme = ?', [pseudonyme]);

    if (!user) return res.json([]);

    const groupes = await db.all(
      `SELECT g.id_groupe AS id, g.nom_groupe AS name 
       FROM Groupe g
       JOIN Appartient_Groupe ag ON g.id_groupe = ag.id_groupe
       WHERE ag.id_utilisateur = ?`,
      [user.id_utilisateur]
    );

    const conversations = await Promise.all(
      groupes.map(async (g) => {
        const members = await bdd.obtenirMembresGroupe(g.id);
        const lastMsg = await db.get(
          `SELECT m.contenu_message, m.date_envoie, u.pseudonyme 
           FROM Message m 
           JOIN Utilisateur u ON m.id_expediteur = u.id_utilisateur 
           WHERE m.id_groupe = ? 
           ORDER BY m.date_envoie DESC LIMIT 1`, 
           [g.id]
        );
        return {
          id: g.id,
          name: g.name,
          type: members.length === 2 ? 'DM' : 'GROUPE',
          members: members,
          lastMessage: lastMsg ? lastMsg.contenu_message : 'Discussion démarrée',
          lastMessageSender: lastMsg ? lastMsg.pseudonyme : null,
          lastMessageDate: lastMsg ? lastMsg.date_envoie : null
        };
      })
    );

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/conversations/:idGroupe', async (req, res) => {
  try {
    const { idGroupe } = req.params;
    const { pseudonyme } = req.body;

    await bdd.supprimerConversationUtilisateur(idGroupe, pseudonyme);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


io.on('connection', (socket) => {
  socket.on('join_group', (idGroupe) => {
    socket.join(`group_${idGroupe}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { pseudonyme, idGroupe, contenu } = data;
      const idMessage = await bdd.ajouterMessage(pseudonyme, idGroupe, contenu);

      const msg = {
        id_message: idMessage,
        Pseudonyme_utilisateur: pseudonyme,
        id_groupe: idGroupe,
        Contenu_message: contenu,
        Date_message: new Date(),
        reactions: []
      };

      io.to(`group_${idGroupe}`).emit('receive_message', msg);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('send_reaction', async (data) => {
    try {
      const { idMessage, pseudonyme, emoji, idGroupe } = data;
      await bdd.ajouterReaction(idMessage, pseudonyme, emoji);
      io.to(`group_${idGroupe}`).emit('receive_reaction', { idMessage, pseudonyme, emoji });
    } catch (err) {
      console.error(err);
    }
  });
});

server.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});