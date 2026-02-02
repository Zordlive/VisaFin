# 🚀 Checklist Déploiement Coolify - CryptoInvest

## ✅ Configuration Backend (Django)

### 1. Variables d'environnement Backend

Dans Coolify → Service Backend → Environment Variables :

```bash
DEBUG=False
DJANGO_SECRET_KEY=<générer-clé-secrète-forte>
DATABASE_URL=postgresql://user:password@host:5432/cryptoinvest
ALLOWED_HOSTS=api.visafin-gest.org,visafin-gest.org,www.visafin-gest.org
SITE_URL=https://visafin-gest.org
GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
```

### 2. Domaine Backend

- **Domaine**: `api.visafin-gest.org`
- **SSL/HTTPS**: ✅ Activé (Let's Encrypt automatique)
- **Port**: 8000 (interne Docker)

### 3. Vérification Backend

```bash
# Test API
curl https://api.visafin-gest.org/
# Doit retourner: {"message": "VISAFINANCE API", ...}

curl https://api.visafin-gest.org/api/me
# Doit retourner: {"detail": "Authentication credentials were not provided."}
```

---

## ✅ Configuration Frontend (React + Vite)

### 1. Build Variables Frontend

⚠️ **IMPORTANT**: Ce sont des **Build Variables**, pas Runtime Variables !

Dans Coolify → Service Frontend → **Build Variables** :

```bash
VITE_API_BASE_URL=https://api.visafin-gest.org/api
VITE_GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
```

### 2. Domaine Frontend

- **Domaine**: `visafin-gest.org` (+ optionnel: `www.visafin-gest.org`)
- **SSL/HTTPS**: ✅ Activé (Let's Encrypt automatique)
- **Port**: 80 (Nginx)

### 3. Vérification Frontend

1. Ouvre `https://visafin-gest.org` dans le navigateur
2. Ouvre la console développeur (F12)
3. Vérifie que tu vois : `🔗 API Base URL: https://api.visafin-gest.org/api`
4. Pas d'erreurs CORS ✅

---

## ✅ Configuration DNS

Chez ton registraire de domaine (ex: OVH, Cloudflare, etc.) :

```
Type    Nom     Cible (IP Coolify)
A       @       <IP-SERVEUR-COOLIFY>
A       api     <IP-SERVEUR-COOLIFY>
CNAME   www     visafin-gest.org
```

⏱️ Propagation DNS : 5-30 minutes

---

## ✅ Vérifications CORS

### Backend `settings.py` doit avoir :

```python
INSTALLED_APPS = [
    ...
    'corsheaders',  # ✅ Déjà présent
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # ✅ En premier
    ...
]

CORS_ALLOWED_ORIGINS = [
    'https://visafin-gest.org',
    'https://www.visafin-gest.org',
]

CORS_ALLOW_CREDENTIALS = True
```

### Requirements.txt :

```
django-cors-headers==4.3.1  # ✅ Déjà présent
```

---

## 🔒 SSL/HTTPS - Étapes Coolify

1. **Backend** :
   - Va dans le service Backend
   - Section "Domains"
   - Entre `api.visafin-gest.org`
   - Coolify génère automatiquement le certificat SSL ✅

2. **Frontend** :
   - Va dans le service Frontend
   - Section "Domains"
   - Entre `visafin-gest.org`
   - Coolify génère automatiquement le certificat SSL ✅

3. **Vérification** :
   - Ouvre `https://api.visafin-gest.org` → Cadenas vert 🔒
   - Ouvre `https://visafin-gest.org` → Cadenas vert 🔒

---

## 🐛 Problèmes fréquents

### ❌ CORS error dans la console

**Cause** : Backend CORS mal configuré ou frontend en HTTP

**Solution** :
1. Vérifie que `VITE_API_BASE_URL=https://...` (pas http://)
2. Rebuild le frontend (Build Variables doivent être recompilées)
3. Vérifie `CORS_ALLOWED_ORIGINS` dans settings.py

### ❌ "Origin not allowed" (Google OAuth)

**Cause** : Frontend en HTTP au lieu de HTTPS

**Solution** :
1. Active SSL dans Coolify pour le frontend
2. Assure-toi que `https://visafin-gest.org` fonctionne
3. Vérifie la console : doit afficher `🔗 API Base URL: https://...`

### ❌ Backend retourne 400 Bad Request

**Cause** : Domaine pas dans `ALLOWED_HOSTS`

**Solution** :
1. Vérifie dans Coolify → Backend → Environment Variables
2. `ALLOWED_HOSTS=api.visafin-gest.org,visafin-gest.org,www.visafin-gest.org`
3. Redémarre le backend

### ❌ API Base URL affiche HTTP au lieu de HTTPS

**Cause** : Build Variables pas configurées ou rebuild pas fait

**Solution** :
1. Va dans Coolify → Frontend → **Build Variables** (pas Environment)
2. Ajoute `VITE_API_BASE_URL=https://api.visafin-gest.org/api`
3. **Rebuild** le frontend (pas juste restart)

---

## 📋 Checklist finale avant production

- [ ] `django-cors-headers` dans requirements.txt ✅
- [ ] CORS configuré dans settings.py ✅
- [ ] Backend domaine : `api.visafin-gest.org` avec SSL ✅
- [ ] Frontend domaine : `visafin-gest.org` avec SSL ✅
- [ ] DNS A records configurés et propagés ✅
- [ ] Build Variables frontend avec HTTPS ✅
- [ ] Environment Variables backend configurées ✅
- [ ] Test : `https://api.visafin-gest.org/` retourne JSON ✅
- [ ] Test : `https://visafin-gest.org` charge l'app ✅
- [ ] Console frontend : `🔗 API Base URL: https://api...` ✅
- [ ] Pas d'erreurs CORS dans la console ✅
- [ ] Google OAuth fonctionne ✅
- [ ] Login email/mot de passe fonctionne ✅

---

## 🎯 Résumé des URLs en Production

| Service  | URL                                    | SSL |
|----------|----------------------------------------|-----|
| Frontend | https://visafin-gest.org               | ✅   |
| Frontend | https://www.visafin-gest.org (CNAME)   | ✅   |
| Backend  | https://api.visafin-gest.org           | ✅   |
| API      | https://api.visafin-gest.org/api       | ✅   |

---

✅ **Déploiement Coolify prêt !**
