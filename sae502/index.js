const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bdd = require('./bdd');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/site.html');
});

// Route REST pour créer/récupérer un DM 1-à-1
app.post('/api/dm', async (req, res) => {
  const { pseudo1, pseudo2 } = req.body;
  const idGroupe = await bdd.getOrCreateDM(pseudo1, pseudo2);
  res.json({ idGroupe });
});

// Route REST pour créer un Groupe
app.post('/api/groupe', async (req, res) => {
  const { createur, membres } = req.body; // membres = tableau de pseudos
  const idGroupe = await bdd.createGroup(createur, membres);
  res.json({ idGroupe });
});

// Récupérer l'historique
app.get('/api/messages/:idGroupe', async (req, res) => {
  const messages = await bdd.getGroupMessages(req.params.idGroupe);
  res.json(messages);
});

// WebSockets
io.on('connection', (socket) => {
  socket.on('join_group', (idGroupe) => {
    socket.join(`group_${idGroupe}`);
  });

  socket.on('send_message', async (data) => {
    const savedMsg = await bdd.saveMessage(data);
    io.to(`group_${data.idGroupe}`).emit('receive_message', savedMsg);
  });

  socket.on('typing_start', ({ idGroupe, pseudonyme }) => {
    socket.to(`group_${idGroupe}`).emit('user_typing', { idGroupe, pseudonyme, isTyping: true });
  });

  socket.on('typing_stop', ({ idGroupe, pseudonyme }) => {
    socket.to(`group_${idGroupe}`).emit('user_typing', { idGroupe, pseudonyme, isTyping: false });
  });
});

server.listen(3000, () => {
  console.log('Serveur lancé sur http://localhost:3000');
});