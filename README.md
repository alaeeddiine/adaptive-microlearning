# 🚀 Adaptive Microlearning Platform

Une plateforme d'apprentissage adaptatif basée sur l'Intelligence Artificielle.

## Technologies utilisées

- ⚛️ React + Vite
- 🎨 Tailwind CSS
- 🟢 Node.js + Express
- 🐍 Python + Flask
- 🗄️ SQLite
- 🔥 Firebase Authentication
- 🤖 Machine Learning
- 🐳 Docker & Docker Compose

Tous les services sont exécutés avec Docker Compose.

---

# Prérequis

Avant de lancer le projet, assurez-vous d'avoir installé :

- Docker Desktop

https://www.docker.com/products/docker-desktop/?utm_source=chatgpt.com#download

Aucune autre installation n'est nécessaire.

Vous n'avez PAS besoin d'installer :

- Node.js
- Python
- SQLite
- npm
- pip
- VS Code

Docker contient toutes les dépendances nécessaires.

---

# Installation

## 1. Cloner le projet

```bash
git clone https://github.com/alaeeddiine/adaptive-microlearning 
```

Puis :

```bash
cd adaptive-microlearning
```

---

## 2. Démarrer Docker Desktop

Assurez-vous que Docker Desktop est lancé avant de continuer.

---

## 3. Construire et lancer le projet

La première fois :

```bash
docker compose up --build
```

Les fois suivantes :

```bash
docker compose up
```

Patientez quelques instants pendant le démarrage des services. ( ça peut prendre du temps depends a votre connexion ) 

---

# Accéder à l'application

Une fois les services démarrés, ouvrez votre navigateur :

```
http://localhost:5173
```
pour acceder au tableau de bord admin : 

Email: admin.2026@gmail.com
mots de passe: admin.2026
---

# Architecture

```
adaptive-microlearning
│
├── frontend      → React + Vite
├── backend       → Express + SQLite
├── ml            → Flask + Machine Learning
│
└── docker-compose.yml
```

---

# Services Docker

| Service | Port |
|----------|------|
| Frontend | 5173 |
| Backend | 5000 |
| IA (Flask) | 5001 |

---

# Arrêter l'application

Dans le terminal :

```bash
CTRL + C
```

Puis :

```bash
docker compose down
```

---

# Redémarrer l'application

```bash
docker compose up
```

---

# En cas de modification du code

Si vous avez modifié le code source, reconstruisez les images :

```bash
docker compose down
docker compose up --build
```

---

# Résolution des problèmes

## Vérifier que Docker fonctionne

```bash
docker ps
```

Les trois conteneurs doivent être actifs.

---

## Voir les logs

Tous les services :

```bash
docker compose logs
```

Backend :

```bash
docker compose logs backend
```

Frontend :

```bash
docker compose logs frontend
```

Service IA :

```bash
docker compose logs ml
```

---

# Technologies utilisées

## Frontend

- React
- Vite
- Tailwind CSS
- React Router

## Backend

- Node.js
- Express
- SQLite

## Intelligence Artificielle

- Python
- Flask
- Scikit-Learn

## Conteneurisation

- Docker
- Docker Compose

---

# Auteur

Projet réalisé dans le cadre d'un Projet de Fin d'Études (PFE).

Développé par :

Nom : Alae-eddine Azzahhafi - Full-stack Developper 
Année : 2026
