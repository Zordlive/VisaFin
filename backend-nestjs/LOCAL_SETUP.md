# Local Setup Guide

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher  
- **Git**: Latest version

## Step-by-step Setup

### 1. Clone the Repository

```bash
cd c:\Users\Liam\CryptoInvest\backend-nestjs
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### 4. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Create database and tables
npx prisma migrate dev --name init
```

### 5. Start the Application

**Development mode (with auto-reload):**
```bash
npm run start:dev
```

**Production build:**
```bash
npm run build
npm run start:prod
```

The application will be available at: **http://localhost:3000**

## Verify Setup

### Test Login Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123!"
  }'
```

Expected response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

## Common Issues

### Port 3000 Already in Use

```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Database Connection Error

```bash
# Reset database
npx prisma migrate reset

# Or recreate from scratch
rm dev.db
npx prisma migrate dev --name init
```

### Missing Dependencies

```bash
# Clean install
rm -r node_modules package-lock.json
npm install
npx prisma generate
```

## Next Steps

1. **Frontend Integration**: Update frontend API URL to `http://localhost:3000`
2. **Test Endpoints**: Use the API endpoints documented in README.md
3. **Customize Models**: Modify `prisma/schema.prisma` as needed
4. **Deploy**: Follow deployment guide for production

## Development Tools

### Run Tests
```bash
npm run test
npm run test:watch
```

### Lint Code
```bash
npm run lint
```

### View Database
```bash
npx prisma studio
```

### Format Code
```bash
npm run format
```

## Need Help?

- Check logs: Application logs appear in terminal
- Prisma logs: Set `"log": ["query", "error", "warn"]` in `PrismaService`
- Database: Use `npx prisma studio` for visual DB explorer

---

Ready to develop! 🚀
