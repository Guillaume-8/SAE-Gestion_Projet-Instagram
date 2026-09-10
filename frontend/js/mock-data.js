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
      { id: 101, author: 'guillaume_rt', text: 'Top la conf SSL !' },
      { id: 102, author: 'mathias_rt', text: 'API REST en cours de route.' }
    ],
    createdAt: 'Il y a 10 minutes'
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
    createdAt: 'Il y a 1 heure'
  }
];
