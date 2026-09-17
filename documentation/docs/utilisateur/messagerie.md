
# Messagerie LifeInvader

**SAE 502 — Gestion de Projet**

**Fichiers édités :** `site.html` · `index.js` · `bdd.js`

## Schéma chronologique du développement

## Schéma chronologique du développement

Le schéma ci-dessous présente les 16 fonctionnalités développées dans leur ordre chronologique, regroupées par phase.

<table>
<tbody>

<tr style={{background: '#2196F3', color: 'white', fontWeight: 'bold'}}><td width="40">1</td><td width="30">→</td><td>Interface de base et structure de la messagerie</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>
<tr style={{background: '#2196F3', color: 'white', fontWeight: 'bold'}}><td>2</td><td>→</td><td>Horodatage des messages et séparateurs de date</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>
<tr style={{background: '#2196F3', color: 'white', fontWeight: 'bold'}}><td>3</td><td>→</td><td>Gestion des conversations et messages non lus</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>

<tr style={{background: '#4CAF50', color: 'white', fontWeight: 'bold'}}><td>4</td><td>→</td><td>Sélecteur d'émojis avec pagination</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>
<tr style={{background: '#4CAF50', color: 'white', fontWeight: 'bold'}}><td>5</td><td>→</td><td>Catégories d'émojis (raccourcis)</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>
<tr style={{background: '#4CAF50', color: 'white', fontWeight: 'bold'}}><td>6</td><td>→</td><td>Réactions aux messages (temps réel)</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>
<tr style={{background: '#4CAF50', color: 'white', fontWeight: 'bold'}}><td>7</td><td>→</td><td>Toggle des réactions + restriction propres messages</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>

<tr style={{background: '#FF9800', color: 'white', fontWeight: 'bold'}}><td>8</td><td>→</td><td>Création de conversations avec autocomplétions</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>
<tr style={{background: '#FF9800', color: 'white', fontWeight: 'bold'}}><td>9</td><td>→</td><td>Envoi d'images et lightbox plein écran</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>
<tr style={{background: '#FF9800', color: 'white', fontWeight: 'bold'}}><td>10</td><td>→</td><td>Intégration des GIFs (API Giphy)</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>

<tr style={{background: '#F44336', color: 'white', fontWeight: 'bold'}}><td>11</td><td>→</td><td>Suppression, modification de messages + favicon</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>
<tr style={{background: '#F44336', color: 'white', fontWeight: 'bold'}}><td>12</td><td>→</td><td>Messages vocaux (enregistrement + lecture)</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>
<tr style={{background: '#F44336', color: 'white', fontWeight: 'bold'}}><td>13</td><td>→</td><td>Système de notifications complet</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>

<tr style={{background: '#9C27B0', color: 'white', fontWeight: 'bold'}}><td>14</td><td>→</td><td>Historique des modifications, vidéos et réponses (reply)</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>
<tr style={{background: '#9C27B0', color: 'white', fontWeight: 'bold'}}><td>15</td><td>→</td><td>Bouton envoyer dynamique, détails de groupe, galerie multimédia</td></tr>
<tr><td colSpan="2" align="center">↓</td><td></td></tr>
<tr style={{background: '#9C27B0', color: 'white', fontWeight: 'bold'}}><td>16</td><td>→</td><td>Indicateur de frappe et refonte UI des détails</td></tr>

</tbody>
</table>

### Légende des phases

<table>
<tbody>
<tr><td style={{background: '#2196F3', width: '30px'}}></td><td>Phase 1 - Fondations (structure, messages, conversations)</td></tr>
<tr><td style={{background: '#4CAF50', width: '30px'}}></td><td>Phase 2 - Interactions (emojis, réactions)</td></tr>
<tr><td style={{background: '#FF9800', width: '30px'}}></td><td>Phase 3 - Multimédia (images, GIFs, autocomplétion)</td></tr>
<tr><td style={{background: '#F44336', width: '30px'}}></td><td>Phase 4 - Avancé (suppression, vocaux, notifications)</td></tr>
<tr><td style={{background: '#9C27B0', width: '30px'}}></td><td>Phase 5 - Finalisation (historique, détails, indicateur de frappe)</td></tr>
</tbody>
</table>

