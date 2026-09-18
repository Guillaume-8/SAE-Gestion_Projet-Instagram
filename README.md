# SAE-Gestion_Projet-Instagram
## Modération des images

Toute image envoyée (publication, photo de profil, messagerie) est analysée dans le
navigateur avant d'être utilisée ; les zones de nudité et les doigts d'honneur sont
pixellisés. Voir `frontend/js/moderation.js`.

Deux détecteurs :

| Détecteur | Fichiers | Licence |
|---|---|---|
| Nudité — NudeNet v3 « 320n », exécuté par onnxruntime-web (processeur) | `frontend/models/nudenet-320n.onnx` (12 Mo), `frontend/js/vendor/ort/` (11 Mo) | **AGPL-3.0** (modèle), MIT (onnxruntime) |
| Doigt d'honneur — MediaPipe Hands | chargé depuis le CDN jsDelivr | Apache-2.0 |

- Le détecteur de nudité est **hébergé par le site** : il fonctionne hors ligne.
  MediaPipe reste la seule dépendance CDN ; sans accès Internet, l'envoi d'images
  est bloqué (`preloadModeration` échoue).
- Compter environ 23 Mo téléchargés à la première visite, puis rien (cache HTTP).
- Réglages : seuil de détection et classes censurées en haut de
  `frontend/js/vendor/nudity-guard.js`.
- ⚠ Cette modération s'exécute côté navigateur : elle est contournable par un
  client qui appelle l'API directement. Une vérification serveur reste à faire.
