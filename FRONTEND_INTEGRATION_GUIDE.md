# 🔗 Frontend Integration Guide

## Connecting Your React Frontend to NestJS Backend

---

## 🎯 Overview

Your React frontend is **100% compatible** with this NestJS backend. No changes to your React code are needed - just update the API URL!

---

## 1️⃣ Update API Base URL

### Find Your API Service File

Locate where your frontend makes API calls. Usually:
```
frontend/src/services/api.ts
frontend/src/config/api.ts
frontend/src/utils/api.ts
```

### Update the Base URL

**Development:**
```typescript
export const API_URL = 'http://localhost:3000'
```

**Production (Hostinger):**
```typescript
export const API_URL = 'https://api.yourdomain.com'
```

### Example API Service

```typescript
// src/services/api.ts

export const API_URL = process.env.VITE_API_URL || 'http://localhost:3000'

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  if (!response.ok) throw new Error('Login failed')
  return response.json()
}

export async function getMe(token: string) {
  const response = await fetch(`${API_URL}/api/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  return response.json()
}
```

---

## 2️⃣ Setup Authentication

### Store Token After Login

```typescript
// Login handler
const { access_token, refresh_token, user } = await login(email, password)

// Save tokens
localStorage.setItem('access_token', access_token)
localStorage.setItem('refresh_token', refresh_token)

// Save user (optional)
localStorage.setItem('user', JSON.stringify(user))
```

### Use Token in Headers

```typescript
// Helper function
function getAuthHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Usage
const token = localStorage.getItem('access_token')
const response = await fetch(`${API_URL}/api/me`, {
  headers: getAuthHeaders(token)
})
```

---

## 3️⃣ Handle Token Refresh

### Automatic Token Refresh

```typescript
// Intercept 401 responses
async function apiCall(endpoint: string, options = {}) {
  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: getAuthHeaders(getToken())
  })

  // Token expired?
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token')
    
    // Try to refresh
    const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })

    if (refreshResponse.ok) {
      const { access_token } = await refreshResponse.json()
      localStorage.setItem('access_token', access_token)

      // Retry original request
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: getAuthHeaders(access_token)
      })
    } else {
      // Refresh failed - redirect to login
      window.location.href = '/login'
    }
  }

  return response
}
```

---

## 4️⃣ Common API Calls

### Register User

```typescript
const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    username: 'john_doe',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe'
  })
})

const { access_token, user } = await registerResponse.json()
```

### Get User Profile

```typescript
const userResponse = await fetch(`${API_URL}/api/user`, {
  headers: { 'Authorization': `Bearer ${token}` }
})

const user = await userResponse.json()
```

### List Wallets

```typescript
const walletsResponse = await fetch(`${API_URL}/api/wallets`, {
  headers: { 'Authorization': `Bearer ${token}` }
})

const wallets = await walletsResponse.json()
```

### Create Investment

```typescript
const investResponse = await fetch(`${API_URL}/api/investments`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: '1000.00',
    currency: 'USDT',
    daily_rate: '0.025'
  })
})

const investment = await investResponse.json()
```

---

## 5️⃣ Environment Variables

### Create `.env` in Frontend Root

```env
VITE_API_URL=http://localhost:3000
```

### Use in Code

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
```

### For Different Environments

**`.env.development`**
```env
VITE_API_URL=http://localhost:3000
```

**`.env.production`**
```env
VITE_API_URL=https://api.cryptoinvest.com
```

---

## 6️⃣ Testing the Integration

### 1. Start Backend
```bash
cd backend-nestjs
npm run start:dev
# Should log: Application is running on: http://localhost:3000
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
# Should log: VITE v5.x ready in x ms
```

### 3. Test Login
1. Go to your login page
2. Enter credentials
3. Check browser console for API calls
4. Should receive token and redirect

### 4. Verify API Calls
1. Open browser DevTools (F12)
2. Go to Network tab
3. Make an API call (login, get profile, etc.)
4. Check response status (should be 200)

---

## 🔍 Debugging Tips

### Check API Response

