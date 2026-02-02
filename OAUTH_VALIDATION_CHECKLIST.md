# Google OAuth Production Validation Checklist

## Pre-Deployment Validation

### 1. Code Configuration ✓
- [x] GoogleLoginView implemented in backend/api/views.py
- [x] Google token verification using google.oauth2.id_token.verify_oauth2_token()
- [x] Frontend auth.ts has loginWithGoogle() method
- [x] Google Sign-In script included in frontend/index.html
- [x] API endpoint /api/auth/google-login properly routed

### 2. Environment Files ✓
- [x] frontend/.env.production contains VITE_GOOGLE_CLIENT_ID
- [x] frontend/.env.production contains VITE_API_BASE_URL (updated to https://visafin-gest.org/api)
- [x] docker-compose.yml has GOOGLE_CLIENT_ID environment variable
- [x] docker-compose.yml has SITE_URL environment variable

### 3. Backend Settings ✓
- [x] ALLOWED_HOSTS includes visafin-gest.org
- [x] CORS_ALLOWED_ORIGINS includes https://visafin-gest.org
- [x] GOOGLE_CLIENT_ID configured in settings.py
- [x] Database configured for production (PostgreSQL)
- [x] DEBUG=False for production

### 4. Dependencies ✓
- [x] Backend has google-auth library in requirements.txt
- [x] google-auth-httplib2 or google-auth-oauthlib available for token verification
- [x] Frontend has @react-oauth/google or vanilla Google GSI client

---

## Google Cloud Console Configuration

### Step 1: OAuth Client Settings
- [ ] Login to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Go to APIs & Services → Credentials
- [ ] Click on OAuth 2.0 Client ID: `562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com`

### Step 2: Authorized JavaScript Origins
Add these origins to allow the domain to request tokens:
```
https://visafin-gest.org
https://www.visafin-gest.org
http://localhost:3000
http://localhost:5173
http://127.0.0.1:3000
http://127.0.0.1:5173
```

### Step 3: Authorized Redirect URIs
Add these URIs for OAuth callback:
```
https://visafin-gest.org/api/auth/google-login
https://www.visafin-gest.org/api/auth/google-login
http://localhost:8000/api/auth/google-login
http://localhost:3000/auth/google-login
```

### Step 4: OAuth Consent Screen
- [ ] Go to OAuth Consent Screen
- [ ] Verify User Type = "External"
- [ ] Verify Status = "In production" or "Testing"
- [ ] Check required scopes include:
  - [ ] openid
  - [ ] email
  - [ ] profile

---

## Coolify Environment Setup

### Before Deployment
Generate a strong Django secret key:
```bash
# Option 1: Using Django (if you have it locally)
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Option 2: Using Python secrets
python -c "import secrets; import string; print(''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(50)))"

# Option 3: Using provided scripts
bash generate_secret_key.sh          # Linux/Mac
.\generate_secret_key.ps1             # Windows PowerShell
```

Copy the generated key for next step.

### In Coolify Dashboard
1. Create new project or select existing
2. Add docker-compose service type
3. Upload/point to docker-compose.yml from repository
4. Set these environment variables:

**Backend Service:**
```
DEBUG=False
PYTHONUNBUFFERED=1
DATABASE_URL=postgresql://investuser:investpass123@db:5432/cryptoinvest
DJANGO_SECRET_KEY=<PASTE_GENERATED_KEY_HERE>
ALLOWED_HOSTS=localhost,127.0.0.1,*.sslip.io,visafin-gest.org,www.visafin-gest.org
GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
SITE_URL=https://visafin-gest.org
```

**Frontend Service:**
```
VITE_API_BASE_URL=https://visafin-gest.org/api
VITE_GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
```

---

## Local Testing Before Deployment

### Setup Local Environment
```bash
# Backend
cd backend
export GOOGLE_CLIENT_ID="562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com"
export DJANGO_SECRET_KEY="test-key-not-for-production"
python manage.py migrate
python manage.py runserver

# Frontend (in another terminal)
cd frontend
npm run dev
```

### Test OAuth Flow
1. Open `http://localhost:5173` in browser
2. Click "Sign in with Google"
3. Select Google account
4. Approve requested permissions
5. Should redirect to dashboard with user info
6. Check browser Network tab → verify POST to `/api/auth/google-login`
7. Check response contains `access_token` and `refresh_token`

### Verify Token Validation
```bash
# Get a valid Google ID token from your browser console after signing in:
# Google will set window.__googleToken__ or similar

curl -X POST http://localhost:8000/api/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{"token": "<PASTE_TOKEN_FROM_BROWSER>"}'

# Should return 200 with user data and JWT tokens
```

---

## Post-Deployment Validation

### 1. Check DNS and HTTPS
- [ ] Domain `visafin-gest.org` resolves to Coolify IP
- [ ] HTTPS certificate is valid
- [ ] https://visafin-gest.org loads successfully

### 2. Test API Endpoints
```bash
# Test backend is responding
curl https://visafin-gest.org/api/me
# Expected: 401 Unauthorized (no auth)

# Test frontend is serving
curl -s https://visafin-gest.org | grep "<!DOCTYPE" | head -1
# Expected: HTML response

# Test OAuth endpoint exists
curl -X OPTIONS https://visafin-gest.org/api/auth/google-login -v
# Expected: 200 OK with CORS headers
```

### 3. Test OAuth in Browser
1. Visit `https://visafin-gest.org`
2. Open DevTools (F12)
3. Go to Console tab
4. Try to sign in with Google
5. Monitor Network tab for requests to:
   - `accounts.google.com` (Google GSI client)
   - `https://visafin-gest.org/api/auth/google-login` (backend)
6. Check Console for errors
7. Verify success message and user dashboard loads

### 4. Check Backend Logs
```bash
# In Coolify, view backend service logs
# Look for:
# - "Google login success" messages
# - No "Invalid token" errors
# - No "SECRET_KEY" errors
# - No database connection errors
```

### 5. Database Verification
```bash
# Verify users created via Google OAuth have data
# Connect to PostgreSQL and run:
SELECT * FROM auth_user WHERE email LIKE '%@gmail.com';
```

---

## Error Scenarios & Solutions

### "Invalid Token" Error

**Symptoms:**
- Browser console shows 400 Bad Request
- Backend logs show: "Error during token verification"

**Causes:**
1. GOOGLE_CLIENT_ID doesn't match token issuer
2. Token expired (Google tokens valid for ~1 hour)
3. Token is for different Client ID

**Solutions:**
- [ ] Verify GOOGLE_CLIENT_ID environment variable is set correctly
- [ ] Check frontend VITE_GOOGLE_CLIENT_ID matches
- [ ] Regenerate test token (sign in again)
- [ ] Review backend logs with actual error message

### "CORS Policy Blocked" Error

**Symptoms:**
- Browser console shows: "Access to XMLHttpRequest from origin 'https://visafin-gest.org' blocked by CORS"

**Causes:**
1. Frontend origin not in CORS_ALLOWED_ORIGINS
2. CORS middleware not configured
3. Pre-flight OPTIONS request rejected

**Solutions:**
- [ ] Add `https://visafin-gest.org` to CORS_ALLOWED_ORIGINS
- [ ] Verify corsheaders middleware is installed
- [ ] Check CORS_ALLOW_ALL_ORIGINS setting
- [ ] Test with simple GET request first

### "Redirect URI Mismatch" in Google Consent Screen

**Symptoms:**
- Google sign-in dialog shows error about redirect URI

**Causes:**
1. Domain not added to Google Cloud Console authorized origins
2. Typo in domain

**Solutions:**
- [ ] Go to Google Cloud Console Credentials
- [ ] Edit OAuth Client
- [ ] Add exact domain to "Authorized JavaScript origins"
- [ ] Clear browser cache and try again

### User Created But Not Logged In

**Symptoms:**
- Backend returns 200 but with wrong user data
- User not found in database

**Causes:**
1. Database connection failed during user creation
2. Investor/Wallet creation failed

**Solutions:**
- [ ] Check DATABASE_URL environment variable
- [ ] Review backend logs for database errors
- [ ] Verify migrations ran successfully
- [ ] Check PostgreSQL is running: `SELECT * FROM auth_user;`

### "SECRET_KEY" Django Error

**Symptoms:**
- Backend fails to start with SECRET_KEY error
- All requests return 500

**Causes:**
1. DJANGO_SECRET_KEY environment variable not set
2. SECRET_KEY is empty or invalid

**Solutions:**
- [ ] Generate new secret key using provided scripts
- [ ] Set DJANGO_SECRET_KEY in Coolify environment
- [ ] Restart backend service
- [ ] Verify with: `echo $DJANGO_SECRET_KEY`

---

## Performance & Security Monitoring

### Monitor These Metrics
- [ ] OAuth endpoint response time (should be < 500ms)
- [ ] Token refresh token expiry (check logs)
- [ ] Failed login attempts (rate limiting)
- [ ] Suspicious API access patterns

### Security Actions
- [ ] Regularly rotate DJANGO_SECRET_KEY
- [ ] Monitor for failed OAuth verification attempts
- [ ] Keep google-auth library updated
- [ ] Review Google Cloud OAuth logs for suspicious activity
- [ ] Implement rate limiting on /api/auth/* endpoints

---

## Rollback Plan

If OAuth deployment fails:

1. **Immediate**: Keep old domain DNS pointing to previous server
2. **Check Logs**: Review backend docker-compose logs for errors
3. **Revert Environment**: Wrong environment variable → fix and redeploy
4. **Verify Google Cloud**: Check if domain still in authorized origins
5. **Database**: Ensure PostgreSQL has data (don't lose user accounts)
6. **Redeploy**: Update environment variables and retry deployment

---

## Success Criteria

✅ **OAuth is production-ready when:**
1. User can successfully sign in via Google on https://visafin-gest.org
2. User data (email, name) is correctly retrieved and stored
3. JWT tokens are returned and stored properly
4. Subsequent API requests use tokens successfully
5. Token refresh works when access token expires
6. No errors in browser console or backend logs
7. OAuth endpoint responds < 500ms
8. Dashboard loads after successful sign-in

---

## References

- [Google OAuth Implementation](GOOGLE_OAUTH_SETUP.md)
- [Coolify Deployment Guide](COOLIFY_DEPLOYMENT_GUIDE.md)
- [Docker Compose Configuration](docker-compose.yml)
- [Backend OAuth View](backend/api/views.py#L492)
- [Frontend Auth Service](frontend/src/services/auth.ts#L14)
- [Google Identity Services Docs](https://developers.google.com/identity/gsi/web)

