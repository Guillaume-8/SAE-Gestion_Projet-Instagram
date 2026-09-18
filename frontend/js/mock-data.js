/**
 * @fileoverview Données fictives pour le développement de l'interface.
 *
 * Les médias des publications pointent vers "assets/images/posts/" :
 * importer vos propres images en local avec les noms post-01.jpg à
 * post-20.jpg (formats PNG/WebP acceptés si l'extension est adaptée).
 * Tant qu'une image locale est absente, un dégradé de remplacement
 * s'affiche (voir .media-missing dans style.css).
 *
 * Les avatars sont des SVG inline générés (initiale colorée) : aucune
 * dépendance réseau, aucune image à fournir.
 */

/**
 * Génère un avatar SVG inline (initiale colorée) sans dépendance externe.
 * @param {string} name Nom de l'utilisateur.
 * @return {string} Data URL de l'avatar SVG.
 */
function makeAvatar(name) {
  const colors = [
    '#f97316', '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e',
    '#3b82f6', '#eab308', '#a855f7', '#14b8a6', '#ef4444',
  ];
  let hash = 0;
  for (const ch of name) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  const color = colors[hash % colors.length];
  const letter = name.charAt(0).toUpperCase();
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
    '<rect fill="' + color + '" width="100" height="100"/>' +
    '<text x="50" y="55" font-size="52" fill="#ffffff" text-anchor="middle" ' +
    'font-family="sans-serif" font-weight="bold">' + letter + '</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/**
 * Source unique de vérité : toutes les listes exportées sont dérivées
 * de ce tableau. Les ids correspondent aux fichiers post-XX.jpg.
 * @type {Array<Object>}
 */
const ALL_POSTS = [
  {
    id: 1,
    author: 'eren_rt',
    avatar: makeAvatar('eren_rt'),
    mediaUrl: 'assets/images/posts/post-01.jpg',
    isVideo: false,
    caption: 'Configuration Apache validée en HTTPS sur le serveur ! #butrt #dev',
    likesCount: 18,
    dislikesCount: 1,
    visibility: 'public',
    comments: [
      {id: 101, author: 'guillaume_rt', text: 'Le certificat passe bien !'},
      {id: 102, author: 'mathias_rt', text: 'Top, je branche le back dessus.'},
    ],
    createdAt: 'Il y a 10 minutes',
  },
  {
    id: 2,
    author: 'thomas_rt',
    avatar: makeAvatar('thomas_rt'),
    mediaUrl: 'assets/images/posts/post-02.jpg',
    isVideo: false,
    caption: 'Le routeur hash du SPA est finalisé, navigation fluide #sae502 #frontend',
    likesCount: 25,
    dislikesCount: 0,
    visibility: 'public',
    comments: [
      {id: 103, author: 'eren_rt', text: 'Le mode sombre avec est parfait.'},
    ],
    createdAt: 'Il y a 32 minutes',
  },
  {
    id: 3,
    author: 'guillaume_rt',
    avatar: makeAvatar('guillaume_rt'),
    mediaUrl: 'assets/images/posts/post-03.jpg',
    isVideo: false,
    caption: 'Reverse proxy Apache configuré, Node.js répond derrière ! #butrt #apache',
    likesCount: 31,
    dislikesCount: 2,
    visibility: 'public',
    comments: [],
    createdAt: 'Il y a 1 heure',
  },
  {
    id: 4,
    author: 'mathias_rt',
    avatar: makeAvatar('mathias_rt'),
    mediaUrl: 'assets/images/posts/post-04.jpg',
    isVideo: false,
    caption: 'Premiers endpoints Express en place, ça répond vite ! #dev #nodejs',
    likesCount: 44,
    dislikesCount: 1,
    visibility: 'public',
    comments: [
      {id: 104, author: 'eren_rt', text: 'Je teste le fetch ce soir.'},
      {id: 105, author: 'enes_rt', text: 'Bonne vitesse de réponse !'},
    ],
    createdAt: 'Il y a 2 heures',
  },
  {
    id: 5,
    author: 'tanguy_rt',
    avatar: makeAvatar('tanguy_rt'),
    mediaUrl: 'assets/images/posts/post-05.jpg',
    isVideo: false,
    caption: "Le plan d'adressage IPv6 du labo est enfin prêt #reseau #projet",
    likesCount: 12,
    dislikesCount: 0,
    visibility: 'friends',
    comments: [],
    createdAt: 'Il y a 3 heures',
  },
  {
    id: 6,
    author: 'pierre_rt',
    avatar: makeAvatar('pierre_rt'),
    mediaUrl: 'assets/images/posts/post-06.jpg',
    isVideo: false,
    caption: 'Retouche des photos du projet avec les filtres CSS #multimedia #frontend',
    likesCount: 56,
    dislikesCount: 3,
    visibility: 'public',
    comments: [
      {id: 106, author: 'yanis_rt', text: 'Le rendu est superbe.'},
    ],
    createdAt: 'Il y a 4 heures',
  },
  {
    id: 7,
    author: 'eren_rt',
    avatar: makeAvatar('eren_rt'),
    mediaUrl: 'assets/images/posts/post-07.jpg',
    isVideo: false,
    caption: 'Le menu hamburger est terminé, mode sombre persistant inclus #sae502 #frontend',
    likesCount: 22,
    dislikesCount: 0,
    visibility: 'public',
    comments: [],
    createdAt: 'Il y a 5 heures',
  },
  {
    id: 8,
    author: 'yanis_rt',
    avatar: makeAvatar('yanis_rt'),
    mediaUrl: 'assets/images/posts/post-08.jpg',
    isVideo: false,
    caption: 'Modélisation de la base SQLite, les tables sont créées #butrt #sqlite',
    likesCount: 15,
    dislikesCount: 1,
    visibility: 'public',
    comments: [
      {id: 107, author: 'mathias_rt', text: 'Les clés étrangères sont propres.'},
    ],
    createdAt: 'Il y a 6 heures',
  },
  {
    id: 9,
    author: 'enes_rt',
    avatar: makeAvatar('enes_rt'),
    mediaUrl: 'assets/images/posts/post-09.jpg',
    isVideo: false,
    caption: 'API REST Node.js branchée sur SQLite, tout répond ! #dev #nodejs',
    likesCount: 38,
    dislikesCount: 2,
    visibility: 'public',
    comments: [],
    createdAt: 'Il y a 7 heures',
  },
  {
    id: 10,
    author: 'guillaume_rt',
    avatar: makeAvatar('guillaume_rt'),
    mediaUrl: 'assets/images/posts/post-10.jpg',
    isVideo: false,
    caption: 'Génération du certificat avec SAN pour localhost #apache #securite',
    likesCount: 27,
    dislikesCount: 0,
    visibility: 'public',
    comments: [
      {id: 108, author: 'eren_rt', text: 'Brave accepte le certificat maintenant ?'},
      {id: 109, author: 'guillaume_rt', text: 'Oui, plus aucun avertissement !'},
    ],
    createdAt: 'Il y a 8 heures',
  },
  {
    id: 11,
    author: 'jonathan_rt',
    avatar: makeAvatar('jonathan_rt'),
    mediaUrl: 'assets/images/posts/post-11.jpg',
    isVideo: false,
    caption: 'Capture du trafic réseau avec Wireshark en TP #reseau #multimedia',
    likesCount: 19,
    dislikesCount: 0,
    visibility: 'friends',
    comments: [],
    createdAt: 'Il y a 9 heures',
  },
  {
    id: 12,
    author: 'eren_rt',
    avatar: makeAvatar('eren_rt'),
    mediaUrl: 'assets/images/posts/post-12.jpg',
    isVideo: false,
    caption: 'Le Dockerfile du back-end build sans warning #sae502 #docker',
    likesCount: 33,
    dislikesCount: 1,
    visibility: 'public',
    comments: [],
    createdAt: 'Il y a 10 heures',
  },
  {
    id: 13,
    author: 'matheo_rt',
    avatar: makeAvatar('matheo_rt'),
    mediaUrl: 'assets/images/posts/post-13.jpg',
    isVideo: false,
    caption: 'Audit de sécurité du site, en-têtes HTTP renforcés #butrt #securite',
    likesCount: 21,
    dislikesCount: 0,
    visibility: 'public',
    comments: [],
    createdAt: 'Il y a 11 heures',
  },
  {
    id: 14,
    author: 'thomas_rt',
    avatar: makeAvatar('thomas_rt'),
    mediaUrl: 'assets/images/posts/post-14.jpg',
    isVideo: false,
    caption: 'Requêtes SQL préparées contre les injections #dev #sqlite',
    likesCount: 17,
    dislikesCount: 0,
    visibility: 'public',
    comments: [
      {id: 110, author: 'yanis_rt', text: 'Sécurité avant tout.'},
    ],
    createdAt: 'Il y a 12 heures',
  },
  {
    id: 15,
    author: 'pierre_rt',
    avatar: makeAvatar('pierre_rt'),
    mediaUrl: 'assets/images/posts/post-15.jpg',
    isVideo: false,
    caption: 'Fail2ban installé sur le serveur Apache #apache #reseau',
    likesCount: 9,
    dislikesCount: 0,
    visibility: 'friends',
    comments: [],
    createdAt: 'Il y a 14 heures',
  },
  {
    id: 16,
    author: 'tanguy_rt',
    avatar: makeAvatar('tanguy_rt'),
    mediaUrl: 'assets/images/posts/post-16.jpg',
    isVideo: false,
    caption: 'Galerie photos responsive en CSS grid #multimedia #frontend #projet',
    likesCount: 29,
    dislikesCount: 1,
    visibility: 'public',
    comments: [],
    createdAt: 'Il y a 16 heures',
  },
  {
    id: 17,
    author: 'jonathan_rt',
    avatar: makeAvatar('jonathan_rt'),
    mediaUrl: 'assets/images/posts/post-17.jpg',
    isVideo: false,
    caption: 'Pipeline CI avec GitHub Actions pour la SAE #sae502 #docker',
    likesCount: 24,
    dislikesCount: 2,
    visibility: 'public',
    comments: [],
    createdAt: 'Il y a 18 heures',
  },
  {
    id: 18,
    author: 'eren_rt',
    avatar: makeAvatar('eren_rt'),
    mediaUrl: 'assets/images/posts/post-18.jpg',
    isVideo: false,
    caption: 'Le mode sombre persiste grâce au localStorage #butrt #frontend',
    likesCount: 26,
    dislikesCount: 0,
    visibility: 'public',
    comments: [],
    createdAt: 'Il y a 20 heures',
  },
  {
    id: 19,
    author: 'matheo_rt',
    avatar: makeAvatar('matheo_rt'),
    mediaUrl: 'assets/images/posts/post-19.jpg',
    isVideo: false,
    caption: 'Conteneurisation complète de la stack, une seule commande ! #dev #docker',
    likesCount: 35,
    dislikesCount: 0,
    visibility: 'public',
    comments: [
      {id: 111, author: 'eren_rt', text: 'Pratique pour la démo.'},
    ],
    createdAt: 'Hier',
  },
  {
    id: 20,
    author: 'mathias_rt',
    avatar: makeAvatar('mathias_rt'),
    mediaUrl: 'assets/images/posts/post-20.jpg',
    isVideo: false,
    caption: 'Hachage des mots de passe avec bcrypt côté serveur #nodejs #securite',
    likesCount: 41,
    dislikesCount: 1,
    visibility: 'public',
    comments: [],
    createdAt: 'Hier',
  },
];

/** Fil d'actualité : toutes les publications. */
export const MOCK_POSTS = ALL_POSTS;

/** Publications tendance : triées par nombre de likes. */
export const MOCK_TRENDING_POSTS = [...ALL_POSTS].sort(
  (a, b) => b.likesCount - a.likesCount,
);

/** Publications enregistrées : une sélection (hors posts de eren_rt). */
export const MOCK_SAVED_POSTS = [3, 9, 16, 20]
  .map((id) => ALL_POSTS.find((p) => p.id === id))
  .filter(Boolean);

/**
 * Hashtags tendance : calculés depuis les captions réelles, donc les
 * compteurs affichés correspondent toujours au contenu filtrable.
 */
export const MOCK_HASHTAGS = (() => {
  const counts = new Map();
  const regex = /#[\wàâäéèêëîïôöùûüç]+/g;
  for (const post of ALL_POSTS) {
    const tags = post.caption.match(regex) || [];
    for (const tag of tags) {
      const key = tag.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({tag, count}))
    .sort((a, b) => b.count - a.count);
})();

/** Posts de l'utilisateur connecté (eren_rt). */
const EREN_POSTS = ALL_POSTS.filter((p) => p.author === 'eren_rt');

export const MOCK_USER = {
  id: 1,
  username: 'eren_rt',
  name: 'Eren',
  gender: 'unspecified',
  showGender: false,
  // Un modérateur voit aussi les publications signalées des autres utilisateurs.
  isModerator: false,
  avatar: makeAvatar('eren_rt'),
  bio: 'Responsable Front-End | BUT R&T 3ème année | SAÉ 5.02',
  postsCount: EREN_POSTS.length,
  followersCount: 42,
  followingCount: 28,
  posts: EREN_POSTS.map(({id, mediaUrl, isVideo}) => ({id, mediaUrl, isVideo})),
};

/**
 * Signalements en attente de décision d'un modérateur. Deux origines :
 * `automatic: true` pour la détection d'images (nudité, doigt d'honneur),
 * `automatic: false` pour un signalement fait par un utilisateur.
 */
export const MOCK_REPORTS = [];

export const MOCK_CONVERSATIONS = [
  {
    id: 1,
    name: 'thomas_rt',
    avatar: makeAvatar('thomas_rt'),
    lastMessage: 'Tu as pu tester le reverse proxy ?',
    lastTime: 'Il y a 5 min',
    unread: true,
    messages: [
      {id: 1, sender: 'them', text: 'Salut Eren !', createdAt: '14:20'},
      {id: 2, sender: 'me', text: 'Salut Thomas, ça va ?', createdAt: '14:21'},
      {id: 3, sender: 'them', text: 'Ouais, tu as pu tester le reverse proxy ?', createdAt: '14:25'},
    ],
  },
  {
    id: 2,
    name: 'guillaume_rt',
    avatar: makeAvatar('guillaume_rt'),
    lastMessage: 'Le certificat SSL est presque prêt',
    lastTime: 'Il y a 1 h',
    unread: false,
    messages: [
      {id: 1, sender: 'them', text: 'Le certificat SSL est presque prêt', createdAt: '13:10'},
      {id: 2, sender: 'me', text: 'Super, je switch du temporaire quand ?', createdAt: '13:15'},
      {id: 3, sender: 'them', text: "Dès que j'ai validé avec le prof", createdAt: '13:16'},
    ],
  },
  {
    id: 3,
    name: 'mathias_rt',
    avatar: makeAvatar('mathias_rt'),
    lastMessage: "L'API REST renvoie les posts correctement",
    lastTime: 'Hier',
    unread: false,
    messages: [
      {id: 1, sender: 'them', text: "L'API REST renvoie les posts correctement", createdAt: 'Hier 18:30'},
      {id: 2, sender: 'me', text: 'Parfait, je teste le fetch ce soir', createdAt: 'Hier 18:35'},
    ],
  },
  {
    id: 4,
    name: 'groupe_dev',
    avatar: makeAvatar('groupe_dev'),
    lastMessage: 'Yanis : Réunion demain à 14h',
    lastTime: 'Hier',
    unread: true,
    messages: [
      {id: 1, sender: 'them', text: 'Yanis : Réunion demain à 14h', createdAt: 'Hier 16:00'},
    ],
  },
];
