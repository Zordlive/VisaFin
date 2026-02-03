# 🚀 Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies (2 min)
```bash
cd backend-nestjs
npm install
```

### 2. Setup Environment (1 min)
```bash
cp .env.example .env
# Edit .env if needed (defaults work for local dev)
```

### 3. Initialize Database (1 min)
```bash
npx prisma migrate dev --name init
```

### 4. Start Server (1 min)
```bash
npm run start:dev
```

✅ **Done!** Server running at `http://localhost:3000`

---

## 🧪 Test It

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### Get Profile
```bash
# Replace TOKEN with access_token from login response
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer TOKEN"
```

---

## 📚 Full Documentation

| Topic | File |
|-------|------|
| API Reference | [README.md](README.md) |
| Local Setup | [LOCAL_SETUP.md](LOCAL_SETUP.md) |
| Deployment | [DEPLOYMENT.md](DEPLOYMENT.md) |
| API Examples | [API_EXAMPLES.md](API_EXAMPLES.md) |
| Best Practices | [BEST_PRACTICES.md](BEST_PRACTICES.md) |
| All Files | [FILE_INVENTORY.md](FILE_INVENTORY.md) |

---

## 🐳 Using Docker

```bash
docker-compose up -d
# API: http://localhost:3000
# Database: postgres://localhost:5432
```

---

## 🛠️ Development Commands

```bash
npm run start:dev      # Start development server
npm run build          # Compile TypeScript
npm run lint           # Check code quality
npm run test           # Run tests
npx prisma studio     # View/edit database visually
```

---

## 🚨 Troubleshooting

### Port already in use?
```bash
kill -9 $(lsof -t -i:3000)
```

### Database error?
```bash
npx prisma migrate reset
```

### Need to rebuild?
```bash
npm install
npx prisma generate
npm run build
npm run start:dev
```

---

## 📱 Frontend Integration

Update your React frontend config:

```typescript
const API_URL = 'http://localhost:3000'

// Login
const response = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})

const { access_token } = await response.json()
localStorage.setItem('token', access_token)

// Use in requests
fetch(`${API_URL}/api/me`, {
  headers: { 'Authorization': `Bearer ${access_token}` }
})
```

---

## 📖 API Endpoints Cheat Sheet

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get token
- `GET /api/me` - Check auth (requires token)

### Users
- `GET /api/user` - Get profile
- `PUT /api/user` - Update profile

### Wallets
- `GET /api/wallets` - List wallets
- `POST /api/wallets/:id/transfer_gains` - Move funds

### Investments
- `GET /api/investments` - List investments
- `POST /api/investments` - Create investment
- `POST /api/investments/:id/accrue` - Claim daily interest
- `POST /api/investments/:id/encash` - Withdraw interest

### Market
- `GET /api/market/offers` - List offers

### VIP
- `GET /api/vip/levels` - VIP tiers
- `POST /api/vip/subscriptions/purchase` - Buy VIP

---

## 💡 Common Tasks

### Check if server is running
```bash
curl http://localhost:3000/api/market/offers
```

### View database
```bash
npx prisma studio
# Opens at localhost:5555
```

### Run tests
```bash
npm run test
npm run test:watch
```

### Deploy to production
See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📞 Need Help?

1. **Setup issues** → [LOCAL_SETUP.md](LOCAL_SETUP.md)
2. **API questions** → [API_EXAMPLES.md](API_EXAMPLES.md)
3. **Deployment** → [DEPLOYMENT.md](DEPLOYMENT.md)
4. **Troubleshooting** → [BEST_PRACTICES.md](BEST_PRACTICES.md)

---

## ✅ Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created
- [ ] Database initialized (`npx prisma migrate dev`)
- [ ] Server running (`npm run start:dev`)
- [ ] Can register user (POST /api/auth/register)
- [ ] Can login (POST /api/auth/login)
- [ ] Can get profile (GET /api/me with token)
- [ ] Frontend can connect (update API_URL)

---

**Ready to code?** Start with `npm run start:dev` 🎉

For complete guide, see [README.md](README.md)
