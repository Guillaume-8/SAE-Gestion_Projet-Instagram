const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bdd = require('./bdd.js');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadsDir));

const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '_' + Math.random().toString(36).substr(2, 9) + ext);
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200 MB limit
});

app.post('/api/upload', (req, res) => {
  upload.single('media')(req, res, async function (err) {
    if (err) {
      console.error('Multer Error:', err);
      return res.status(500).json({ error: 'Upload failed: ' + err.message });
    }
    try {
      const { pseudonyme, idGroupe, mediaType, replyData } = req.body;
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      let prefix = mediaType === 'video' ? '[VIDEO]:' : '[IMAGE]:';
      let finalContenu = `${prefix}/uploads/${req.file.filename}`;
      
      if (replyData && replyData !== 'null' && replyData !== '') {
        let parsedReply;
        try { parsedReply = JSON.parse(replyData); } catch(e) {}
        if (parsedReply) {
          const replyBase64 = Buffer.from(JSON.stringify(parsedReply)).toString('base64');
          finalContenu = `[REPLY:${replyBase64}]${finalContenu}`;
        }
      }

      const idMessage = await bdd.ajouterMessage(pseudonyme, parseInt(idGroupe), finalContenu);
      const msg = {
        id_message: idMessage,
        Pseudonyme_utilisateur: pseudonyme,
        id_groupe: parseInt(idGroupe),
        Contenu_message: finalContenu,
        Date_message: new Date(),
        reactions: []
      };
      io.to(`group_${idGroupe}`).emit('nouveau_message', msg);
      res.json({ success: true, message: msg });
    } catch (dbErr) {
      console.error('Upload Error:', dbErr);
      res.status(500).json({ error: 'Database error' });
    }
  });
});

app.post('/api/upload-group-photo', (req, res) => {
  upload.single('photo')(req, res, async function (err) {
    if (err) {
      console.error('Multer Error:', err);
      return res.status(500).json({ error: 'Upload failed: ' + err.message });
    }
    try {
      const { idGroupe } = req.body;
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const cheminPhoto = `/uploads/${req.file.filename}`;
      await bdd.modifierPhotoGroupe(parseInt(idGroupe), cheminPhoto);
      
      io.to(`group_${idGroupe}`).emit('group_photo_changed', { idGroupe: parseInt(idGroupe), photo: cheminPhoto });
      res.json({ success: true, photo: cheminPhoto });
    } catch (dbErr) {
      console.error('Group Photo Upload Error:', dbErr);
      res.status(500).json({ error: 'Database error' });
    }
  });
});

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
      `SELECT g.id_groupe AS id, g.nom_groupe AS name, g.photo_groupe
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

app.get('/api/utilisateurs', async (req, res) => {
  try {
    const utilisateurs = await bdd.obtenirTousLesUtilisateurs();
    res.json(utilisateurs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/message-history/:idMessage', async (req, res) => {
  try {
    const { idMessage } = req.params;
    const history = await bdd.obtenirHistoriqueMessage(idMessage);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/groupe/:idGroupe/details', async (req, res) => {
  try {
    const { idGroupe } = req.params;
    const details = await bdd.obtenirDetailsGroupe(idGroupe);
    if (!details) return res.status(404).json({ error: "Groupe introuvable" });
    res.json(details);
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
      const { pseudonyme, idGroupe, contenu, replyData } = data;
      
      let finalContenu = contenu;
      if (replyData) {
        const replyBase64 = Buffer.from(JSON.stringify(replyData)).toString('base64');
        finalContenu = `[REPLY:${replyBase64}]${finalContenu}`;
      }

      const idMessage = await bdd.ajouterMessage(pseudonyme, idGroupe, finalContenu);

      const msg = {
        id_message: idMessage,
        Pseudonyme_utilisateur: pseudonyme,
        id_groupe: idGroupe,
        Contenu_message: finalContenu,
        Date_message: new Date(),
        reactions: []
      };

      io.to(`group_${idGroupe}`).emit('receive_message', msg);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('send_media', async (data) => {
    try {
      const { pseudonyme, idGroupe, mediaBase64, extension, mediaType, replyData } = data;
      const filename = Date.now() + '_' + Math.random().toString(36).substr(2, 9) + extension;
      const filepath = path.join(__dirname, 'uploads', filename);
      
      const base64Data = mediaBase64.replace(/^data:(image|video)\/\w+;base64,/, "");
      fs.writeFileSync(filepath, base64Data, 'base64');
      
      let prefix = mediaType === 'video' ? '[VIDEO]:' : '[IMAGE]:';
      let finalContenu = `${prefix}/uploads/${filename}`;
      if (replyData) {
        const replyBase64 = Buffer.from(JSON.stringify(replyData)).toString('base64');
        finalContenu = `[REPLY:${replyBase64}]${finalContenu}`;
      }

      const idMessage = await bdd.ajouterMessage(pseudonyme, idGroupe, finalContenu);

      const msg = {
        id_message: idMessage,
        Pseudonyme_utilisateur: pseudonyme,
        id_groupe: idGroupe,
        Contenu_message: finalContenu,
        Date_message: new Date(),
        reactions: []
      };

      io.to(`group_${idGroupe}`).emit('receive_message', msg);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('send_audio', async (data) => {
    try {
      const { pseudonyme, idGroupe, audioBase64, extension, replyData } = data;
      const filename = Date.now() + '_' + Math.random().toString(36).substr(2, 9) + extension;
      const filepath = path.join(__dirname, 'uploads', filename);
      
      const base64Data = audioBase64.replace(/^data:audio\/\w+(?:;\w+=\w+)?;base64,/, "");
      fs.writeFileSync(filepath, base64Data, 'base64');
      
      let finalContenu = `[AUDIO]:/uploads/${filename}`;
      if (replyData) {
        const replyBase64 = Buffer.from(JSON.stringify(replyData)).toString('base64');
        finalContenu = `[REPLY:${replyBase64}]${finalContenu}`;
      }

      const idMessage = await bdd.ajouterMessage(pseudonyme, idGroupe, finalContenu);

      const msg = {
        id_message: idMessage,
        Pseudonyme_utilisateur: pseudonyme,
        id_groupe: idGroupe,
        Contenu_message: finalContenu,
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
      const action = await bdd.ajouterReaction(idMessage, pseudonyme, emoji);
      io.to(`group_${idGroupe}`).emit('receive_reaction', { idMessage, pseudonyme, emoji, action });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('delete_message', async (data) => {
    try {
      const { idMessage, pseudonyme, idGroupe } = data;
      await bdd.supprimerMessage(idMessage, pseudonyme);
      io.to(`group_${idGroupe}`).emit('message_deleted', { idMessage });
    } catch (err) {
      socket.emit('message_error', { message: err.message });
      console.error(err);
    }
  });

  socket.on('edit_message', async (data) => {
    try {
      const { idMessage, pseudonyme, nouveauContenu, idGroupe } = data;
      await bdd.modifierMessage(idMessage, pseudonyme, nouveauContenu);
      io.to(`group_${idGroupe}`).emit('message_edited', { idMessage, nouveauContenu });
    } catch (err) {
      socket.emit('message_error', { message: err.message });
      console.error(err);
    }
  });

  socket.on('change_group_name', async (data) => {
    try {
      const { idGroupe, nouveauNom } = data;
      await bdd.modifierNomGroupe(idGroupe, nouveauNom);
      io.to(`group_${idGroupe}`).emit('group_name_changed', { idGroupe, nouveauNom });
    } catch (err) {
      console.error(err);
    }
  });
});

server.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});