# Image officielle Node.js
FROM node:20

# Dossier de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du projet
COPY . .

# Exposer le port du backend
EXPOSE 5000

# Démarrer le serveur
CMD ["node", "server.js"]