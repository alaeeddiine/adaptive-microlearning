# Image officielle Python
FROM python:3.11-slim

# Dossier de travail
WORKDIR /app

# Copier requirements
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste
COPY . .

# Port Flask
EXPOSE 5001

# Lancer Flask
CMD ["python", "app.py"]