```typescript
try {
  const response = await fetch(`${API_URL}/api/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  console.log('Status:', response.status)
  const data = await response.json()
  console.log('Data:', data)
} catch (error) {
  console.error('API Error:', error)
}
```

### Verify Token Format

```typescript
// Token should look like:
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

const token = localStorage.getItem('access_token')
console.log('Token:', token)
console.log('Token type:', typeof token)
console.log('Token length:', token?.length)
```

### Check CORS Headers

```typescript
// Browser console Network tab should show:
// Access-Control-Allow-Origin: http://localhost:5173
// Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE
```

---

## ✅ Integration Checklist

- [ ] Backend running on `http://localhost:3000`
- [ ] API_URL updated in frontend
- [ ] Can register new user
- [ ] Can login and get token
- [ ] Token saved in localStorage
- [ ] Can access protected endpoints
- [ ] Logout clears token
- [ ] Token refresh works
- [ ] CORS not blocking requests
- [ ] All API calls working

---

## 🚀 Endpoints Reference

All endpoints require `Authorization: Bearer TOKEN` header (except auth endpoints).

### Auth (no token needed)
```
POST /api/auth/register      { email, username, password, firstName, lastName }
POST /api/auth/login         { email, password }
POST /api/auth/refresh       { refresh_token }
POST /api/auth/logout
```

### Users (token needed)
```
GET  /api/me
GET  /api/user
PUT  /api/user               { firstName, lastName, phone }
```

### Wallets
```
GET  /api/wallets
POST /api/wallets/:id/transfer_gains  { amount, source: 'gains'|'sale' }
```

### Investments
```
GET  /api/investments
POST /api/investments        { amount, currency, daily_rate }
POST /api/investments/:id/accrue
POST /api/investments/:id/encash
```

### Market
```
GET  /api/market/offers
GET  /api/market/offers/:id
```

### VIP
```
GET  /api/vip/levels
GET  /api/vip/subscriptions/me
POST /api/vip/subscriptions/purchase  { vip_level_id }
```

See [API_EXAMPLES.md](./backend-nestjs/API_EXAMPLES.md) for complete reference.

---

## 🐛 Common Issues

### Issue: CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```

**Cause**: Frontend URL not in allowed origins

**Fix**: Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
```env
FRONTEND_URL="http://localhost:5173"
```

### Issue: 401 Unauthorized
```json
{ "statusCode": 401, "message": "Unauthorized" }
```

**Cause**: Missing or invalid token

**Fix**: 
- Check token is in localStorage
- Verify `Authorization: Bearer TOKEN` header format
- Token might be expired (use refresh endpoint)

### Issue: 404 Not Found
```json
{ "statusCode": 404, "message": "Not found" }
```

**Cause**: Wrong endpoint path

**Fix**: Check endpoint matches exactly (case-sensitive)

### Issue: 400 Bad Request
```json
{ "statusCode": 400, "message": "... validation error ..." }
```

**Cause**: Invalid input data

**Fix**: Check request payload matches API schema

---

## 💡 Pro Tips

1. **Use Postman** - Import `postman_collection.json` to test all endpoints
2. **Check Console** - Browser DevTools Network tab shows all API calls
3. **Save Token** - Keep token in localStorage for persistence
4. **Refresh Tokens** - Implement automatic refresh before token expires
5. **Error Handling** - Always handle 4xx and 5xx responses

---

## 📱 Example React Component

```typescript
// src/components/LoginForm.tsx

import { useState } from 'react'
import { API_URL } from '../services/api'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) throw new Error('Login failed')

      const { access_token, user } = await response.json()
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('user', JSON.stringify(user))

      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

---

## ✨ You're Connected!

Your React frontend is now connected to the NestJS backend. All API calls will use the correct endpoints and authentication.

**Next**: Test your application thoroughly before deploying!

---

For more details, see:
- [API_EXAMPLES.md](./backend-nestjs/API_EXAMPLES.md) - Complete API reference
- [README.md](./backend-nestjs/README.md) - Backend documentation
- [BEST_PRACTICES.md](./backend-nestjs/BEST_PRACTICES.md) - Best practices
