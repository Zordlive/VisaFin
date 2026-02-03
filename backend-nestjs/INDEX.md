# CryptoInvest NestJS Backend - Documentation Index

## 📖 Documentation Structure

### 🚀 Getting Started
1. **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - Overview of the complete migration from Django to NestJS
2. **[LOCAL_SETUP.md](LOCAL_SETUP.md)** - Step-by-step guide to run the project locally
3. **[README.md](README.md)** - Complete API documentation

### 🔧 Development & Deployment
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide for Hostinger
- **[API_EXAMPLES.md](API_EXAMPLES.md)** - Curl examples for all endpoints
- **[setup.sh](setup.sh)** - Automated setup script (Linux/macOS)

### 📁 Project Files
- **[package.json](package.json)** - Dependencies and scripts
- **[.env.example](.env.example)** - Environment configuration template
- **[Dockerfile](Dockerfile)** - Docker container definition
- **[docker-compose.yml](docker-compose.yml)** - Docker compose for local development
- **[prisma/schema.prisma](prisma/schema.prisma)** - Database schema definition

---

## 🎯 Quick Navigation

### I want to...

**...start development locally**
→ [LOCAL_SETUP.md](LOCAL_SETUP.md)

**...understand the API**
→ [README.md](README.md#-endpoints-api) or [API_EXAMPLES.md](API_EXAMPLES.md)

**...deploy to production**
→ [DEPLOYMENT.md](DEPLOYMENT.md)

**...understand the migration**
→ [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)

**...test endpoints**
→ [API_EXAMPLES.md](API_EXAMPLES.md)

**...use Docker**
→ [docker-compose.yml](docker-compose.yml) + `docker-compose up`

**...understand the database**
→ [prisma/schema.prisma](prisma/schema.prisma)

---

## ✨ Key Features

- ✅ JWT Authentication with Passport
- ✅ User Management
- ✅ Wallet Operations
- ✅ Investment Accrual System
- ✅ Referral Management
- ✅ VIP Subscription System
- ✅ Crypto Address Management
- ✅ Transaction History
- ✅ Deposit/Withdrawal Handling
- ✅ Market Offers
- ✅ Full TypeScript Support
- ✅ Prisma ORM
- ✅ Docker Ready
- ✅ Production Ready

---

## 📋 Endpoints Summary

| Category | Endpoints | Count |
|----------|-----------|-------|
| Auth | login, register, refresh, logout, me | 5 |
| Users | get profile, update profile | 2 |
| Wallets | list, transfer gains | 2 |
| Transactions | list | 1 |
| Deposits | initiate, status | 2 |
| Market | list offers, get offer | 2 |
| Investments | list, create, accrue, encash | 4 |
| Referrals | get code & referrals | 1 |
| VIP | list levels, my subscriptions, purchase | 3 |
| Withdrawals | list, create | 2 |
| Crypto | list addresses, add address | 2 |
| **TOTAL** | | **28 endpoints** |

---

## 🏗️ Architecture

```
frontend (React)
     ↓ HTTP/REST
backend-nestjs
     ├── auth module
     ├── users module
     ├── wallets module
     ├── investments module
     ├── referrals module
     ├── vip module
     ├── withdrawals module
     ├── crypto module
     └── ...
     ↓
PostgreSQL/SQLite
```

---

## 🔐 Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

Token obtained from:
```
POST /api/auth/login
POST /api/auth/register
```

---

## 🚀 Deployment Options

1. **Hostinger** (Recommended)
   - See [DEPLOYMENT.md](DEPLOYMENT.md)
   - Nginx reverse proxy setup
   - SSL with Let's Encrypt

2. **Docker**
   - See [docker-compose.yml](docker-compose.yml)
   - `docker-compose up -d`

3. **Local/Development**
   - See [LOCAL_SETUP.md](LOCAL_SETUP.md)
   - `npm run start:dev`

---

## 📊 Database Schema

**18 models** with full relationships:

```
User
  ├── Investor (1:1)
  ├── Wallet (1:N)
  ├── Transaction (1:N through Wallet)
  ├── Deposit (1:N)
  ├── Investment (1:N)
  ├── ReferralCode (1:1)
  ├── Referral (1:N)
  ├── UserVIPSubscription (1:N)
  ├── Withdrawal (1:N)
  ├── CryptoAddress (1:N)
  └── ...
```

See [prisma/schema.prisma](prisma/schema.prisma) for complete schema.

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

See [README.md](README.md#-tests) for more.

---

## 📱 Frontend Integration

Update your React frontend to use:

```typescript
const API_URL = 'http://localhost:3000' // Development
// or
const API_URL = 'https://api.yourdomain.com' // Production
```

Then use JWT tokens from `/api/auth/login` for all authenticated requests.

See [README.md](README.md#-intégration-frontend) for examples.

---

## 🆘 Need Help?

1. **Setup issues?** → [LOCAL_SETUP.md](LOCAL_SETUP.md#troubleshooting)
2. **API questions?** → [API_EXAMPLES.md](API_EXAMPLES.md)
3. **Deployment?** → [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting)
4. **General info?** → [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)

---

## 📞 Contact & Support

For issues:
1. Check documentation
2. Review API examples
3. Check Prisma Studio: `npx prisma studio`
4. Check logs in terminal

---

**Backend Status**: ✅ **READY FOR PRODUCTION**

---

### Version Info
- NestJS: 10.3.0
- Node.js: 18+
- TypeScript: 5.3
- Prisma: 5.7
- Last Updated: February 3, 2026
