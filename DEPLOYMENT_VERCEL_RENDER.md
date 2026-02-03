# Déploiement Vercel + Render - CryptoInvest

## 🎯 Architecture

```
Frontend (React)          Backend (Django)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Vercel                    Render
https://...vercel.app     https://...onrender.com
(SPA)                     (API REST)
     ↓
     ↓ (HTTPS)
     ↓
  API_BASE_URL
  https://...onrender.com/api
```

---

## 📋 Étape 1 : Déployer le Backend (Render)

### 1.1 Créer un projet Render

1. Va sur **render.com**
2. New → **Web Service**
3. Connecte ton repo GitHub : `Zordlive/CryptoInvest`
4. Config :
   - **Name** : `cryptoinvest-backend`
   - **Runtime** : Python 3.12
   - **Build Command** :
     ```
     cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput
     ```
   - **Start Command** :
     ```
     cd backend && python manage.py migrate --noinput && gunicorn invest_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 3
     ```

### 1.2 Variables d'environnement (Render)

Dans **Environment** :
```
DJANGO_SECRET_KEY=          (auto-généré par Render)
DEBUG=False
ALLOWED_HOSTS=*.onrender.com,*.vercel.app,visafin-gest.org
DATABASE_URL=               (auto PostgreSQL par Render)
GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
SITE_URL=https://visafin-gest.org
CORS_ALLOWED_ORIGINS=https://cryptoinvest-frontend.vercel.app,https://visafin-gest.org
```

### 1.3 Déployer

Clique **Deploy** → Attends 3-5 min

Copie l'URL : **`https://cryptoinvest-backend-xxxx.onrender.com`**

---

## 📋 Étape 2 : Déployer le Frontend (Vercel)

### 2.1 Préparer le projet

Crée/mets à jour : **`frontend/.env.production`**
```
VITE_API_BASE_URL=https://cryptoinvest-backend-xxxx.onrender.com/api
VITE_GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
```

### 2.2 Créer un projet Vercel

1. Va sur **vercel.com**
2. **New Project**
3. **Import Git Repository** → `Zordlive/CryptoInvest`
4. Config :
   - **Framework** : Vite
   - **Root Directory** : `frontend`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`

### 2.3 Variables d'environnement (Vercel)

Dans **Settings → Environment Variables** :
```
VITE_API_BASE_URL=https://cryptoinvest-backend-xxxx.onrender.com/api
VITE_GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
```

⚠️ **Important** : Ces variables doivent être disponibles au **build time**

### 2.4 Déployer

Clique **Deploy** → Attends 2-3 min

Copie l'URL : **`https://cryptoinvest-frontend-xxxx.vercel.app`**

---

## 🔗 Étape 3 : Vérifier la connexion

**Backend :**
```
https://cryptoinvest-backend-xxxx.onrender.com/
```
→ Doit voir le JSON de l'API ✅

**Frontend :**
```
https://cryptoinvest-frontend-xxxx.vercel.app
```
→ Doit charger l'app React ✅

**Logs CORS :**
```bash
# Dans le navigateur (F12 → Console)
# Vérifier pas d'erreur CORS

# Dans Render (Logs) :
# Vérifier les requêtes en provenance du frontend
```

---

## 🌐 Étape 4 : Domaines personnalisés (optionnel)

### Backend

**Render Dashboard → Backend → Settings → Custom Domains**
- Ajoute : `api.visafin-gest.org`
- Render donne un CNAME

**Chez ton registrar DNS :**
```
api.visafin-gest.org  →  CNAME  →  [CNAME Render]
```

### Frontend

**Vercel Dashboard → Project Settings → Domains**
- Ajoute : `visafin-gest.org`
- Vercel donne les nameservers ou CNAME

**Chez ton registrar DNS :**
```
visafin-gest.org  →  CNAME  →  cname.vercel-dns.com
```

---

## 🔐 Étape 5 : Google OAuth

**Google Cloud Console → OAuth Client :**

```
Authorized JavaScript origins :
- https://cryptoinvest-frontend-xxxx.vercel.app
- https://visafin-gest.org
- https://www.visafin-gest.org

Authorized redirect URIs :
- https://cryptoinvest-frontend-xxxx.vercel.app
- https://visafin-gest.org
- https://www.visafin-gest.org
```

---

## ✅ Checklist

- [ ] Backend déployé sur Render
- [ ] Frontend déployé sur Vercel
- [ ] `VITE_API_BASE_URL` pointe vers le backend Render
- [ ] Backend ALLOWED_HOSTS inclut `*.vercel.app`
- [ ] CORS_ALLOWED_ORIGINS inclut le frontend Vercel
- [ ] Google OAuth configuré
- [ ] Frontend charge correctement
- [ ] Requêtes API fonctionnent (F12 → Network)

---

## 🐛 Troubleshooting

### CORS Blocked
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution** : Vérifier CORS_ALLOWED_ORIGINS dans Render env vars

### API 404
```
GET https://...onrender.com/api 404
```
**Solution** : Vérifier `VITE_API_BASE_URL` dans Vercel env vars

### Frontend blank
```
White page
```
**Solution** : Vérifier les logs Vercel (Deployments → Logs)

---

## 📊 Coûts

- **Vercel** : Gratuit (React optimisé)
- **Render** : Gratuit (0.5 CPU, 512MB RAM, 500MB DB)

---

**C'est prêt ! Deploy et teste ! 🚀**
