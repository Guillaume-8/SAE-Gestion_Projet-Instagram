---
sidebar_position: 4
title: Styles et thèmes
---

# Styles et thèmes

Tout le style vit dans **un seul fichier** : `css/style.css`. Il est organisé en
sections commentées et piloté par des variables CSS.

## Variables de thème

```css
:root {
  --bg-color: #fafafa;
  --card-bg: #ffffff;
  --border-color: #dbdbdb;
  --text-main: #262626;
  --text-secondary: #8e8e8e;
  --accent-color: #0095f6;
  --danger-color: #ed4956;
  --like-color: #ff3040;
  --header-bg: #ffffff;
  --shadow-color: rgba(0, 0, 0, 0.08);
}

[data-theme="dark"] {
  --bg-color: #121212;
  --card-bg: #1e1e1e;
  --border-color: #333333;
  --text-main: #f5f5f5;
  --text-secondary: #a0a0a0;
  --header-bg: #1e1e1e;
  --shadow-color: rgba(0, 0, 0, 0.4);
}
```

Le thème s'applique par l'attribut `data-theme` sur `<html>`. Aucun composant
n'utilise de couleur en dur : c'est ce qui rend la bascule instantanée.

## Application avant rendu

`index.html` exécute un script bloquant dans `<head>` :

```html
<script>
  const savedTheme = localStorage.getItem('instaclone-theme');
  if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
  }
</script>
```

Sans cela, la page s'affiche en clair puis bascule en sombre : le « flash
blanc » que l'on voit sur beaucoup de sites.

## Organisation du fichier

| Section | Contenu |
| --- | --- |
| Base | Reset, typographie, variables |
| En-tête | Barre de navigation, menu mobile, badge |
| Fil | Cartes de publication, actions |
| Profils | En-tête de profil, grille |
| Messagerie | Sidebar, bulles, modales, sélecteurs |
| Modales | Superposition, contenu, fermeture |
| Toasts | Notifications éphémères |
| Responsive | Points de rupture 900 px et 600 px |

## Conventions CSS

- **BEM allégé** : `.message-bubble`, `.message-container.mine`,
  `.group-details-sidebar`.
- Pas de `!important` sauf correction ciblée documentée.
- Les états passent par des classes (`.active`, `.mine`, `.other`), pas par des
  styles inline — sauf pour les valeurs calculées en JS (`width: 42%` d'une
  barre de progression).
- Toute règle nouvelle est ajoutée **en fin de section**, jamais au milieu :
  cela limite les régressions de spécificité.

## Exemple : les bulles de message

```css
.message-container.other .message-bubble {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
}

.message-container.mine .message-bubble {
  background: var(--accent-color);
  color: #fff;
  border: none;
}
```

:::note Historique
Une ancienne règle donnait aux bulles `background: var(--bg-color)`, soit
exactement la couleur du fond : les messages semblaient flotter dans le vide.
Corrigé en v2.1 — voir [Dépannage](../exploitation/depannage.md).
:::

## Responsive

| Point de rupture | Adaptation |
| --- | --- |
| ≤ 900 px | Sidebar de messagerie repliée, grilles en 2 colonnes |
| ≤ 600 px | Navigation par hamburger, grille en 1 colonne, chat plein écran |

## Ajouter un thème

1. Ajouter un bloc `[data-theme="mon-theme"] { … }` avec les mêmes variables.
2. Ajouter l'option dans `settings.js`.
3. Rien d'autre : tous les composants suivent automatiquement.
