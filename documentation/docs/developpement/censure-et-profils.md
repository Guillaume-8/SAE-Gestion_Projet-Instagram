---
title: Censure de contenu et affichage des profils
sidebar_label: Censure et profils
description: Modération des images (nudité, doigt d'honneur) et ouverture d'un profil depuis une publication.
---

# Censure de contenu et affichage des profils

Cette partie couvre deux choses côté front-end : la censure des images envoyées sur le site, et la possibilité d'ouvrir le profil de quelqu'un en cliquant sur son nom.

## Censure de contenu

### Le principe

Dès qu'un utilisateur envoie une image, on l'analyse pour chercher de la nudité et des doigts d'honneur. Ça concerne les trois endroits où on peut envoyer une image :

- une publication,
- la photo de profil,
- une image dans la messagerie.

Tout se passe dans le navigateur, avant que l'image soit utilisée. L'image n'est envoyée à aucun service extérieur pour l'analyse.

### Les deux détecteurs

**Nudité : NudeNet v3** (modèle « 320n »). C'est un détecteur d'objets de type YOLOv8, entraîné à reconnaître les parties du corps. Pour chaque zone trouvée, il renvoie une boîte et un score de confiance. Le modèle est au format ONNX et il est exécuté par onnxruntime-web, en WebAssembly sur le processeur.

NudeNet connaît 18 classes, mais on ne censure que ce qui est dénudé. Les visages, les pieds, les aisselles et tout ce qui est couvert (maillot, sous-vêtements) sont ignorés. Les classes censurées sont :

| Classe | Ce que c'est |
|---|---|
| `FEMALE_BREAST_EXPOSED` | poitrine féminine |
| `MALE_BREAST_EXPOSED` | torse masculin |
| `FEMALE_GENITALIA_EXPOSED` | parties génitales féminines |
| `MALE_GENITALIA_EXPOSED` | parties génitales masculines |
| `BUTTOCKS_EXPOSED` | fesses |
| `ANUS_EXPOSED` | anus |
| `BELLY_EXPOSED` | ventre |

**Doigt d'honneur : MediaPipe Hands.** MediaPipe donne les 21 points de chaque main (poignet, articulations, bouts des doigts). Ensuite, notre fonction `isMiddleFingerGesture` compare la longueur des doigts : le geste est reconnu si le majeur est tendu et nettement plus long que l'index et l'annulaire, et que les autres doigts sont repliés.

### Étapes d'une analyse

1. Au premier envoi, on charge les deux détecteurs puis on leur fait faire une analyse à vide, pour que la première vraie analyse ne soit pas lente (`preloadModeration`).
2. On redessine l'image dans un canvas, en la réduisant à 1600 px maximum de côté.
3. NudeNet analyse l'image (il la ramène lui-même en 320 × 320). On garde les zones dont le score dépasse 0,4 et on fusionne celles qui se chevauchent.
4. MediaPipe cherche les mains. Chaque main qui fait un doigt d'honneur donne une zone, avec 30 px de marge autour.
5. Si on a trouvé au moins une zone, on fabrique une copie de l'image où ces zones sont pixellisées. L'original n'est pas touché.

Les deux détecteurs passent l'un après l'autre, pour ne pas surcharger la machine. Si une analyse dépasse 30 secondes, on l'abandonne, sinon l'écran resterait bloqué sur « Analyse en cours ».

### Ce qui se passe ensuite

Ça dépend de l'écran :

- **Publication** : l'utilisateur est prévenu mais peut publier quand même. On garde l'image d'origine et la publication est signalée automatiquement. Tant qu'un modérateur ne l'a pas validée, elle n'est visible que par son auteur et par les modérateurs.
- **Photo de profil** : c'est la version pixellisée qui devient l'avatar, avec le message « contenu sensible détecté : image pixellisée ».
- **Messagerie** : c'est la version pixellisée qui est envoyée, avec le même message.

Si rien n'est détecté, l'image est utilisée telle quelle (sur l'écran Publier, on affiche « Image analysée : rien à signaler »).

On a fait deux choix différents parce qu'une publication passe par les modérateurs : ils ont besoin de l'original pour juger si le détecteur s'est trompé. Pour la photo de profil et la messagerie, il n'y a personne pour vérifier, donc on censure directement.

### La pixellisation

C'est la fonction `pixelateBox` qui s'en occupe. Elle découpe chaque zone en carreaux et remplit chaque carreau avec la couleur moyenne des pixels qu'il couvre.

La taille des carreaux, c'est la plus grande de ces trois valeurs :

- 16 px ;
- 1/30 du petit côté de l'image, sinon les carreaux deviennent invisibles sur une photo en haute résolution ;
- 1/6 du petit côté de la zone. Sans ça, sur une main en gros plan qui prend toute l'image, on reconnaissait encore le geste.

Un PNG reste un PNG, pour garder la transparence. Les autres formats ressortent en JPEG (qualité 0,92).

### Les fichiers

| Fichier | Rôle |
|---|---|
| `frontend/js/moderation.js` | Chargement des détecteurs, analyse, copie pixellisée. Exporte `preloadModeration()` et `moderateImageFile(file)`. |
| `frontend/js/vendor/nudity-guard.js` | Détection de nudité avec NudeNet, et pixellisation (`pixelateBox`). |
| `frontend/js/vendor/gesture-guard.js` | Reconnaissance du doigt d'honneur (`isMiddleFingerGesture`). |
| `frontend/models/nudenet-320n.onnx` | Le modèle NudeNet (12 Mo). |
| `frontend/js/vendor/ort/` | onnxruntime-web (11 Mo). |
| `frontend/js/views/publish.js` | Écran Publier. |
| `frontend/js/views/edit-profile.js` | Écran Modifier le profil. |
| `frontend/js/views/messages.js` | Messagerie. |
| `frontend/js/api.js` | `createPost`, qui signale la publication si quelque chose a été détecté. |

Pour l'utiliser dans un écran :

```js
import { moderateImageFile } from '../moderation.js';

const result = await moderateImageFile(file);
// result.file : l'image d'origine
// result.censoredFile : la copie pixellisée, ou null si rien n'a été trouvé
// result.detections : les zones trouvées ({ minX, minY, maxX, maxY, label, score })
// result.gestureDetectionAvailable : false si le doigt d'honneur n'a pas pu être vérifié

const image = result.censoredFile || result.file;
```

### Temps de chargement

À la première visite, le navigateur télécharge environ 23 Mo (le modèle et onnxruntime), puis les garde en cache. Le chargement des deux détecteurs prend environ 5 secondes, une fois par session. Ensuite, une image est analysée en 110 à 200 ms dans nos tests.

Le détecteur de nudité est hébergé sur notre site, donc il marche hors ligne. MediaPipe, lui, est chargé depuis le CDN jsDelivr. On a fixé sa version (`@mediapipe/hands@0.4.1675469240`) pour qu'une mise à jour ne casse pas tout du jour au lendemain.

### Si quelque chose ne marche pas

- **Le détecteur de nudité ne se charge pas** : on bloque l'envoi, avec le message « L'analyse de l'image est indisponible : envoi bloqué. Réessayez. »
- **MediaPipe ne se charge pas** (pas d'Internet, ou pas de WebGL) : on désactive seulement la détection du doigt d'honneur. La nudité est toujours analysée et l'envoi reste possible, mais l'interface affiche « gestes non vérifiés ».
- **MediaPipe plante pendant l'analyse** : on réessaie une fois avec une nouvelle instance. Si ça échoue encore, on désactive la détection des gestes pour la session.
- **Le fichier n'est pas une image lisible** : message « Impossible de lire cette image (format non pris en charge). »

### Les réglages

Tout est en haut de `frontend/js/vendor/nudity-guard.js` :

| Constante | Valeur | À quoi ça sert |
|---|---|---|
| `NUDENET_MIN_SCORE` | `0.4` | Score minimum pour garder une zone. Sur 22 photos de test, les torses nus étaient entre 0,52 et 0,77, et les photos sans nudité ne dépassaient pas 0,32. |
| `NUDENET_CENSORED_LABELS` | 7 classes | Les classes censurées. |
| `NUDENET_IOU_THRESHOLD` | `0.45` | Au-delà de ce recouvrement, deux boîtes sont considérées comme la même zone. |
| `NUDENET_BOX_PADDING` | `12` | Marge en pixels autour d'une zone de nudité. |
| `PIXELATE_TILE_SIZE` | `16` | Taille minimum d'un carreau, en pixels. |
| `PIXELATE_TILES_ACROSS` | `6` | Nombre maximum de carreaux sur le petit côté d'une zone. |

### Tests

| Test | Résultat |
|---|---|
| Les 20 photos d'exemple du site | Rien de détecté, aucune image modifiée |
| 5 photos de doigt d'honneur | 4 détectées sur 5. Celle qui est passée montre une main de face, en gros plan. |
| Une photo de nu | Zones détectées et pixellisées, le reste de l'image est intact |
| Photo de profil avec un doigt d'honneur | Avatar pixellisé |
| Image avec un doigt d'honneur dans la messagerie | Image pixellisée enregistrée sur le serveur |
| Image normale dans la messagerie | Envoyée sans modification (fichier identique) |
| Publication avec un doigt d'honneur | Image d'origine gardée, publication signalée et en attente |
| Détecteur de nudité indisponible (simulé) | Envoi bloqué |
| MediaPipe indisponible (simulé) | Envoi possible, message « gestes non vérifiés » |

### Limites

:::warning
Comme tout se passe dans le navigateur, quelqu'un qui appelle l'API directement peut contourner la censure. Il faudra refaire l'analyse côté serveur. Le champ `moderationLabels` envoyé avec une publication est juste une indication, le serveur ne doit pas s'y fier.
:::

- Le détecteur peut rater une zone. Sur notre photo de test, il a trouvé le ventre et le sexe mais pas la poitrine. On peut jouer sur `NUDENET_MIN_SCORE` si besoin.
- Un doigt d'honneur vu de face, en gros plan, n'est pas toujours reconnu.
- Sans Internet ou sans WebGL, le doigt d'honneur n'est pas vérifié, puisque MediaPipe vient du CDN.
- Licences : le modèle NudeNet est sous AGPL-3.0 (voir `frontend/models/NUDENET-LICENSE-AGPL-3.0.md`), onnxruntime-web sous MIT et MediaPipe sous Apache-2.0.

## Affichage du profil depuis les publications

### Le principe

Partout où le nom d'un utilisateur apparaît dans une publication, on peut cliquer dessus pour ouvrir son profil.

### Où sont les liens

| Où | Sur quoi on clique |
|---|---|
| Fil d'actualité | la photo et le nom en haut de la publication (`.post-user`) |
| Fil d'actualité | le nom devant la légende (`.post-author-link`) |
| Fil d'actualité | une `@mention` dans la légende (`.caption-mention`) |
| Fil d'actualité | l'auteur d'un commentaire (`.comment-author`) |
| Publication ouverte en grand | la photo et le nom de l'auteur (`.modal-user-link`) |
| Publication ouverte en grand | l'auteur d'un commentaire (`.comment-author`) |
| Recherche | un compte dans les résultats (`.search-result-user`) |

Une publication peut s'ouvrir en grand depuis le fil, Tendances, la Recherche, les publications enregistrées ou la grille d'un profil. Les liens marchent pareil dans tous les cas.

### La route

Tous les liens mènent à la même adresse :

```
#/profile?user=nom_utilisateur
```

Dans le fil et dans la publication ouverte en grand, le lien est construit par `getProfileHref(username)` (dans `feed.js` et `post-modal.js`). Dans la Recherche, on construit l'adresse au moment du clic, à partir de l'attribut `data-username` de la ligne. Dans les deux cas, le nom passe par `encodeURIComponent`, pour qu'un caractère spécial ne casse pas l'adresse.

Le routeur (`router.js`) ne regarde que ce qu'il y a avant le `?`. `#/profile` et `#/profile?user=...` affichent donc la même vue.

### La vue profil

Dans `frontend/js/views/profile.js` :

1. `getRequestedUsername()` récupère le paramètre `user` dans l'adresse.
2. S'il n'y a pas de nom, ou si c'est celui de l'utilisateur connecté, on affiche son propre profil (`getCurrentUser()`) avec le bouton « Modifier le profil ».
3. Sinon, on charge le profil de la personne (`getUserProfile(username)`), sans bouton de modification. Dans ce cas, le lien « Profil » du menu n'est plus surligné, puisqu'il correspond au profil de l'utilisateur connecté.
4. On peut cliquer sur les vignettes pour ouvrir les publications en grand.

`getUserProfile` (dans `api.js`) récupère les publications de la personne. Les publications signalées en attente de modération n'apparaissent pas, sauf pour leur auteur et les modérateurs. Pour l'avatar, on prend celui de ses publications, sinon celui de la messagerie, sinon un avatar généré avec ses initiales. Si le nom n'existe pas, la page affiche « Erreur lors du chargement du profil. »

### Fermer la publication ouverte en grand

La publication ouverte en grand est ajoutée par-dessus la page. Si on ne la ferme pas en allant sur un profil, elle reste affichée devant.

On la ferme donc à chaque changement d'adresse (événement `hashchange`). Il restait un cas : quand on ouvre une publication depuis le profil de son auteur et qu'on clique sur son nom, l'adresse ne change pas, donc rien ne se passait. On ferme aussi la fenêtre quand le lien cliqué mène à la page déjà affichée :

```js
// post-modal.js
overlay.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#/"]');
  if (link && link.getAttribute('href') === window.location.hash) {
    closePostModal();
  }
});
```

Sinon, on peut toujours la fermer avec la croix, la touche Échap ou en cliquant à côté.

### Les fichiers

| Fichier | Rôle |
|---|---|
| `frontend/js/feed.js` | Liens vers les profils dans le fil. |
| `frontend/js/post-modal.js` | Liens dans la publication ouverte en grand, et fermeture de celle-ci. |
| `frontend/js/views/search.js` | Clic sur un compte dans la Recherche. |
| `frontend/js/views/profile.js` | La vue profil. |
| `frontend/js/api.js` | `getCurrentUser()` et `getUserProfile(username)`. |
| `frontend/js/router.js` | La route `#/profile`. |

### Tests

| Test | Résultat |
|---|---|
| Clic sur le nom en haut d'une publication du fil | Le bon profil s'ouvre |
| Clic sur le nom devant la légende | Le bon profil s'ouvre |
| Clic sur l'auteur d'un commentaire | Le bon profil s'ouvre |
| Les 10 utilisateurs du fil, un par un | Les 10 profils s'affichent, avec l'avatar et les publications |
| Clic sur son propre nom | Son profil, avec le bouton « Modifier le profil » |
| Tendances, publication en grand, clic sur l'auteur | Le bon profil s'ouvre et la fenêtre se ferme |
| Publication en grand, clic sur l'auteur d'un commentaire | Le bon profil s'ouvre et la fenêtre se ferme |
| Profil, une de ses publications, clic sur son nom | La fenêtre se ferme, on reste sur le profil |
| Recherche, clic sur un compte | Le profil de ce compte s'ouvre |
| Recherche, clic sur son propre compte | Son profil, avec le bouton « Modifier le profil » |
| Bouton retour du navigateur | Retour au profil d'avant |
| Nom d'utilisateur qui n'existe pas | « Erreur lors du chargement du profil. » |
| Clic sur « J'aime » dans la publication en grand | La fenêtre reste ouverte |
| Croix, Échap, clic à côté | La fenêtre se ferme |
