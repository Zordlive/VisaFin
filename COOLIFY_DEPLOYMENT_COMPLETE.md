# Guide de déploiement Coolify - CryptoInvest

## Architecture déployée

- **Frontend** : https://visafin-gest.org (React + Vite)
- **Backend** : https://api.visafin-gest.org (Django + DRF)
- **Database** : PostgreSQL (service Coolify)

---

## 1️⃣ Déploiement de la base de données

### Dans Coolify :
1. Clique sur **"New Resource"** → **"Database"** → **"PostgreSQL"**
2. Nom : `cryptoinvest-db`
3. Version : `15` (ou dernière)
4. Note la **Connection String** générée (format : `postgresql://user:pass@host:port/db`)

---

## 2️⃣ Déploiement du Backend

### Configuration dans Coolify :

**General Settings :**
- Repository : `Zordlive/CryptoInvest`
- Branch : `main`
- Build Pack : `Nixpacks` (ou `Dockerfile`)
- Base Directory : `backend`
- Port : `8000`

**Dockerfile (si Build Pack = Dockerfile) :**
- Dockerfile Path : `backend/Dockerfile.prod`

**Domain :**
- `api.visafin-gest.org`

**Environment Variables :**
```bash
DJANGO_SECRET_KEY=<GENERER_AVEC_SCRIPT>
DEBUG=False
ALLOWED_HOSTS=api.visafin-gest.org,visafin-gest.org
DATABASE_URL=<CONNECTION_STRING_DE_POSTGRESQL>
SITE_URL=https://visafin-gest.org
GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
PORT=8000
```

**Pour générer DJANGO_SECRET_KEY :**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Vérification après déploiement :
- `https://api.visafin-gest.org/api/me` → Devrait retourner `{"detail":"Authentication credentials were not provided."}`
- `https://api.visafin-gest.org/admin` → Page d'admin Django

---

## 3️⃣ Déploiement du Frontend

### Configuration dans Coolify :

**General Settings :**
- Repository : `Zordlive/CryptoInvest`
- Branch : `main`
- Build Pack : `Dockerfile`
- Dockerfile Path : `Dockerfile.frontend`
- Port : `3000`

**Domain :**
- `visafin-gest.org`

**Build Environment Variables** (dans "Build Variables", PAS Runtime) :
```bash
VITE_API_BASE_URL=https://api.visafin-gest.org/api
VITE_GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
```

⚠️ **IMPORTANT** : Ces variables doivent être dans **Build Variables** car Vite les compile dans le bundle au moment du build.

### Vérification après déploiement :
- `https://visafin-gest.org` → Application React chargée
- Console navigateur → Pas d'erreur CORS
- Login/Register → Appels API vers `https://api.visafin-gest.org/api`

---

## 4️⃣ Configuration DNS

Dans ton fournisseur DNS (Cloudflare, OVH, etc.) :

```
Type    Name    Target
A       @       <IP_SERVEUR_COOLIFY>
A       api     <IP_SERVEUR_COOLIFY>
CNAME   www     visafin-gest.org
```

---

## 5️⃣ Google OAuth (après déploiement)

### Google Cloud Console :
1. Va sur https://console.cloud.google.com
2. API & Services → Credentials
3. Modifie ton OAuth Client ID
4. **Authorized JavaScript origins** :
   - `https://visafin-gest.org`
   - `https://www.visafin-gest.org`
5. **Authorized redirect URIs** :
   - `https://visafin-gest.org`
   - `https://visafin-gest.org/dashboard`
6. Sauvegarde

---

## 6️⃣ Vérifications finales

### Backend sanity check :
```bash
curl https://api.visafin-gest.org/api/me
# Réponse attendue : {"detail":"Authentication credentials were not provided."}
```

### Frontend sanity check :
1. Ouvre `https://visafin-gest.org`
2. F12 → Console → Pas d'erreur CORS
3. F12 → Network → Les appels vont vers `api.visafin-gest.org`
4. Teste Register → Vérifier que l'API répond

### Database check (dans Coolify logs backend) :
```
Running migrations...
Operations to perform: ...
No migrations to apply.
Starting Gunicorn...
```

---

## 🔥 Troubleshooting

### CORS Error
- Vérifie `CORS_ALLOWED_ORIGINS` dans `settings.py`
- Vérifie que le frontend build a les bonnes variables `VITE_API_BASE_URL`

### 404 Not Found
- Frontend : Vérifie que le Dockerfile compile bien le `dist/`
- Backend : Vérifie les logs Coolify pour erreurs Nixpacks

### 500 Internal Server Error
- Vérifie les logs backend : `DEBUG=True` temporairement
- Vérifie `DATABASE_URL` et connexion PostgreSQL
- Vérifie `ALLOWED_HOSTS` contient le bon domaine

### Database connection refused
- Vérifie que le service PostgreSQL est bien running
- Vérifie la `DATABASE_URL` (host, port, credentials)
- Dans Coolify, assure-toi que backend et db sont sur le même network

---

## 📝 Commandes utiles

### Générer secret key Django :
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Rebuild frontend après changement d'API URL :
```bash
# Dans Coolify : Redeploy le frontend
# Les build variables seront réinjectées
```

### Voir les logs backend :
```bash
# Dans Coolify → Backend → Logs (Runtime)
```

---

Bon déploiement ! 🚀