## Introduction

Ce document présente l'ensemble des fonctionnalités développées pour le module de messagerie de l'application LifeInvader. Ce module constitue le cœur de la communication entre utilisateurs au sein de la plateforme.

La messagerie a été conçue pour offrir une expérience utilisateur moderne, inspirée d'Instagram, avec un design simple et de multiples fonctionnalités. Le développement s'est effectué à travers 16 versions successives, chacune apportant de nouvelles fonctionnalités.

L'architecture repose sur trois fichiers principaux :

- **`site.html`** : interface complète intégrant le HTML, le CSS et le JavaScript côté client
- **`index.js`** : serveur Node.js avec Express pour les routes API et Socket.IO pour le temps réel
- **`bdd.js`** : couche d'accès à la base de données SQLite (requêtes SQL et fonctions utilitaires)

## Fonctionnalités développées

### 1. Interface de base et structure de la messagerie

Intégration du code HTML/CSS existant du développeur frontend avec le backend Node.js et la base de données SQLite. Mise en place de la structure de l'interface composée d'une sidebar de conversations à gauche et d'une zone de chat centrale. Connexion WebSocket établie entre le client et le serveur pour la communication en temps réel.

### 2. Horodatage des messages et séparateurs de date

- Chaque message affiche son heure d'envoi (heures et minutes).
- Un séparateur de date est automatiquement inséré entre les messages envoyés à des jours différents (ex : « 14 septembre », « Aujourd'hui »).
- Le formatage utilise l'API `Intl` de JavaScript pour un affichage localisé en français.

### 3. Gestion des conversations et messages non lus

- Bouton « + » dans l'en-tête de la sidebar ouvrant une modale de création de conversation.
- Aperçu du dernier message envoyé affiché sous le nom de chaque conversation dans la sidebar.
- Système de détection des messages non lus : les conversations avec des messages non lus apparaissent en gras et en blanc, basé sur un stockage `localStorage` de la date de dernière lecture.

### 4. Sélecteur d'émojis avec pagination

- Bouton d'accès au sélecteur d'émojis dans la barre de saisie.
- Émojis organisés en pages avec navigation via des boutons précédent/suivant.
- Insertion de l'émoji à la position du curseur dans le champ de texte.

### 5. Catégories d'émojis

- Barre de raccourcis en bas du sélecteur permettant de naviguer entre les catégories : Smileys, Animaux, Nourriture, Symboles.
- Cliquer sur une icône de catégorie amène directement à la page correspondante.

### 6. Réactions aux messages

- Menu d'actions rapides apparaissant au survol d'un message, proposant des émojis de réaction.
- Les réactions s'affichent sous la bulle du message avec un badge indiquant l'émoji et le nombre de réactions.
- Persistance en base de données dans la table `Reaction_Message`.
- Propagation en temps réel à tous les participants via Socket.IO.

### 7. Toggle des réactions et restriction sur ses propres messages

- Système toggle : cliquer sur une réaction déjà posée la retire automatiquement.
- Le menu de réactions ne s'affiche que sur les messages des autres utilisateurs, empêchant de réagir à ses propres messages.

### 8. Création de conversations avec autocomplétion

- Modale de création proposant deux modes : **DM** (conversation privée à 2) et **Groupe** (3 membres ou plus).
- Menu déroulant d'autocomplétion filtrant les utilisateurs existants en base en temps réel lors de la saisie.

### 9. Envoi d'images et lightbox

- Bouton « + » (pièces jointes) ouvrant un menu contextuel avec l'option « Photo / Vidéo ».
- Upload des images sur le serveur via **Multer** (middleware Node.js pour la gestion des fichiers).
- Affichage des images dans les bulles de message avec coins arrondis.
- Lightbox plein écran au clic sur une image pour l'inspecter en détail.

### 10. Intégration des GIFs (API Giphy)

- Bouton « GIF » dans la barre de saisie ouvrant un panneau de recherche.
- Connexion à l'API Giphy pour la recherche de GIFs et l'affichage des tendances.
- Grille de résultats en 2 colonnes avec défilement.
- Envoi du GIF sélectionné comme message image dans la conversation.

### 11. Suppression, modification de messages et personnalisation

- Clic sur un de ses propres messages ouvrant une modale avec 3 options : **Répondre**, **Modifier**, **Supprimer**.
- **Suppression** : retrait du message de la base de données avec disparition en temps réel pour tous les participants.
- **Modification** : champ pré-rempli permettant de modifier le contenu, limité à 10 minutes après l'envoi.
- Badge « modifié » cliquable affiché sur les messages édités.
- Favicon personnalisé (icône d'envoi SVG bleue) et titre de page « Messagerie LifeInvader ».
- Masquage de la scrollbar dans la zone de chat pour un rendu plus épuré.

### 12. Messages vocaux

- Option « Message vocal » ajoutée au menu des pièces jointes.
- Interface d'enregistrement en direct : barre rouge avec chronomètre, boutons « Annuler » et « Envoyer ».
- Capture audio via l'API `MediaRecorder` du navigateur, conversion en base64, sauvegarde sur le serveur.
- Affichage sous forme de lecteur audio intégré dans la bulle de message.

### 13. Système de notifications

- **Notification toast** : pop-up animé en haut à droite lors de la réception d'un message dans une autre conversation, cliquable pour y accéder directement.
- Son de notification synthétique généré via l'API `AudioContext`.
- Compteur de messages non lus dans le titre de l'onglet (ex : « (3) Messagerie LifeInvader »).
- Notifications navigateur (API `Notification`) envoyées si l'utilisateur a donné son autorisation.

### 14. Historique des modifications, vidéos et système de réponse

- **Historique des modifications** : modale affichant les 3 dernières versions d'un message avec leur date, stockées dans la table `Message_History`.
- **Support des vidéos** : upload et affichage dans les bulles avec lecteur vidéo intégré et contrôles natifs.
- Barre de progression d'upload animée avec pourcentage affiché lors de l'envoi de fichiers.
- **Système de réponse (reply)** : aperçu du message cité au-dessus du champ de saisie, référence encodée en base64, barre bleue au-dessus de la bulle de réponse avec défilement vers le message original au clic.

### 15. Bouton envoyer dynamique, détails de groupe et multimédia

- Bouton « Envoyer » grisé et désactivé quand le champ est vide, bleu et actif dès qu'un texte est saisi.
- Panneau de détails inaccessible pour les conversations privées (2 membres), réservé aux groupes (3+).
- Galerie multimédia dans les détails avec deux onglets : « Images & Vidéos » et « GIFs », affichage en grille de 3 colonnes.
- Photo de groupe personnalisable via overlay « Modifier » au survol, persistée en base de données.
- Renommage de groupe avec propagation en temps réel à tous les membres via Socket.IO.

### 16. Indicateur de frappe et refonte de l'interface des détails

- Indicateur « est en train d'écrire... » remplaçant le statut « En ligne » quand l'interlocuteur tape un message.
- Animation de 3 points rebondissants (CSS keyframes) apparaissant en bas de la conversation côté gauche.
- Disparition automatique après 2 secondes d'inactivité ou à l'envoi du message.
- Mise en page dynamique : ouverture des détails masque la sidebar de conversations et élargit le panneau de détails ; la fermeture restaure la disposition initiale.
- Rafraîchissement automatique de la galerie multimédia lors de la réception de nouveaux messages médias.
- Correction de la persistance de la photo de groupe après rechargement de la page.

## Conclusion

Le module de messagerie LifeInvader représente un système de communication complet et fonctionnel. Partant d'une interface de chat basique, le projet a évolué vers une plateforme riche intégrant :

- Des échanges textuels, multimédias (images, vidéos, GIFs) et vocaux en temps réel
- Un système d'interactions sociales complet : réactions émoji, réponses contextuelles, modification et suppression de messages
- Une gestion avancée des groupes avec personnalisation (nom, photo) et galerie multimédia
- Des notifications multi-canaux : toast visuel, son, notification navigateur et compteur dans le titre
- Un indicateur de frappe pour une expérience conversationnelle fluide et vivante

L'ensemble de ces fonctionnalités a été implémenté principalement dans trois fichiers, démontrant qu'une architecture simple mais bien structurée permet de construire une application de messagerie moderne et réactive.
