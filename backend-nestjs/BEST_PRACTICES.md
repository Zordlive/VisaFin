# CryptoInvest Backend - Best Practices & Troubleshooting

## 🎯 Best Practices

### 1. Environment Configuration

**DO:**
```env
# .env (Production)
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="long-random-string-min-32-chars-use-crypto"
NODE_ENV="production"
```

**DON'T:**
```env
# ❌ Never commit .env
# ❌ Never use weak secrets
JWT_SECRET="123456"
# ❌ Never hardcode database credentials
DATABASE_URL="..."  # in code
```

### 2. API Authentication

**DO:**
```typescript
@UseGuards(JwtAuthGuard)
async getProfile(@Request() req) {
  // Use req.user.id from JWT
  return this.userService.getUser(req.user.id);
}
```

**DON'T:**
```typescript
// ❌ Never trust client data for user ID
const userId = req.query.userId;  // Can be spoofed

// ❌ Never expose passwords
return { ...user, password: user.password };
```

### 3. Database Queries

**DO:**
```typescript
// Use Prisma transactions for multi-step operations
const result = await this.prisma.$transaction(async (tx) => {
  const wallet = await tx.wallet.update({...});
  const transaction = await tx.transaction.create({...});
  return { wallet, transaction };
});
```

**DON'T:**
```typescript
// ❌ Race conditions with separate queries
const wallet = await this.prisma.wallet.update({...});
const transaction = await this.prisma.transaction.create({...});

// ❌ N+1 queries
const users = await this.prisma.user.findMany();
for (const user of users) {
  const wallet = await this.prisma.wallet.findFirst({
    where: { userId: user.id }
  });
}
```

### 4. Error Handling

**DO:**
```typescript
try {
  const user = await this.prisma.user.findUniqueOrThrow({
    where: { id: userId }
  });
} catch (error) {
  if (error instanceof Prisma.NotFoundError) {
    throw new NotFoundException('User not found');
  }
  throw new BadRequestException('Invalid request');
}
```

**DON'T:**
```typescript
// ❌ Generic error handling
} catch (error) {
  throw new Error(error);  // Exposes internal details
}

// ❌ Silent failures
const user = await this.prisma.user.findFirst({...});
if (!user) return null;  // Better: throw NotFoundException
```

### 5. Validation

**DO:**
```typescript
import { IsDecimal, Min, IsPositive } from 'class-validator';

export class TransferDto {
  @IsDecimal()
  @IsPositive()
  amount: string;  // Use string for Decimal

  @IsEnum(['gains', 'sale'])
  source: string;
}
```

**DON'T:**
```typescript
// ❌ No validation
async transfer(req) {
  const amount = req.body.amount;  // Could be anything
}

// ❌ Manual validation
if (typeof amount !== 'number') {...}  // Repetitive
```

### 6. Decimal Handling

**DO:**
```typescript
import { Decimal } from '@prisma/client/runtime/library';

const amount = new Decimal('100.50');
const result = amount.plus(new Decimal('50.25'));
// Result: 150.75 (exact)
```

**DON'T:**
```typescript
// ❌ JavaScript floating point errors
0.1 + 0.2  // 0.30000000000000004

// ❌ Mixing types
const amount = 100.50;  // Number (imprecise)
const total = amount + 50.25;  // Wrong result
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "Port 3000 already in use"

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:**
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run start:dev
```

### Issue 2: "Database connection timeout"

**Symptom:**
```
PrismaClientInitializationError: Can't reach database server
```

**Causes & Fixes:**
```bash
# 1. Database not running
docker-compose up -d  # If using Docker

# 2. Wrong DATABASE_URL
# Check .env for typos or wrong credentials

# 3. Network issues
# Test connection:
psql "postgresql://user:pass@localhost:5432/db"

# 4. Firewall blocking
# Allow port 5432 (PostgreSQL) in firewall
```

### Issue 3: "JWT token invalid"

**Symptom:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Fixes:**
```bash
# 1. Check JWT_SECRET in .env
# Must match between token generation and verification

# 2. Token expired
# Use refresh endpoint to get new token

# 3. Wrong format in header
# Should be: Authorization: Bearer TOKEN
# Not: Authorization: Token TOKEN

# 4. CORS blocking token in header
# Check CORS configuration in app.module.ts
```

### Issue 4: "Decimal amount is NaN or incorrect"

**Symptom:**
```
amount is NaN or doesn't match expected precision
```

**Fix:**
```typescript
// ❌ Wrong
const amount = parseFloat('100.50');

// ✅ Correct - return as Decimal
const wallet = await this.prisma.wallet.findUnique(...);
return {
  amount: parseFloat(wallet.amount.toString())  // Convert Decimal → float for JSON
};
```

