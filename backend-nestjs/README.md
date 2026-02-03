# CryptoInvest Backend - NestJS

Backend moderne pour CryptoInvest migré de Django vers NestJS (TypeScript + Prisma + PostgreSQL/SQLite).

## 📋 Architecture

```
src/
├── auth/               # Authentification & JWT
│   ├── strategies/     # Passport JWT
│   ├── guards/         # Middleware JWT
│   ├── services/       # Auth & Token services
│   └── auth.module.ts
├── users/              # Gestion utilisateurs
├── wallets/            # Portefeuilles
├── transactions/       # Transactions
├── deposits/           # Dépôts
├── market/             # Offres de marché
├── investments/        # Investissements
├── referrals/          # Système de parrainage
├── vip/                # Niveaux VIP
├── withdrawals/        # Retraits
├── crypto/             # Adresses crypto
├── prisma/             # ORM Prisma
├── app.module.ts       # Module racine
└── main.ts             # Point d'entrée
```

## 🚀 Installation rapide

### Prérequis
- Node.js 18+ (LTS recommandé)
- npm ou yarn

### 1. Cloner et installer

```bash
cd backend-nestjs
npm install
```

### 2. Configuration

Créer `.env` basé sur `.env.example` :

```bash
cp .env.example .env
```

Éditer `.env` :

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### 3. Initialiser la base de données

```bash
npx prisma migrate dev --name init
npx prisma db seed  # (optionnel - voir seed script ci-bas)
```

### 4. Lancer en développement

```bash
npm run start:dev
```

L'application démarre sur `http://localhost:3000`

## 📦 Scripts disponibles

```bash
npm run start          # Démarrer en production
npm run start:dev      # Démarrer en développement (watch mode)
npm run start:debug    # Démarrer avec debugger
npm run start:prod     # Générer et lancer build production
npm run build          # Compiler TypeScript en JavaScript
npm run lint           # Vérifier et corriger la qualité du code
npm run test           # Exécuter les tests unitaires
npm run test:watch     # Tests en mode watch
npm run test:e2e       # Tests d'intégration
```

## 🔐 Authentification

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe",
    "phone": null,
    "vip_level": 0,
    "vip_since": null,
    "total_invested": 0
  }
}
```

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Utiliser le JWT

Ajouter le header `Authorization` à chaque requête authentifiée :

```bash
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔗 Endpoints API

### Auth
- `POST /api/auth/login` - Se connecter
- `POST /api/auth/register` - S'inscrire
- `POST /api/auth/refresh` - Renouveler le token
- `POST /api/auth/logout` - Se déconnecter
- `GET /api/auth/me` - Vérifier le token (protégé)

### Users
- `GET /api/me` - Obtenir profil utilisateur (protégé)
- `GET /api/user` - Obtenir détails utilisateur (protégé)
- `PUT /api/user` - Mettre à jour profil (protégé)

### Wallets
- `GET /api/wallets` - Lister les portefeuilles (protégé)
- `POST /api/wallets/:id/transfer_gains` - Transférer gains (protégé)

### Transactions
- `GET /api/transactions` - Lister les transactions (protégé)

### Deposits
- `POST /api/deposits/initiate` - Initier un dépôt (protégé)
- `GET /api/deposits/:id/status` - Vérifier le statut (protégé)

### Market
- `GET /api/market/offers` - Lister les offres (public)
- `GET /api/market/offers/:id` - Détails d'une offre (public)

### Investments
- `GET /api/investments` - Lister les investissements (protégé)
- `POST /api/investments` - Créer un investissement (protégé)
- `POST /api/investments/:id/accrue` - Appliquer les intérêts (protégé)
- `POST /api/investments/:id/encash` - Encaisser les intérêts (protégé)

### Referrals
- `GET /api/referrals/me` - Obtenir votre code de parrainage (protégé)

### VIP
- `GET /api/vip/levels` - Lister les niveaux VIP (public)
- `GET /api/vip/subscriptions/me` - Mes souscriptions VIP (protégé)
- `POST /api/vip/subscriptions/purchase` - Acheter un niveau VIP (protégé)

### Withdrawals
- `GET /api/withdrawals` - Lister les retraits (protégé)
- `POST /api/withdrawals` - Créer un retrait (protégé)

### Crypto
- `GET /api/crypto/addresses` - Lister les adresses crypto (protégé)
- `POST /api/crypto/addresses` - Ajouter une adresse (protégé)

