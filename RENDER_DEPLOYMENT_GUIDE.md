# Déploiement Render - Guide Complet

## 🎯 Architecture Render

```
┌─────────────────────────────────────────────────────────────┐
│                   Render.com (Gratuit)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🌐 Frontend                    🔌 Backend                    │
│  https://visafin-gest.org       https://api.visafin-gest.org │
│  (Node 20)                      (Python 3.12)                │
│  Port: 3000                     Port: 8000                   │
│                                                               │
│  ├─ npm run build              ├─ python manage.py migrate   │
│  └─ npm run preview             └─ gunicorn wsgi              │
│                                                               │
│  📊 PostgreSQL Database (Render Managed)                      │
│  cryptoinvest-db                                             │
│  └─ Gratuit (500MB limit)                                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Fichiers Prêts

- ✅ `render.yaml` — Configuration complète
- ✅ `backend/requirements.txt` — Dépendances Python
- ✅ `backend/Dockerfile` — Image backend
- ✅ `frontend/Dockerfile.prod` — Image frontend
- ✅ `frontend/.env.production` — Vars prod frontend
- ✅ `backend/invest_backend/settings.py` — CORS configuré

## 🚀 Étapes de Déploiement

### 1️⃣ Préparer Render

1. Crée un compte gratuit : **render.com**
2. Connecte ton repo GitHub : **Zordlive/CryptoInvest**
3. Clique sur **"New Blueprint"** (ou "Infrastructure as Code")

### 2️⃣ Déployer avec render.yaml

1. Sélectionne **"Blueprint"** (pas Web Service)
2. Ajoute le fichier : `render.yaml` (à la racine ✅)
3. Clique **"Deploy"**

**Render va créer automatiquement :**
- Backend Python service
- Frontend Node service
- PostgreSQL database

### 3️⃣ Variables d'Environnement (Auto-générées)

Render génère automatiquement :
- `DJANGO_SECRET_KEY` ✅
- `DATABASE_URL` ✅
- Autres vars : pré-configurées ✅

**Vérifie dans Render Dashboard :**
```
Settings → Environment
```

### 4️⃣ Domaines Personnalisés

**Backend :**
- Render URL : `cryptoinvest-backend-xxxx.onrender.com`
- Custom domain : `api.visafin-gest.org` (à configurer)

**Frontend :**
- Render URL : `cryptoinvest-frontend-xxxx.onrender.com`
- Custom domain : `visafin-gest.org` (à configurer)

### 5️⃣ Google OAuth (Important!)

**Dans Google Cloud Console :**

```
Authorized JavaScript origins:
- https://visafin-gest.org
- https://www.visafin-gest.org

Authorized redirect URIs:
- https://visafin-gest.org
- https://visafin-gest.org/callback (si applicable)
```

**❌ Supprimer :**
- http://localhost:3000
- http://localhost:8000

### 6️⃣ DNS (domaines personnalisés)

**Chez ton registrar DNS :**

```dns
# Frontend
visafin-gest.org  →  CNAME  →  cryptoinvest-frontend-xxxx.onrender.com

# Backend
api.visafin-gest.org  →  CNAME  →  cryptoinvest-backend-xxxx.onrender.com
```

## ⚠️ Limitations Render Gratuit

| Limite | Détail |
|--------|--------|
| **Vérification Email** | Requis (gratuit) |
| **Database** | 500MB PostgreSQL |
| **Inactivité** | Service arrêté après 15 min d'inactivité (spin down) |
| **Uptime** | ~99.5% SLA |
| **Bandwith** | Illimité |

**Solution inactivité :** Renew l'app toutes les 14 min (ping cron)

## 🔄 Build & Deploy Automatique

À chaque `git push` sur `main` :
1. ✅ Render détecte les changements
2. ✅ Build les images Docker/Node
3. ✅ Run les migrations Django
4. ✅ Deploy les services

**Temps estimé :** 3-5 min

## 🐛 Troubleshooting

### ❌ Error: "ALLOWED_HOSTS"
**Solution :** Vérifier `render.yaml` :
```yaml
ALLOWED_HOSTS: '*.onrender.com,visafin-gest.org,api.visafin-gest.org'
```

### ❌ Error: "CORS blocked"
**Solution :** Vérifier `settings.py` :
```python
CORS_ALLOWED_ORIGINS = [
    "https://visafin-gest.org",
    "https://www.visafin-gest.org",
]
```

### ❌ Error: "Database connection"
**Solution :** Render crée automatiquement `DATABASE_URL` ✅

### ❌ Frontend blank page
**Solution :** Vérifier `.env.production` :
```
VITE_API_BASE_URL=https://api.visafin-gest.org/api
```

## 📊 Monitoring Render

**Render Dashboard :**
- Logs → voir erreurs build/runtime
- Metrics → CPU, RAM, Disk
- Deployments → historique des déploiements

## 🎉 C'est prêt !

**Push ton code :**
```bash
git add .
git commit -m "Prepare Render deployment"
git push origin main
```

**Puis :**
1. Va sur render.com
2. Crée Blueprint avec `render.yaml`
3. Attends 3-5 min
4. Visite ton site ! 🚀

---

**Questions ?** Demande-moi l'aide sur Render ! 💪
