# Google OAuth Setup Guide - Production Deployment

## Overview
Google OAuth 2.0 authentication is integrated in CryptoInvest for seamless user login via Google Sign-In. This guide explains the complete setup for production deployment on Coolify with domain `visafin-gest.org`.

---

## 1. Architecture

### Frontend Flow
```
User clicks "Sign in with Google"
    ↓
Google Sign-In dialog (via Google Identity Services library)
    ↓
User consents & approves
    ↓
Frontend receives ID token
    ↓
POST /api/auth/google-login with ID token
    ↓
Backend verifies token signature with GOOGLE_CLIENT_ID
    ↓
Backend returns JWT tokens
    ↓
User logged in with session
```

### Key Files
- **Backend**: [backend/api/views.py](backend/api/views.py#L492) - `GoogleLoginView` handles token verification
- **Frontend Auth Service**: [frontend/src/services/auth.ts](frontend/src/services/auth.ts#L14) - `loginWithGoogle()` method
- **Frontend Component**: Likely in components triggering Google Sign-In
- **Backend Settings**: [backend/invest_backend/settings.py](backend/invest_backend/settings.py#L196) - `GOOGLE_CLIENT_ID` configuration

---

## 2. Environment Configuration

### Frontend (.env.production)
Located in [frontend/.env.production](frontend/.env.production):
```
VITE_API_BASE_URL=https://visafin-gest.org/api
VITE_GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
```

**Note**: This must match your Google OAuth Client ID in Google Cloud Console.

### Backend (Docker Environment)
In [docker-compose.yml](docker-compose.yml), backend service needs:
```yaml
environment:
  - GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
  - SITE_URL=https://visafin-gest.org
  - DJANGO_SECRET_KEY=<strong-random-key-here>
```

**For Coolify Deployment**: Set these environment variables in Coolify dashboard:
- `GOOGLE_CLIENT_ID`: `562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com`
- `DJANGO_SECRET_KEY`: Generate a strong random key (see section 4)
- `SITE_URL`: `https://visafin-gest.org`

---

## 3. Google Cloud Console Configuration

### Step 1: Verify OAuth Client Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID: `562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com`

### Step 2: Configure Authorized Redirect URIs
⚠️ **CRITICAL**: Google OAuth requires explicit authorized domains for redirects.

Update your OAuth Client configuration:
1. Click on the OAuth 2.0 Client ID
2. Go to **Authorized JavaScript origins**
3. Add:
   ```
   https://visafin-gest.org
   https://www.visafin-gest.org
   http://localhost:3000        (for local testing)
   http://localhost:5173        (for local Vite dev)
   http://127.0.0.1:3000        (alternate local)
   http://127.0.0.1:5173        (alternate local)
   ```

4. Go to **Authorized redirect URIs**
5. Add:
   ```
   https://visafin-gest.org/api/auth/google-login
   https://www.visafin-gest.org/api/auth/google-login
   http://localhost:8000/api/auth/google-login    (for local backend)
   http://127.0.0.1:8000/api/auth/google-login   (for local backend)
   ```

### Step 3: Ensure OAuth Consent Screen
1. Go to **OAuth consent screen**
2. Verify your app is in "Production" mode (not "In development")
3. Add authorized users if needed (for testing)
4. Ensure required scopes include email profile information

---

## 4. Generating Strong Django Secret Key

⚠️ **Production Security**: NEVER use default keys in production.

### Option A: Using Python (Recommended)
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Option B: Using Python's secrets module
```bash
python -c "import secrets; import string; print(''.join(secrets.choice(string.ascii_letters + string.digits + string.punctuation) for _ in range(50)))"
```

### Option C: Using OpenSSL
```bash
openssl rand -base64 32
```

**Copy the generated key and add to Coolify environment variables as `DJANGO_SECRET_KEY`**.

---

## 5. CORS Configuration

### Current Status ✅
Backend CORS is already configured in [backend/invest_backend/settings.py](backend/invest_backend/settings.py#L145):

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://visafin-gest.org',
    'https://www.visafin-gest.org',
    'visafin-gest.org',
]

# For production - allow Coolify domains
if not DEBUG:
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r"^https://.*\.onrender\.com$",
        r"^https://.*\.sslip\.io$",
    ]

CORS_ALLOW_ALL_ORIGINS = True  # For testing - can be disabled
```

**For production**: Consider disabling `CORS_ALLOW_ALL_ORIGINS` once testing is complete.

---

## 6. API Endpoint Details

### Google Login Endpoint
- **URL**: `POST /api/auth/google-login`
- **Request Body**:
  ```json
  {
    "token": "<Google ID Token from frontend>"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "username": "john_example"
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "referral_bonus": 0
  }
  ```
- **Error Response** (400/500):
  ```json
  {
    "message": "Invalid token or verification failed"
  }
  ```

### Token Verification Process
[Backend Implementation](backend/api/views.py#L492):
1. Receives ID token from frontend
2. Verifies token signature using `google.oauth2.id_token.verify_oauth2_token()`
3. Validates token with backend's `GOOGLE_CLIENT_ID`
4. Extracts email, name, picture from token claims
5. Creates or updates User record
6. Creates Investor, Wallet records if new user
7. Returns JWT tokens for subsequent API calls

---

## 7. Frontend Google Sign-In Integration

### HTML Setup
[frontend/index.html](frontend/index.html) includes:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### Auth Service
[frontend/src/services/auth.ts](frontend/src/services/auth.ts):
```typescript
async loginWithGoogle(googleToken: string) {
    const res = await api.post('/auth/google-login', { token: googleToken })
    // Stores JWT tokens and user data
    return { user, access_token, referral_bonus }
}
```

---

## 8. Testing OAuth Locally

### Prerequisites
```bash
cd backend
export GOOGLE_CLIENT_ID="562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com"
export DJANGO_SECRET_KEY="your-generated-key-here"
python manage.py runserver
```

```bash
cd frontend
npm run dev  # Vite dev server on port 5173
```

### Test Flow
1. Open `http://localhost:5173`
2. Click "Sign in with Google"
3. Approve access in Google consent screen
4. Verify token is sent to backend
5. Check that `/api/auth/google-login` receives it
6. Confirm user is created/authenticated

---

## 9. Deployment to Coolify Checklist

- [ ] Generate strong `DJANGO_SECRET_KEY` (see section 4)
- [ ] Update Coolify environment variables:
  - [ ] `GOOGLE_CLIENT_ID`: `562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com`
  - [ ] `DJANGO_SECRET_KEY`: Your generated key
  - [ ] `SITE_URL`: `https://visafin-gest.org`
  - [ ] `DATABASE_URL`: PostgreSQL connection string (set by Coolify)
- [ ] Verify Google Cloud Console has authorized origins:
  - [ ] `https://visafin-gest.org`
  - [ ] `https://www.visafin-gest.org`
- [ ] Build and deploy docker-compose.yml via Coolify
- [ ] Run database migrations (handled in Dockerfile startup)
- [ ] Test OAuth flow on production domain
- [ ] Monitor logs for OAuth errors:
  - [ ] Backend: Check `backend/logs/django-error.log`
  - [ ] Frontend: Browser console for CORS/network errors

---

## 10. Troubleshooting

### Error: "Invalid token" or verification fails
**Cause**: Token issued for different Client ID than backend has configured.
**Fix**: Ensure `GOOGLE_CLIENT_ID` environment variable matches frontend's `VITE_GOOGLE_CLIENT_ID`.

### Error: CORS policy blocked request
**Cause**: Frontend origin not in `CORS_ALLOWED_ORIGINS`.
**Fix**: Add frontend domain to [backend/invest_backend/settings.py](backend/invest_backend/settings.py#L145).

### Error: "Redirect URI mismatch" on Google consent screen
**Cause**: Frontend URL not in Google Cloud Console authorized origins.
**Fix**: Add domain to OAuth Client in Google Cloud Console (section 3).

### Error: User not created after OAuth login
**Cause**: Database connection or migration issues.
**Fix**: Check `DATABASE_URL`, run migrations: `python manage.py migrate`

### Error: Tokens not stored in browser
**Cause**: localStorage blocked or API response missing tokens.
**Fix**: Check browser DevTools, verify response includes `access_token` and `refresh_token`.

---

## 11. Production Best Practices

1. **Environment Variables**: Never hardcode secrets in code
   - Use Coolify dashboard for `GOOGLE_CLIENT_ID`, `DJANGO_SECRET_KEY`
   - Use `.env` files only for development

2. **HTTPS Only**: Always use HTTPS in production
   - Ensure `VITE_API_BASE_URL=https://visafin-gest.org/api`
   - Google OAuth requires HTTPS for production

3. **Error Logging**: Monitor OAuth errors
   - Check [backend/logs/django-error.log](backend/logs/django-error.log)
   - Review browser console for frontend errors

4. **Rate Limiting**: Consider rate limiting `/api/auth/google-login` if under attack

5. **Token Expiry**: 
   - Access tokens expire after 15 minutes
   - Refresh tokens are sent via HTTP-only cookie
   - Frontend interceptor automatically refreshes tokens

6. **Disable Debug Mode**: Ensure `DEBUG=False` in production
   - Set in Coolify environment variables
   - Never set to `True` in production

---

## Support & Links

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Django REST Framework Authentication](https://www.django-rest-framework.org/api-guide/authentication/)
- [Google Auth Library for Python](https://github.com/googleapis/google-auth-library-python)

