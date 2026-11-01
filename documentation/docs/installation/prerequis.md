---
sidebar_position: 1
---

# Prérequis

Avant d'installer et de lancer InstaClone, assurez-vous que les outils suivants sont installés sur votre machine.

## Environnement de développement

| Outil | Version minimale | Rôle |
|---|---|---|
| **Node.js** | 18.x | Runtime JavaScript pour le back-end et les outils de build |
| **npm** | 9.x | Gestionnaire de paquets (inclus avec Node.js) |
| **Git** | 2.34 | Gestion de versions, clonage du dépôt |
| **Visual Studio Code** | 1.80+ | IDE utilisé par toute l'équipe |
| **WSL 2** (Windows) | — | Environnement Linux sous Windows (recommandé) |

## Serveur web

| Outil | Version minimale | Rôle |
|---|---|---|
| **Apache 2** | 2.4.x | Serveur web front-end + reverse proxy vers Node.js |
| **OpenSSL** | 1.1.1+ | Génération des certificats SSL/TLS |

### Modules Apache requis

Les modules Apache suivants doivent être activés :

```bash
sudo a2enmod ssl
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
sudo systemctl restart apache2
```

| Module | Utilité |
|---|---|
| `ssl` | Chiffrement HTTPS |
| `proxy` | Reverse proxy vers le back-end Node.js |
| `proxy_http` | Proxy HTTP pour les requêtes API REST |
| `proxy_wstunnel` | Proxy WebSocket pour la messagerie temps réel |
| `rewrite` | Réécriture d'URL (redirection HTTP → HTTPS) |

## Conteneurisation

| Outil | Version minimale | Rôle |
|---|---|---|
| **Docker** | 24.x | Conteneurisation de l'application |
| **Docker Compose** | 2.20+ | Orchestration multi-conteneurs (front + back + DB) |

## Base de données

| Outil | Rôle |
|---|---|
| **SQLite 3** | Base de données embarquée (fichier `.db`) |
| **sqlite3** (CLI) | Inspection manuelle des bases |

SQLite ne nécessite pas de serveur séparé — le fichier de base de données est stocké localement.

## Vérification rapide

```bash
node --version    # v18.x ou supérieur
npm --version     # 9.x ou supérieur
git --version     # 2.34 ou supérieur
apache2 -v        # Server version: Apache/2.4.x
docker --version  # Docker version 24.x
```

Si tous les outils répondent correctement, vous pouvez passer à l'[installation du front-end](./front-end).
