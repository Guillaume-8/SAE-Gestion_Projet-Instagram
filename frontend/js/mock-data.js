/**
 * @fileoverview Données fictives pour le développement de l'interface.
 */

export const MOCK_POSTS = [
  {
    id: 1,
    author: 'thomas_rt',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
    isVideo: false,
    caption: 'Déploiement du serveur Apache validé en HTTPS ! #butrt #dev #sae',
    likesCount: 12,
    dislikesCount: 1,
    visibility: 'public',
    comments: [
      {id: 101, author: 'guillaume_rt', text: 'Top la conf SSL !'},
      {id: 102, author: 'mathias_rt', text: 'API REST en cours de route.'},
    ],
    createdAt: 'Il y a 10 minutes',
  },
  {
    id: 2,
    author: 'tanguy_rt',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    isVideo: true,
    caption: 'Premier test du lecteur vidéo pour le projet #multimedia',
    likesCount: 24,
    dislikesCount: 0,
    visibility: 'friends',
    comments: [],
    createdAt: 'Il y a 1 heure',
  },
];

export const MOCK_USER = {
  id: 1,
  username: 'eren_rt',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  bio: 'Responsable Front-End | BUT R&T 3ème année | SAÉ 5.02',
  postsCount: 6,
  followersCount: 42,
  followingCount: 28,
  posts: [
    {id: 1, mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300', isVideo: false},
    {id: 2, mediaUrl: 'https://images.unsplash.com/photo-1618005198919-56ceb5ecca61?w=300', isVideo: false},
    {id: 3, mediaUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=300', isVideo: false},
    {id: 4, mediaUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944b3?w=300', isVideo: false},
    {id: 5, mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300', isVideo: false},
    {id: 6, mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300', isVideo: false},
  ],
};

export const MOCK_TRENDING_POSTS = [
  {id: 1, mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300', isVideo: false, author: 'thomas_rt', likesCount: 12},
  {id: 2, mediaUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=300', isVideo: false, author: 'matheo_rt', likesCount: 45},
  {id: 3, mediaUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944b3?w=300', isVideo: false, author: 'tanguy_rt', likesCount: 67},
  {id: 4, mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300', isVideo: false, author: 'pierre_rt', likesCount: 89},
  {id: 5, mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300', isVideo: false, author: 'yanis_rt', likesCount: 33},
  {id: 6, mediaUrl: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?w=300', isVideo: false, author: 'enes_rt', likesCount: 51},
  {id: 7, mediaUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300', isVideo: false, author: 'mathias_rt', likesCount: 72},
  {id: 8, mediaUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300', isVideo: false, author: 'guillaume_rt', likesCount: 28},
  {id: 9, mediaUrl: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=300', isVideo: false, author: 'jonathan_rt', likesCount: 95},
];

export const MOCK_HASHTAGS = [
  {tag: '#butrt', count: 128},
  {tag: '#sae502', count: 84},
  {tag: '#dev', count: 67},
  {tag: '#multimedia', count: 45},
  {tag: '#apache', count: 32},
  {tag: '#nodejs', count: 28},
  {tag: '#sqlite', count: 19},
  {tag: '#docker', count: 15},
];

export const MOCK_SAVED_POSTS = [
  {id: 1, mediaUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=300', isVideo: false, author: 'matheo_rt', likesCount: 45},
  {id: 2, mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300', isVideo: false, author: 'pierre_rt', likesCount: 89},
  {id: 3, mediaUrl: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=300', isVideo: false, author: 'jonathan_rt', likesCount: 95},
];

export const MOCK_CONVERSATIONS = [
  {
    id: 1,
    name: 'thomas_rt',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
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
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    lastMessage: 'Le certificat SSL est presque prêt',
    lastTime: 'Il y a 1 h',
    unread: false,
    messages: [
      {id: 1, sender: 'them', text: 'Le certificat SSL est presque prêt', createdAt: '13:10'},
      {id: 2, sender: 'me', text: 'Super, je switch du temporaire quand ?', createdAt: '13:15'},
      {id: 3, sender: 'them', text: 'Dès que j\'ai validé avec le prof', createdAt: '13:16'},
    ],
  },
  {
    id: 3,
    name: 'mathias_rt',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    lastMessage: 'L\'API REST renvoie les posts correctement',
    lastTime: 'Hier',
    unread: false,
    messages: [
      {id: 1, sender: 'them', text: 'L\'API REST renvoie les posts correctement', createdAt: 'Hier 18:30'},
      {id: 2, sender: 'me', text: 'Parfait, je teste le fetch ce soir', createdAt: 'Hier 18:35'},
    ],
  },
  {
    id: 4,
    name: 'groupe_dev',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100',
    lastMessage: 'Yanis : Réunion demain à 14h',
    lastTime: 'Hier',
    unread: true,
    messages: [
      {id: 1, sender: 'them', text: 'Yanis : Réunion demain à 14h', createdAt: 'Hier 16:00'},
    ],
  },
];
