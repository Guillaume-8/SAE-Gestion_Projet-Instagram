/**
 * @fileoverview Service d'interaction avec l'API REST.
 * Conforme au Google Coding Style (ES6 Modules).
 */

import { MOCK_POSTS } from './mock-data.js';

const USE_MOCK = true;
const API_BASE_URL = '/api';

/**
 * Récupère le fil d'actualité.
 * @return {Promise<Array<Object>>} Liste des publications.
 */
export async function getFeedPosts() {
  if (USE_MOCK) {
    return Promise.resolve(MOCK_POSTS);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/posts`);
    if (!response.ok) {
      throw new Error(`Erreur réseau: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Échec de récupération des publications :', error);
    return [];
  }
}
