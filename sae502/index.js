const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bdd = require('./bdd'); // Import de la BDD temporaire

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/site.html');
});

// Récupération de l'historique d'un groupe ou d'un chat à 2
app.get('/api/messages/:idGroupe', async (req, res) => {
  try {
    const messages = await bdd.getGroupMessages(req.params.idGroupe);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement des messages" });
  }
});

// Événements Socket.IO
io.on('connection', (socket) => {
  console.log(`Connecté : ${socket.id}`);

  socket.on('join_group', async (idGroupe) => {
    const roomName = `group_${idGroupe}`;
    socket.join(roomName);
    
    const membres = await bdd.getGroupMembers(idGroupe);
    console.log(`Socket ${socket.id} à rejoint le groupe ${idGroupe} (Membres: ${membres.join(', ')})`);
  });

  socket.on('send_message', async (data) => {
    const { pseudonyme, idGroupe, idNotification, contenu } = data;

    // Enregistrement dans la table "message"
    const savedMsg = await bdd.saveMessage({
      pseudonyme,
      idGroupe,
      idNotification,
      contenu
    });

    // Diffusion aux personnes du groupe/room (2 personnes ou plus)
    io.to(`group_${idGroupe}`).emit('receive_message', savedMsg);
  });

  socket.on('typing_start', ({ idGroupe, pseudonyme }) => {
    socket.to(`group_${idGroupe}`).emit('user_typing', { idGroupe, pseudonyme, isTyping: true });
  });

  socket.on('typing_stop', ({ idGroupe, pseudonyme }) => {
    socket.to(`group_${idGroupe}`).emit('user_typing', { idGroupe, pseudonyme, isTyping: false });
  });

  socket.on('disconnect', () => {
    console.log(`Déconnecté : ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log('Serveur lancé sur http://localhost:3000');
});