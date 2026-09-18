/**
 * gesture-guard.js — Détection du doigt d'honneur à partir des landmarks
 * MediaPipe Hands. Ce fichier ne fait QUE définir des fonctions.
 *
 * `isMiddleFingerGesture` est repris tel quel de SAE_5.04 (js/hand-tracker.js).
 * Seule la source des landmarks change : SAE_5.04 les recevait du suivi vidéo
 * en direct, ici ils proviennent de MediaPipe Hands exécuté sur l'image
 * uploadée (voir detectMiddleFingerBoxes() dans js/moderation.js).
 *
 * La boîte à pixelliser est ensuite calculée par boundingBoxOf(), déjà définie
 * dans vendor/nudity-guard.js.
 */

/**
 * Détermine si le majeur est nettement plus étendu que tous les autres doigts.
 *
 * L'algorithme compare les distances poignet→bout de chaque doigt, normalisées
 * par la taille de la main (distance poignet→MCP du majeur). Les seuils sont
 * volontairement assouplis, car cette fonction est appelée sur une image
 * statique, où la fenêtre de détection est très courte — contrairement au flux
 * vidéo continu, qui disposait de plusieurs essais par seconde.
 *
 * @param {Array<{x:number, y:number, z:number}>} lm - Tableau des 21 landmarks MediaPipe
 *        (coordonnées normalisées 0–1).
 * @returns {boolean} `true` si le geste « doigt d'honneur » est détecté.
 */
function isMiddleFingerGesture(lm) {
  if (!lm || lm.length < 21) return false;

  // Taille de la main = distance poignet (0) → MCP du majeur (9), normalisée.
  const handScale = Math.hypot(lm[9].x - lm[0].x, lm[9].y - lm[0].y);

  // Filtre les mains trop petites / trop loin de la caméra (score peu fiable).
  if (handScale < 0.005) return false;

  // Distances normalisées de chaque bout de doigt par rapport au poignet.
  const dMiddleWrist = Math.hypot(lm[12].x - lm[0].x, lm[12].y - lm[0].y) / handScale;
  const dIndexWrist = Math.hypot(lm[8].x - lm[0].x, lm[8].y - lm[0].y) / handScale;
  const dRingWrist = Math.hypot(lm[16].x - lm[0].x, lm[16].y - lm[0].y) / handScale;
  const dPinkyWrist = Math.hypot(lm[20].x - lm[0].x, lm[20].y - lm[0].y) / handScale;

  // Longueurs des segments PIP→bout (extension relative de chaque doigt).
  const lenMiddle = Math.hypot(lm[12].x - lm[9].x, lm[12].y - lm[9].y) / handScale;
  const lenIndex = Math.hypot(lm[8].x - lm[5].x, lm[8].y - lm[5].y) / handScale;
  const lenRing = Math.hypot(lm[16].x - lm[13].x, lm[16].y - lm[13].y) / handScale;

  const isMiddleExtended = lenMiddle > 0.35 && dMiddleWrist > 0.9;
  const isMiddleMuchLongerThanIndex =
    dMiddleWrist - dIndexWrist > 0.15 || lenMiddle - lenIndex > 0.15;
  const isMiddleMuchLongerThanRing = dMiddleWrist - dRingWrist > 0.15 || lenMiddle - lenRing > 0.15;

  // Les autres doigts doivent être repliés (distance au poignet < 92 % de celle du majeur).
  const isOthersCurled =
    dIndexWrist < dMiddleWrist * 0.92 &&
    dRingWrist < dMiddleWrist * 0.92 &&
    dPinkyWrist < dMiddleWrist * 0.92;

  return (
    isMiddleExtended && isMiddleMuchLongerThanIndex && isMiddleMuchLongerThanRing && isOthersCurled
  );
}
