# Coolify Deployment Configuration

## Configuration Files

### `backend/nixpacks.toml`
Configuration pour le système de build Nixpacks utilisé par Coolify.
- Spécifie Python 3.9
- Installe les dépendances système (gcc, libpq)
- Configure les commandes de migration et démarrage

### `backend/.dockerignore` et `/.dockerignore`
Fichiers pour optimiser les builds Docker en ignorant les fichiers inutiles.
- Exclut node_modules, venv, .git, etc.
- Réduit la taille de l'image finale

### `backend/Dockerfile`
Dockerfile personnalisé pour construire l'image du backend.
- Utilisé quand vous déployez directement avec docker-compose.yml
- Peut aussi être utilisé par Coolify au lieu de Nixpacks

## Comment déployer sur Coolify

### Option 1 : Utiliser Nixpacks (Automatique - Recommandé)
1. Connectez votre repository GitHub à Coolify
2. Sélectionnez la branche `main`
3. Coolify détecte automatiquement l'application Python
4. Utilise la configuration `backend/nixpacks.toml`
5. Les variables d'environnement doivent être définies dans Coolify :
   ```
   DJANGO_SECRET_KEY=<votre-clé-secrète>
   DEBUG=False
   GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
   ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
   ```

### Option 2 : Utiliser Docker Compose
1. Définissez le type de service comme "Docker Compose"
2. Uploadez ou pointez vers `docker-compose.yml`
3. Configurez les variables d'environnement pour les services

### Option 3 : Utiliser le Dockerfile personnalisé
1. Définissez le type de service comme "Dockerfile"
2. Pointez vers `backend/Dockerfile`
3. Coolify construira en utilisant votre Dockerfile personnalisé

## Variables d'Environnement Obligatoires

```
# Django
DJANGO_SECRET_KEY=<clé-forte-générée>
DEBUG=False
ALLOWED_HOSTS=visafin-gest.org,www.visafin-gest.org

# Database (géré par Coolify ou votre PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Google OAuth
GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<votre-secret-client>

# Site
SITE_URL=https://visafin-gest.org

# Email
DJANGO_EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.yourmailprovider.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-password
```

## Dépannage

### Erreur: "attribute 'dev' missing"
**Cause**: Nixpacks essaie d'installer une version de PostgreSQL qui n'existe pas.  
**Solution**: La configuration `backend/nixpacks.toml` résout ce problème en installant uniquement `libpq` (client) au lieu de `postgresql_16.dev`.

### Erreur: "ModuleNotFoundError: No module named 'django'"
**Cause**: Les dépendances Python n'ont pas été installées.  
**Solution**: Coolify devrait exécuter `pip install -r requirements.txt` automatiquement. Vérifiez les logs de build.

### Erreur: "No such file or directory: manage.py"
**Cause**: Le répertoire de travail est incorrect.  
**Solution**: La configuration `nixpacks.toml` spécifie les bonnes commandes. Assurez-vous que les fichiers sont dans `backend/`.

### Base de données non créée
**Cause**: PostgreSQL n'est pas configuré dans Coolify.  
**Solution**: 
- Coolify peut créer une base de données PostgreSQL pour vous (option dans la configuration)
- Ou utilisez un service PostgreSQL externe et définissez `DATABASE_URL`

## Ports et URLs

- **Backend API**: `http(s)://yourdomain.com/api`
- **Django Admin**: `http(s)://yourdomain.com/admin`
- **Frontend**: Déployé séparément (peut être le même domaine ou un sous-domaine)

## Après le Déploiement

1. Vérifiez les logs dans Coolify
2. Testez l'endpoint `/api/me` (devrait retourner 401 ou utilisateur actuel)
3. Accédez à `/admin` pour créer un compte administrateur
4. Configurez les variables d'environnement manquantes si nécessaire

## Structure du Déploiement

```
Coolify (Platform)
  ├── Backend Service (Python/Django)
  │   ├── Utilise: backend/nixpacks.toml ou backend/Dockerfile
  │   ├── Port: 8000
  │   └── Variables: DJANGO_SECRET_KEY, DEBUG, DATABASE_URL, etc.
  │
  └── Frontend Service (Node.js/React)
      ├── Utilise: frontend/Dockerfile
      ├── Port: 3000
      └── Variables: VITE_API_BASE_URL, VITE_GOOGLE_CLIENT_ID
```

## Référence Rapide

| Fichier | Purpose | Obligatoire |
|---------|---------|-------------|
| `backend/nixpacks.toml` | Config Nixpacks pour Coolify | Recommandé |
| `backend/Dockerfile` | Build Docker personnalisée | Optionnel |
| `backend/.dockerignore` | Optimisation build Docker | Optionnel |
| `docker-compose.yml` | Déploiement complet (prod local) | Optionnel |
| `backend/.env` | Variables locales (dev) | Dev seulement |
| `backend/.env.example` | Template (version contrôlée) | Doc |

