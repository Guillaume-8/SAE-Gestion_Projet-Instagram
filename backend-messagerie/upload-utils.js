/**
 * @fileoverview Génération de noms de fichiers sûrs pour les uploads.
 *
 * Principe : le nom d'origine envoyé par le navigateur n'est JAMAIS conservé.
 * On en extrait uniquement l'extension, on la valide contre une liste blanche,
 * puis on la concatène à un identifiant unique (UUID v4).
 *
 * Cela évite trois problèmes :
 *   - les collisions : deux « avatar.jpg » ne s'écrasent plus ;
 *   - les noms piégés : « hack.php », « shell.phtml », « ../../etc/passwd » ;
 *   - l'exécution de scripts déposés dans le dossier d'upload.
 *
 * Exemple : « photo de vacances.JPG » devient
 * « f47ac10b-58cc-4372-a567-0e02b2c3d479.jpg ».
 */

const crypto = require('crypto');
const path = require('path');

/**
 * Extensions autorisées, par catégorie de média.
 * Tout ce qui n'est pas listé ici est refusé.
 * @const {Object<string, Set<string>>}
 */
const EXTENSIONS_AUTORISEES = {
  image: new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.avif', '.heic', '.heif',
  ]),
  video: new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogv']),
  audio: new Set([
    '.webm', '.mp3', '.wav', '.ogg', '.oga', '.m4a', '.aac', '.flac',
  ]),
};

/**
 * Correspondance type MIME → extension, utilisée quand le nom d'origine
 * ne porte pas d'extension exploitable.
 * @const {Object<string, string>}
 */
const EXTENSION_PAR_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp',
  'image/avif': '.avif',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/x-matroska': '.mkv',
  'video/x-m4v': '.m4v',
  'audio/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'audio/aac': '.aac',
  'audio/flac': '.flac',
};

/**
 * Déduit une extension sûre à partir d'un nom de fichier et/ou d'un type MIME.
 *
 * @param {string} nomFichier Nom d'origine, éventuellement avec un chemin.
 * @param {string=} mimeType Type MIME déclaré par le navigateur.
 * @param {string=} categorie Catégorie attendue : 'image', 'video' ou 'audio'.
 * @return {string} Extension commençant par un point (ex. '.jpg').
 * @throws {Error} Si aucune extension autorisée ne peut être déterminée.
 */
function extensionSure(nomFichier, mimeType, categorie) {
  const cat = categorie || 'image';
  const autorisees = EXTENSIONS_AUTORISEES[cat] || EXTENSIONS_AUTORISEES.image;

  const base = path.basename(String(nomFichier || '')).toLowerCase();
  const trouvee = base.match(/\.[a-z0-9]{1,5}$/);
  const candidate = trouvee ? trouvee[0] : '';

  if (autorisees.has(candidate)) {
    return candidate;
  }

  const parMime = EXTENSION_PAR_MIME[String(mimeType || '').toLowerCase()];
  if (parMime && autorisees.has(parMime)) {
    return parMime;
  }

  throw new Error('Extension de fichier non autorisée');
}

/**
 * Construit un nom de fichier unique : UUID v4 + extension d'origine validée.
 *
 * @param {string} nomFichier Nom d'origine envoyé par le navigateur.
 * @param {string=} mimeType Type MIME du fichier.
 * @param {string=} categorie Catégorie de média ('image', 'video', 'audio').
 * @return {string} Nom de fichier, ex.
 *     'f47ac10b-58cc-4372-a567-0e02b2c3d479.jpg'.
 * @throws {Error} Si l'extension n'est pas autorisée.
 */
function nomFichierUnique(nomFichier, mimeType, categorie) {
  return crypto.randomUUID() + extensionSure(nomFichier, mimeType, categorie);
}

/**
 * Vérifie qu'un nom de fichier ne contient pas de chemin.
 *
 * @param {string} nom Nom de fichier à contrôler.
 * @return {boolean} Vrai si le nom est un simple nom de fichier.
 */
function nomDeFichierValide(nom) {
  const valeur = String(nom || '');
  return valeur.length > 0 &&
    valeur === path.basename(valeur) &&
    !valeur.includes('..') &&
    !valeur.includes('/') &&
    !valeur.includes('\\');
}

module.exports = {extensionSure, nomFichierUnique, nomDeFichierValide};