## 📊 Exemple complet de workflow

### 1. S'inscrire
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "username": "alice",
    "password": "SecurePass123!",
    "firstName": "Alice",
    "lastName": "Smith"
  }'
```

### 2. Se connecter
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123!"
  }'
# Sauvegarder le access_token
```

### 3. Voir profil
```bash
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 4. Voir portefeuilles
```bash
curl -X GET http://localhost:3000/api/wallets \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 5. Créer un investissement
```bash
curl -X POST http://localhost:3000/api/investments \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "1000",
    "currency": "USDT",
    "daily_rate": "0.025"
  }'
```

### 6. Appliquer intérêts
```bash
curl -X POST http://localhost:3000/api/investments/1/accrue \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## 🌐 Déploiement sur Hostinger

### 1. Préparation locale

```bash
npm run build
npm run test
```

### 2. Créer un repository Git

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/cryptoinvest-backend.git
git push -u origin main
```

### 3. Configuration Hostinger

#### Via Hostinger Control Panel:
1. **Terminal SSH** → Accéder au serveur
2. Cloner le repo:
   ```bash
   git clone https://github.com/username/cryptoinvest-backend.git
   cd cryptoinvest-backend
   ```

3. Installer les dépendances:
   ```bash
   npm install --production
   ```

4. Configuration:
   ```bash
   cp .env.example .env
   # Éditer .env avec vos vraies valeurs
   nano .env
   ```

5. Initialiser la DB (si PostgreSQL):
   ```bash
   npx prisma migrate deploy
   ```

6. Build:
   ```bash
   npm run build
   ```

#### Avec PM2 pour persistance:
```bash
npm install -g pm2
pm2 start dist/main.js --name "cryptoinvest-api"
pm2 save
pm2 startup
```

#### Nginx (reverse proxy):
```nginx
server {
    listen 80;
    server_name api.cryptoinvest.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Variables d'environnement production

```env
DATABASE_URL="postgresql://user:password@host:5432/cryptoinvest_db"
JWT_SECRET="extremely-long-secure-random-string-here"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV="production"
FRONTEND_URL="https://cryptoinvest.com"
```

## 💾 Base de données

### Connexion locale (SQLite)
Par défaut, développement utilise SQLite (`dev.db`)

### Connexion PostgreSQL

Pour production, utiliser PostgreSQL:

1. Créer la base:
   ```bash
   createdb cryptoinvest_db
   ```

2. Mettre à jour `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/cryptoinvest_db"
   ```

3. Migrer:
   ```bash
   npx prisma migrate deploy
   ```

## 🧪 Tests

```bash
# Unitaires
npm run test

# Watch mode
npm run test:watch

# Couverture
npm run test:cov

# E2E
npm run test:e2e
```

## 📝 Prisma

### Générer migrations après changements au schema

```bash
npx prisma migrate dev --name describe_your_change
```

### Voir la base via Prisma Studio

```bash
npx prisma studio
```

### Réinitialiser la base (dev only)

```bash
npx prisma migrate reset
```

## 🔒 Sécurité

- ✅ JWT pour authentification
- ✅ Bcrypt pour hachage des mots de passe (salt: 10)
- ✅ CORS configuré pour le frontend
- ✅ Validation des entrées avec `class-validator`
- ✅ Protection des routes sensibles

## 📱 Intégration Frontend

Le frontend React doit pointer vers cette API :

```typescript
// Dans votre configuration frontend
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

// Login example
const response = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const { access_token } = await response.json();
localStorage.setItem('access_token', access_token);

// Utiliser dans les requêtes
fetch(`${API_URL}/api/me`, {
  headers: {
    'Authorization': `Bearer ${access_token}`,
  },
});
```

## 🐛 Troubleshooting

### Port 3000 déjà en utilisation
```bash
# Trouver le processus
lsof -i :3000

# Tuer le processus
kill -9 <PID>

# Ou utiliser un port différent
PORT=3001 npm run start:dev
```

### Migration Prisma échouée
```bash
# Reset complète
npx prisma migrate reset

# Ou créer nouvelle migration
npx prisma migrate dev
```

### CORS error du frontend
Vérifier `.env` `FRONTEND_URL` correspond au domaine frontend réel.

## 📚 Ressources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT Guide](https://jwt.io)
- [Passport.js](http://www.passportjs.org)

## 📄 Licence

MIT

---

**Migration de Django ✅** | **TypeScript ✅** | **Prêt production ✅**
