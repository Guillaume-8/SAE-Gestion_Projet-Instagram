# SAE-Gestion_Projet-Instagram
## Modération des images

Toute image envoyée (publication, photo de profil, messagerie) est analysée dans le
navigateur avant d'être utilisée, pour repérer la nudité et les doigts d'honneur.
Ce qui se passe ensuite dépend de l'endroit :

- **Publication** : l'utilisateur est averti et peut publier quand même. L'image
  d'origine est conservée (pour que le modérateur puisse juger), mais la
  publication est signalée automatiquement et n'est visible que par son auteur
  et les modérateurs tant qu'un modérateur ne l'a pas approuvée.
- **Photo de profil** et **messagerie** : il n'y a pas de modérateur derrière,
  donc les zones repérées sont **pixellisées** avant l'enregistrement ou l'envoi,
  et l'utilisateur en est averti. L'image pixellisée est limitée à 1600 px de
  côté ; un PNG reste un PNG, les autres formats deviennent du JPEG.

Voir `frontend/js/moderation.js`.

Deux détecteurs :

| Détecteur | Fichiers | Licence |
|---|---|---|
| Nudité — NudeNet v3 « 320n », exécuté par onnxruntime-web (processeur) | `frontend/models/nudenet-320n.onnx` (12 Mo), `frontend/js/vendor/ort/` (11 Mo) | **AGPL-3.0** (modèle), MIT (onnxruntime) |
| Doigt d'honneur — MediaPipe Hands | chargé depuis le CDN jsDelivr | Apache-2.0 |

- Le détecteur de nudité est **hébergé par le site** : il fonctionne hors ligne.
  MediaPipe reste la seule dépendance CDN. S'il ne peut pas se charger (pas
  d'accès Internet, WebGL absent), la détection des doigts d'honneur est
  désactivée mais l'envoi d'images reste possible : la nudité est toujours
  analysée et l'interface signale « gestes non vérifiés ». Seule l'indisponibilité
  du détecteur de nudité bloque l'envoi (`preloadModeration` échoue).
- Compter environ 23 Mo téléchargés à la première visite, puis rien (cache HTTP).
- Réglages : seuil de détection et classes censurées en haut de
  `frontend/js/vendor/nudity-guard.js`.
- ⚠ Cette modération s'exécute côté navigateur : elle est contournable par un
  client qui appelle l'API directement. Une vérification serveur reste à faire.
