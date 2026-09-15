# Système de filtre d'images — SAE-Gestion_Projet-Instagram

Module responsable de l'application de filtres photo côté client, dans le cadre
du clone Instagram réalisé en NodeJS/SQLite (SAÉ 5.02).

## Sommaire

- [Choix de cadrage](#choix-de-cadrage)
- [Fonctionnement général](#fonctionnement-général)
- [Documentation du code](#documentation-du-code)
- [Utilisation](#utilisation)
- [Test en local](#test-en-local)
- [Limites actuelles et pistes d'évolution](#limites-actuelles-et-pistes-dévolution)

## Choix de cadrage

### Traitement côté client plutôt que côté serveur

Deux approches étaient possibles pour appliquer les filtres :

| | Côté serveur (`sharp`) | Côté client (Canvas) — **retenu** |
|---|---|---|
| Charge serveur | Traitement d'image sur chaque requête | Aucune, le navigateur fait le calcul |
| Latence perçue | Aller-retour réseau nécessaire | Rendu instantané pendant l'essai des filtres |
| Complexité backend | Route dédiée `/posts/:id/filter` | Une seule route d'upload classique |
| Dépendances natives | `sharp` (biais liés à l'environnement Docker) | Aucune dépendance native |

**Décision** : filtres appliqués côté client via l'API Canvas. L'image est
« cuite » avec son filtre directement dans le navigateur avant l'envoi au
serveur, ce qui simplifie le backend (une seule route d'upload reçoit
l'image déjà filtrée) et évite les problèmes de compatibilité de `sharp`
dans le conteneur Docker imposé par le sujet.

### Canvas plutôt que CSS `filter`

Un filtre CSS (`ctx.filter = 'grayscale(1)'`) est purement visuel : il
n'existe que dans le DOM et ne modifie pas les données réelles de l'image.
Pour qu'une publication conserve son filtre de façon persistante (comme sur
Instagram), il faut modifier les pixels eux-mêmes. L'API Canvas
(`getImageData` / `putImageData`) permet de manipuler directement le
tableau de pixels et d'exporter le résultat en fichier via `canvas.toBlob()`.

### Toujours repartir de l'image d'origine

Les filtres ne sont pas cumulables : sélectionner « sépia » puis « noir et
blanc » doit donner du noir et blanc, pas un mélange des deux. Le module
conserve donc en mémoire une copie intacte des pixels d'origine
(`originalImageData`) et repart systématiquement de cette copie avant
d'appliquer un nouveau filtre.

### Filtres simples uniquement (pas de traitement par voisinage)

Choix volontaire de rester sur des filtres qui ne modifient chaque pixel
qu'en fonction de lui-même (pas de lecture des pixels voisins), pour
garder un code simple et rapide à exécuter dans le navigateur. Des effets
comme le flou ou la vignette sont donc exclus du périmètre actuel.

## Fonctionnement général

```
Upload fichier → dessin dans <canvas> → sauvegarde de l'original
     ↓
Clic sur un filtre → clone de l'original → application du filtre → affichage
     ↓
[Reset possible → réaffiche l'original]
     ↓
Publication → export du canvas en blob → upload vers POST /posts
```

## Documentation du code

Fichier : `public/js/filters.js`

### `input.addEventListener('change', ...)`

Écoute la sélection d'un fichier par l'utilisateur. Utilise `FileReader`
pour convertir le fichier en URL `data:` chargeable par un objet `Image`,
puis dessine cette image dans le `<canvas>` une fois chargée
(`img.onload`). Le canvas est redimensionné aux dimensions exactes de
l'image pour éviter toute déformation. Une copie des pixels d'origine est
sauvegardée dans `originalImageData` juste après ce premier dessin.

### `clamp(value)`

Limite une valeur entre 0 et 255. Nécessaire pour tous les filtres qui
additionnent ou multiplient des composantes de couleur (`brightness`,
`highContrast`, `saturate`), afin d'éviter qu'une valeur dépasse la plage
valide et ne casse le rendu (ex: 250 + 40 = 290, invalide sans `clamp`).

### `applyFilter(canvas, ctx, filterName)`

Récupère les pixels actuels du canvas via `ctx.getImageData()`, qui
retourne un tableau plat où chaque pixel occupe 4 cases consécutives
(Rouge, Vert, Bleu, Alpha). Modifie ce tableau selon le filtre demandé,
puis réécrit le résultat dans le canvas avec `ctx.putImageData()`.

**7 filtres implémentés :**

| Filtre | Nom (`filterName`) | Principe |
|---|---|---|
| Noir & blanc | `grayscale` | Moyenne des composantes R/G/B, appliquée aux trois |
| Sépia | `sepia` | Matrice de conversion standard (coefficients fixes) |
| Contraste | `highContrast` | Écarte chaque composante de la valeur médiane (128) |
| Luminosité | `brightness` | Ajoute une valeur fixe à chaque composante |
| Négatif | `invert` | Inverse chaque composante (`255 - valeur`) |
| Saturation | `saturate` | Écarte chaque composante de la moyenne R/G/B |
| Chaud | `warm` | Augmente le rouge, diminue le bleu |

### `selectFilter(filterName)`

Clone `originalImageData` (via `new Uint8ClampedArray(...)`, une vraie
copie et non une référence) avant d'appliquer le filtre choisi. Garantit
que chaque filtre part d'une base propre, sans cumul avec un filtre
précédent.

### `resetToOriginal()`

Réaffiche directement `originalImageData` dans le canvas, sans passer par
aucun filtre.

### `publishImage()`

Exporte l'état actuel du canvas en `Blob` via `canvas.toBlob()` (opération
asynchrone, d'où le callback). Empaquette ce blob dans un `FormData` et
l'envoie en `POST` vers `/posts`, exactement comme le ferait un upload de
fichier classique — la route backend n'a donc pas besoin de logique
spécifique pour les images filtrées.

## Utilisation

Page HTML minimale nécessaire :

```html
<input type="file" id="imageInput" accept="image/*">
<canvas id="previewCanvas"></canvas>

<button onclick="resetToOriginal()">Original</button>
<button onclick="selectFilter('grayscale')">Noir & blanc</button>
<button onclick="selectFilter('sepia')">Sépia</button>
<button onclick="selectFilter('highContrast')">Contraste</button>
<button onclick="selectFilter('brightness')">Luminosité</button>
<button onclick="selectFilter('invert')">Négatif</button>
<button onclick="selectFilter('saturate')">Saturation</button>
<button onclick="selectFilter('warm')">Chaud</button>
<button onclick="publishImage()">Publier</button>

<script src="/js/filters.js"></script>
```

## Test en local

Le projet n'a pas encore de route `/posts` fonctionnelle côté serveur
principal (en attente de la partie publication de l'équipe) ni de
Dockerfile. Pour valider le module de façon indépendante, un petit serveur
Express jetable (`test-server.js`, à la racine, **non commité**) permet de
servir `public/` et de simuler l'endpoint `/posts` avec `multer` :

```bash
npm install express multer
node test-server.js
```

Puis ouvrir `http://localhost:3000/filtres.html` dans le navigateur.
`test-server.js`, `uploads/` et `node_modules/` sont listés dans
`.gitignore` pour ne pas polluer le dépôt commun.

## Limites actuelles et pistes d'évolution

- Filtres actuellement codés en dur dans `filters.js` ; pourrait être
  piloté par la table `filters` en base pour une configuration dynamique.
- Pas de compression/redimensionnement avant upload (image envoyée en
  pleine résolution).
- Filtres volontairement simples (pas de flou, vignette ou autres effets
  nécessitant une lecture des pixels voisins).
- Aucune gestion d'erreur utilisateur si `canvas.toBlob()` échoue ou si
  l'upload réseau échoue au-delà du `console.error`.