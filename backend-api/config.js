/**
 * @fileoverview Configuration du serveur API Utilisateurs.
 * Adapter les identifiants à votre installation MariaDB locale.
 * Ne pas commit vos vrais identifiants sur GitHub.
 */

export default {
  /** Port d'écoute (3001 : la messagerie occupe déjà le 3000). */
  port: 3001,

  /** Connexion MariaDB (base PhotoVideo). */
  db: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'PhotoVideo',
  },

  /** Secret de signature des jetons (à changer pour la production). */
  tokenSecret: 'sae502-instaclone-secret-a-changer',

  /** Durée de validité d'un jeton en heures. */
  tokenTtlHours: 24,
};
