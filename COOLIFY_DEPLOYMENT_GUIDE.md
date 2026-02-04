# 🚀 Guide de déploiement Coolify — CryptoInvest (Django + React)

Ce guide te donne les étapes exactes pour mettre l’app en ligne avec Coolify.

---

## ✅ Pré-requis

- Un projet Coolify connecté à ce repo GitHub.
- Un domaine (ou sous-domaines) pour le frontend et l’API.
- PostgreSQL provisionné par Coolify (recommandé en prod).

---

## 1) Déployer le backend (Django)

### ✅ Service Coolify (Backend)
- **Type**: Application (Dockerfile)
- **Chemin du Dockerfile**: `backend/Dockerfile`
- **Port exposé**: `8000`

### ✅ Variables d’environnement (Backend)
Définis ces variables dans Coolify → Environment:

```
DJANGO_SECRET_KEY=change-me
DEBUG=False
ALLOWED_HOSTS=api.mondomaine.com
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
CORS_ALLOWED_ORIGINS=https://app.mondomaine.com
CSRF_TRUSTED_ORIGINS=https://app.mondomaine.com
SITE_URL=https://app.mondomaine.com
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

> Tu peux mettre plusieurs valeurs séparées par des virgules :
> `ALLOWED_HOSTS=api.mondomaine.com,app.mondomaine.com`

### ✅ Commande de démarrage
Le Dockerfile lance automatiquement :
```
gunicorn invest_backend.wsgi:application --bind 0.0.0.0:8000
```

---

## 2) Déployer le frontend (React + Vite)

### ✅ Service Coolify (Frontend)
- **Type**: Application (Dockerfile)
- **Chemin du Dockerfile**: `frontend/Dockerfile`
- **Port exposé**: `80`

### ✅ Variables d’environnement (Frontend)
Définis dans Coolify → Environment:

```
VITE_API_BASE_URL=https://api.mondomaine.com/api
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## 3) Réseau / Domaines

### Exemple conseillé :
- **Frontend**: https://app.mondomaine.com
- **Backend API**: https://api.mondomaine.com

Dans Coolify, configure :
- Frontend → domaine `app.mondomaine.com`
- Backend → domaine `api.mondomaine.com`

---

## 4) Vérifications après déploiement

- ✅ `https://api.mondomaine.com/api/auth/login` répond
- ✅ `https://app.mondomaine.com` charge la SPA
- ✅ CORS OK (pas d’erreur console)
- ✅ /admin fonctionne

---

## 5) Problèmes fréquents

### ❌ CORS blocked
Ajouter le domaine frontend dans :
```
CORS_ALLOWED_ORIGINS=https://app.mondomaine.com
CSRF_TRUSTED_ORIGINS=https://app.mondomaine.com
```

### ❌ 400/403 CSRF
Même solution : `CSRF_TRUSTED_ORIGINS` doit contenir le domaine frontend.

### ❌ 500 Backend
Vérifier `DJANGO_SECRET_KEY`, `DATABASE_URL` et logs Coolify.

---

## ✅ Résumé rapide

- Backend → Dockerfile Django + env vars + DB
- Frontend → Dockerfile Vite + env API
- Domaines séparés + CORS + CSRF

---

Si tu veux, je peux aussi ajouter :
- un `docker-compose.yml` pour déploiement local
- un script de migration auto en prod
- un healthcheck Coolify
