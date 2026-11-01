---
sidebar_position: 4
title: Conventions de code
---

# Conventions de code

Le code suit le **Google TypeScript/JavaScript Style Guide** adapté au
JavaScript natif, avec des modules ES6 et une documentation JSDoc.

## Règles de style

| Règle | Application |
| --- | --- |
| Indentation | 2 espaces |
| Guillemets | simples (`'texte'`), doubles uniquement si le texte contient une apostrophe |
| Point-virgule | obligatoire |
| Longueur de ligne | 80 caractères visés, 100 maximum |
| Nommage | `camelCase` variables/fonctions, `PascalCase` classes, `UPPER_SNAKE` constantes |
| Modules | `import` / `export` ES6, jamais de variable globale implicite |

## JSDoc obligatoire

Chaque fichier commence par un `@fileoverview`, chaque fonction publique a son
bloc complet :

```js
/**
 * @fileoverview Gestion de la messagerie temps réel.
 */

/**
 * Envoie un message texte dans la conversation courante.
 * @param {string} contenu Texte du message.
 * @return {void}
 */
function envoyerMessage(contenu) {
  // …
}
```

Types utilisés : `{string}`, `{number}`, `{boolean}`, `{Object}`, `{Array<T>}`,
`{Promise<void>}`, `{HTMLElement}`.

## Piège récurrent : les apostrophes françaises

En JavaScript, une chaîne délimitée par des apostrophes ne peut pas contenir
d'apostrophe non échappée. Les textes français sont pleins de « l' », « d' »,
« n' »…

```js
// ✗ casse le fichier
toast('Impossible d'envoyer le fichier.');

// ✓ guillemets doubles
toast("Impossible d'envoyer le fichier.");

// ✓ échappement
toast('Impossible d\'envoyer le fichier.');
```

C'est la cause d'erreur la plus fréquente du projet : un fichier entier cesse
d'être chargé pour une seule apostrophe.

## Structure d'une vue

```js
/**
 * @fileoverview Vue « Amis ».
 */

import {getUsers} from '../api.js';
import {showToast} from '../toast.js';

/**
 * Construit le HTML de la vue.
 * @return {string} Balisage HTML.
 */
export function render() {
  return `
    <section class="friends-page">
      <h2>Amis</h2>
      <div id="friends-list"></div>
    </section>`;
}

/**
 * Branche les écouteurs après insertion dans le DOM.
 * @return {Promise<void>}
 */
export async function mount() {
  const liste = document.getElementById('friends-list');
  const utilisateurs = await getUsers();
  liste.innerHTML = utilisateurs.map(/* … */).join('');
}
```

## Sécurité dans le HTML généré

Toute donnée venue du serveur passe par `escapeHtml()` avant d'être insérée :

```js
liste.innerHTML = utilisateurs
  .map((u) => `<span>${escapeHtml(u.pseudonyme)}</span>`)
  .join('');
```

Cela empêche l'injection de balises via un pseudo ou un commentaire.

## Vérifications avant livraison

```bash
# Syntaxe de chaque module (en ESM)
node --input-type=module --check < js/views/messages.js

# Import de tous les modules avec un DOM simulé
node /tmp/test-modules.mjs
```