### Issue 5: "CORS errors from frontend"

**Symptom:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Causes & Fixes:**
```typescript
// In main.ts or app.module
app.enableCors({
  origin: 'http://localhost:5173',  // Match your frontend URL
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
});

// For production
origin: 'https://yourdomain.com',  // Use HTTPS URL

// NOT
origin: '*'  // Security risk
```

### Issue 6: "Migration failed"

**Symptom:**
```
Error: Migration failed to apply
```

**Fixes:**
```bash
# 1. Check migration status
npx prisma migrate status

# 2. Reset database (development only!)
npx prisma migrate reset

# 3. Resolve conflicts manually
npx prisma migrate resolve --rolled-back migration_name

# 4. Create new migration for fix
npx prisma migrate dev --name fix_issue
```

### Issue 7: "Passwords not hashing"

**Symptom:**
```
User can login with plaintext password
```

**Fix:**
```typescript
// Ensure bcrypt is used in AuthService
async register(dto: RegisterDto) {
  // ✅ Correct
  const hashedPassword = await this.tokenService.hashPassword(dto.password);

  // ❌ Wrong - password not hashed
  const user = await this.prisma.user.create({
    data: { password: dto.password }
  });
}
```

---

## ⚡ Performance Optimization

### 1. Database Indexing

```prisma
model User {
  id Int @id
  email String @unique  // Creates index automatically
  
  @@index([createdAt])  // Manual index for filtering
}
```

### 2. Query Optimization

```typescript
// ❌ Bad - loads entire user object
const user = await this.prisma.user.findUnique({
  where: { id: userId },
  include: { wallets: true, investments: true, deposits: true }
});

// ✅ Good - select only needed fields
const user = await this.prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    wallets: {
      select: { id: true, balance: true }
    }
  }
});
```

### 3. Caching Strategy

```typescript
import { Injectable } from '@nestjs/common';
import { Cacheable } from '@nestjs/cache-manager';

@Injectable()
export class VipService {
  @Cacheable()  // Cache for 5 minutes by default
  async getAllVipLevels() {
    return this.prisma.vipLevel.findMany();
  }
}
```

### 4. Batch Operations

```typescript
// ❌ Slow - N queries
for (const userId of userIds) {
  await this.prisma.user.update({
    where: { id: userId },
    data: { vipLevel: 1 }
  });
}

// ✅ Fast - 1 query
await this.prisma.user.updateMany({
  where: { id: { in: userIds } },
  data: { vipLevel: 1 }
});
```

---

## 🔒 Security Checklist

- [ ] JWT_SECRET is long (32+ chars) and random
- [ ] DATABASE_URL uses encrypted connections
- [ ] CORS origin is specific (not `*`)
- [ ] Passwords are hashed with bcrypt
- [ ] Rate limiting implemented (optional but recommended)
- [ ] Input validation on all endpoints
- [ ] No sensitive data in error messages
- [ ] HTTPS enabled in production
- [ ] Database credentials not in code
- [ ] JWT expiration set appropriately

---

## 📋 Debugging Tips

### 1. Enable Prisma Logging

```typescript
const prisma = new PrismaClient({
  log: [
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'event', level: 'query' }
  ]
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});
```

### 2. Use Prisma Studio

```bash
npx prisma studio
# Opens visual database explorer at localhost:5555
```

### 3. Check Database State

```bash
# Connect directly to database
psql "postgresql://user:pass@localhost:5432/db"

# List tables
\dt

# View schema
\d table_name

# Execute query
SELECT * FROM "auth_user" LIMIT 5;
```

### 4. Monitor Application

```bash
# With PM2
pm2 monit

# View logs
pm2 logs cryptoinvest-api

# Watch logs live
pm2 logs cryptoinvest-api --lines 100 --follow
```

---

## 📚 Resources

- [NestJS Security](https://docs.nestjs.com/security/overview)
- [Prisma Best Practices](https://www.prisma.io/docs/orm/guides/deployment/deployment-guides/coping-with-migrations)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [OWASP Security Guidelines](https://owasp.org/www-project-cheat-sheets/)

---

## ✅ Pre-Production Checklist

- [ ] All environment variables configured
- [ ] Database backed up
- [ ] HTTPS/SSL configured
- [ ] Logging enabled
- [ ] Monitoring setup
- [ ] Rate limiting implemented
- [ ] Error handling tested
- [ ] Performance tested
- [ ] Security audit completed
- [ ] Documentation updated

---

**Happy developing!** 🚀
