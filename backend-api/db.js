/**
 * @fileoverview Pool de connexions MariaDB (mysql2, API promises).
 * Le pool est paresseux : aucune connexion n'est ouverte avant la
 * première requête, le serveur peut donc démarrer sans base.
 */

import mysql from 'mysql2/promise';
import config from './config.js';

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

export default pool;
