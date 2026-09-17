---
sidebar_position: 7
---

# WebSockets (messagerie temps réel)
---

# Messagerie instantanée (Style Instagram)

On a développé un module de messagerie qui permet d'échanger en direct, soit en privé à deux, soit dans un groupe. Pour concevoir ce projet, on s'est appuyé sur l'IA et sur les exercices de la SAÉ de M. Drouhin sur les systèmes de messagerie.

---

## Fonctionnement général et choix techniques

L'application marche avec un système d'événements entre le client et le serveur. On a choisi d'utiliser **Socket.IO** (basé sur le protocole **WebSocket**) pour plusieurs raisons :

* **Messages instantanés :** Les données s'envoient immédiatement, sans avoir besoin de recharger la page.
* **Mise à jour en direct :** Le serveur prévient tout de suite les utilisateurs quand il se passe quelque chose (un nouveau message, un émoji ou une réaction).
* **Simplicité :** C'est une technologie qu'on connaissait déjà et ça nous évite de monter une usine à gaz pour faire tourner le projet en local.

---

## Stockage et base de données (`bdd.js`)

Pour conserver les données, on utilise une base **SQLite**. Tout le code qui touche à la base de données est regroupé dans le fichier `bdd.js`.

### Ce qu'on stocke dans la base

* **Utilisateurs :** Les pseudos de chaque personne.
* **Groupes :** Les salons de discussion (que ce soit une conversation privée à deux ou un groupe).
* **Messages :** L'historique des textes envoyés, avec la date, l'heure et l'expéditeur.
* **Réactions :** Les émojis posés sous les messages.

### À quoi sert `bdd.js` ?

Ce fichier contient les fonctions pour manipuler la base :
1. **Création des tables :** Il monte la structure de la base au démarrage.
2. **Gestion des membres :** Il ajoute les utilisateurs et crée les groupes.
3. **Gestion des messages :** Il enregistre les envois, récupère l'historique et permet de supprimer une conversation.

---

## Le rôle du serveur (`index.js`)

Le fichier `index.js` fait le lien entre l'interface sur le navigateur, la base de données et le réseau. Il tourne avec **Node.js et Express**.

### Les requêtes classiques (API REST)

On passe par des routes HTTP classiques pour charger des éléments lourds ou ponctuels :
* Récupérer la liste des conversations d'un utilisateur.
* Charger tout l'historique des messages d'un groupe.
* Créer ou supprimer un groupe.
* Charger la liste des membres pour la recherche automatique.

### Les échanges en direct (Socket.IO)

En parallèle, Socket.IO maintient une connexion ouverte en permanence pour gérer le direct :
* **Salles de discussion :** Chaque utilisateur rejoint la "room" de son groupe pour ne pas recevoir les messages des autres.
* **Envoi des messages et images :** Dès qu'un texte ou une image est envoyé, il est renvoyé tout de suite aux autres membres.
* **Réactions :** Ajout ou retrait des émojis en temps réel.
* **Indicateur de saisie :** Affichage du message « est en train d'écrire... » quand quelqu'un tape au clavier, avec un délai d'inactivité pour éviter de spammer le réseau.

---

## Ce que voit l'utilisateur (`site.html`)

L'interface a été pensée pour ressembler aux applications de messagerie actuelles :

* **Profil et liste des chats :** On entre son pseudo pour voir ses conversations, le dernier message reçu, la date et si le message a été lu.
* **Créer une discussion :** Une fenêtre permet d'ouvrir une discussion ou un groupe en tapant les premières lettres d'un pseudo (autocomplétion).
* **Dans la discussion :**
  * Un menu pour choisir des émojis.
  * Un moteur de recherche GIF (via l'API Giphy).
  * L'envoi d'images depuis son ordinateur, qu'on peut agrandir en cliquant dessus.
* **Separateurs de date :** La date et l'heure s'affichent automatiquement entre deux messages s'il y a plus de deux heures d'écart.

---

## Comment ça se passe quand on envoie un message ?

1. **L'utilisateur fait une action :** Il clique sur envoyer ou pose une réaction.
2. **Le navigateur l'envoie :** L'information part vers `index.js` (via Socket.IO ou une requête API).
3. **Le serveur traite :** `index.js` fait son travail et demande à `bdd.js` d'enregistrer l'action dans la base.
4. **Mise à jour pour tout le monde :** Le serveur prévient les autres personnes du groupe, et leur écran se met à jour sans rafraîchir la page.
