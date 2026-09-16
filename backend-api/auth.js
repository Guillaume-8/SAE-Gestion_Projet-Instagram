/**
 * @fileoverview Authentification : hachage bcrypt et jetons signés HMAC.
 * Le jeton est de la forme "userId.expiration.signature" : signé côté
 * serveur, vérifiable sans état (survit au redémarrage du serveur).
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import config from './config.js';

/**
 * Hache un mot de passe en clair.
 * @param {string} password Mot de passe en clair.
 * @return {Promise<string>} Empreinte bcrypt.
 */
export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Vérifie un mot de passe contre son empreinte bcrypt.
 * @param {string} password Mot de passe en clair.
 * @param {string} hash Empreinte stockée en base.
 * @return {Promise<boolean>} true si le mot de passe correspond.
 */
export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Signe un jeton d'authentification pour un utilisateur.
 * @param {number} userId Identifiant de l'utilisateur.
 * @return {string} Jeton signé.
 */
export function signToken(userId) {
  const exp = Date.now() + config.tokenTtlHours * 3600 * 1000;
  const payload = `${userId}.${exp}`;
  const sig = crypto
    .createHmac('sha256', config.tokenSecret)
    .update(payload)
    .digest('hex');
  return `${payload}.${sig}`;
}

/**
 * Vérifie un jeton et retourne l'identifiant de l'utilisateur.
 * @param {string} token Jeton à vérifier.
 * @return {?number} Identifiant utilisateur, ou null si invalide/expiré.
 */
export function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;

  const expected = crypto
    .createHmac('sha256', config.tokenSecret)
    .update(`${userId}.${exp}`)
    .digest('hex');

  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  if (parseInt(exp, 10) < Date.now()) return null;

  const id = parseInt(userId, 10);
  return Number.isNaN(id) ? null : id;
}
