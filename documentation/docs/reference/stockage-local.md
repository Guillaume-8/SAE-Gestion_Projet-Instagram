---
sidebar_position: 4
title: Stockage local
---

# Stockage local (localStorage)

Le front ne stocke que des préférences et l'identité de session. **Aucun mot de
passe, aucun jeton d'authentification.**

| Clé | Type | Contenu | Écrite par |
| --- | --- | --- | --- |
| `instaclone-theme` | `'light'` \| `'dark'` | Thème actif | `menu.js` |
| `instaclone_user` | string | Pseudonyme connecté | `login.js` |
| `instaclone_privacy_settings` | JSON | Compte privé, visibilité | `settings.js` |
| `instaclone_notification_settings` | JSON | Préférences de notifications | `settings.js` |
| `instaclone_removed_friends` | JSON | Amis retirés localement | `friends.js` |
| `read_date_<idGroupe>` | ISO 8601 | Dernière lecture d'une conversation | `messages.js` |

## Pourquoi les clés gardent le préfixe `instaclone`

Le projet s'appelle désormais **LifeInvader**, mais les clés sont restées en
`instaclone_*`. Les renommer aurait réinitialisé le thème et la session de tous
les utilisateurs déjà connectés. Le préfixe est donc conservé volontairement.

## Lecture du pseudo

```js
function getCurrentPseudo() {
  const champ = document.getElementById('currentUserInput');
  return champ ? champ.value.trim() : '';
}
```

Dans la messagerie, le pseudo est pré-rempli depuis la session mais reste
modifiable : c'est ce qui permet d'ouvrir deux fenêtres avec deux identités
pour démontrer le temps réel.

## Compteur de non-lus

`read_date_<idGroupe>` contient la date ISO de la dernière lecture. Un message
est considéré non lu si sa date est postérieure :

```js
const nonLu = !localStorage.getItem('read_date_' + conv.id) ||
  new Date(conv.lastMessageDate) > new Date(localStorage.getItem('read_date_' + conv.id));
```

## Nettoyage

```js
// Réinitialiser l'application (thème, session, préférences)
Object.keys(localStorage)
  .filter((cle) => cle.startsWith('instaclone') || cle.startsWith('read_date_'))
  .forEach((cle) => localStorage.removeItem(cle));
```

Utile pour tester la connexion depuis zéro sans vider tout le stockage du
navigateur.
