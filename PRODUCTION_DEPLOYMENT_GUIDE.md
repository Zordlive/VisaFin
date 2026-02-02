# Guide Complet de Déploiement Production - CryptoInvest

## Architecture finale
```
Frontend (React + Vite)
  ↓ (port 80/443 via Nginx)
  ↓ proxie /api/ → Backend
Backend (Django + Gunicorn)
  ↓ (port 8000)
  ↓
PostgreSQL
```

---

## 1️⃣ Configuration Frontend (Dockerfile + Nginx)

### Frontend/Dockerfile.prod
- **Build Stage**: Compile React avec `VITE_API_BASE_URL=https://api.visafin-gest.org/api`
- **Production Stage**: Servir via Nginx avec gzip + cache busting
- **SPA Fallback**: Tout route vers `index.html` pour React Router
- **Port**: 80 (Nginx)

### Frontend/nginx.conf
- Proxy `/api/` vers `https://api.visafin-gest.org/api/`
- Cache long pour assets avec hash
- Fallback `try_files` pour React Router
- Headers de sécurité pour X-Forwarded

---

## 2️⃣ Configuration Backend (Dockerfile Django)

### Backend/Dockerfile.prod
- Multi-stage build (builder + runtime)
- Python 3.9-slim
- Venv isolé
- `python manage.py migrate` au démarrage
- Gunicorn avec 4 workers
- Healthcheck vers `/api/me`
- Port 8000

---

## 3️⃣ Variables d'environnement Backend (Coolify)

```bash
DEBUG=False
DJANGO_SECRET_KEY=<generate-strong-key>
DATABASE_URL=postgresql://user:pass@host:5432/db
ALLOWED_HOSTS=api.visafin-gest.org,visafin-gest.org,www.visafin-gest.org
SITE_URL=https://visafin-gest.org
GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
SECURE_SSL_REDIRECT=True
```

---

## 4️⃣ Variables de Build Frontend (Coolify)

```bash
# Build Variables (CRUCIALES - compilées dans le bundle)
VITE_API_BASE_URL=https://api.visafin-gest.org/api
VITE_GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
```

⚠️ **IMPORTANT**: Ces variables DOIVENT être en **Build Variables**, pas Runtime Variables.

---

## 5️⃣ CORS Backend (settings.py)

```python
CORS_ALLOWED_ORIGINS = [
    'https://visafin-gest.org',
    'https://www.visafin-gest.org',
]

CSRF_TRUSTED_ORIGINS = [
    'https://visafin-gest.org',
    'https://www.visafin-gest.org',
]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
```

---

## 6️⃣ DNS Configuration

```
Type    Name    Target (IP Coolify)
A       @       <IP>
A       api     <IP>
CNAME   www     visafin-gest.org
```

---

## 7️⃣ SSL/TLS (Coolify Traefik)

1. **Domaines dans Coolify**:
   - Backend: `api.visafin-gest.org`
   - Frontend: `visafin-gest.org`

2. **Status**: Doit être **Active** (pas Provisioning)

3. **Let's Encrypt**: Généré automatiquement par Traefik

4. **Certificat**: Vérifié avec 🔒 cadenas en HTTPS

---

## 8️⃣ Checklist de déploiement

- [ ] Backend Dockerfile.prod vérifié
- [ ] Frontend Dockerfile.prod avec VITE_API_BASE_URL
- [ ] nginx.conf créé pour SPA + proxy API
- [ ] Domaines définis dans Coolify (api.*, www.*)
- [ ] DNS A records pointent vers Coolify
- [ ] Variables d'environnement (Runtime pour backend)
- [ ] Build Variables (pour frontend)
- [ ] CORS configuré en settings.py
- [ ] Backend HTTPS avec certificat valide 🔒
- [ ] Frontend HTTPS avec certificat valide 🔒
- [ ] Healthcheck OK pour backend
- [ ] Test `/api/me` répond (401 normal sans token)

---

## 9️⃣ Tests de validation

### Backend
```bash
curl https://api.visafin-gest.org/
# Résultat: JSON avec "VISAFINANCE API"

curl https://api.visafin-gest.org/api/me
# Résultat: {"detail":"Authentication credentials were not provided."}
```

### Frontend
```
https://visafin-gest.org
# Doit voir: Application React chargée
# Console: "🔗 API Base URL: https://api.visafin-gest.org/api"
# Network: Appels vers https://api.visafin-gest.org/api
```

### CORS/OAuth
```
1. Page Login visible
2. Cliquer Google Sign-In
3. Pas d'erreur CORS dans console
4. Redirection vers dashboard après auth
```

---

## 🚨 Troubleshooting

### Frontend montre 404
- Vérifier que nginx.conf a `try_files $uri $uri/ /index.html`
- Vérifier que Dockerfile copie nginx.conf au bon endroit

### API retourne CORS error
- Vérifier CORS_ALLOWED_ORIGINS en settings.py
- Vérifier que DEBUG=False en prod
- Vérifier que CORS_ALLOW_CREDENTIALS=True

### Certificat invalide (TRAEFIK DEFAULT CERT)
- Domaine pas en **Active** dans Coolify
- DNS pas bien configuré
- Attendre 1-2 min après ajout du domaine

### Login échoue
- Vérifier console frontend pour URL API affichée
- Vérifier que VITE_API_BASE_URL en Build Variables
- Forcer rebuild du frontend

---

Déploiement complet ✅
