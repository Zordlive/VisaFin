# Coolify Deployment Configuration for CryptoInvest

## Required Environment Variables

Set these in your Coolify dashboard before deploying:

### Backend Service
```
DEBUG=False
PYTHONUNBUFFERED=1
DATABASE_URL=postgresql://investuser:investpass123@db:5432/cryptoinvest
DJANGO_SECRET_KEY=<GENERATE_AND_SET_STRONG_KEY>
ALLOWED_HOSTS=localhost,127.0.0.1,*.sslip.io,visafin-gest.org,www.visafin-gest.org
GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
SITE_URL=https://visafin-gest.org
```

### Frontend Service
```
VITE_API_BASE_URL=https://visafin-gest.org/api
VITE_GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
```

## How to Deploy

### Step 1: Generate Django Secret Key
Run one of these commands locally to generate a strong secret key:

**On Linux/Mac:**
```bash
bash generate_secret_key.sh
```

**On Windows (PowerShell):**
```powershell
.\generate_secret_key.ps1
```

**Or manually:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Step 2: Set Environment Variables in Coolify
1. Go to Coolify Dashboard
2. Select your project
3. For the **backend service**:
   - Set `DJANGO_SECRET_KEY` to the generated key
   - Set `GOOGLE_CLIENT_ID` as shown above
   - Set `SITE_URL=https://visafin-gest.org`
4. For the **frontend service**:
   - Set `VITE_API_BASE_URL=https://visafin-gest.org/api`
   - Set `VITE_GOOGLE_CLIENT_ID` as shown above

### Step 3: Point Docker Compose
1. In Coolify, select docker-compose deployment type
2. Upload or point to `docker-compose.yml` in your repository
3. Ensure both services are configured with their environment variables

### Step 4: Deploy
Click "Deploy" and monitor logs for any errors.

## Docker Compose Structure

The `docker-compose.yml` defines:

- **db**: PostgreSQL 15 service
  - Credentials: investuser / investpass123
  - Volume: postgres_data (persists across restarts)

- **backend**: Django REST API
  - Builds from ./backend/Dockerfile
  - Exposes port 8000
  - Runs migrations on startup
  - Requires GOOGLE_CLIENT_ID environment variable

- **frontend**: React + Vite
  - Builds from ./frontend/Dockerfile
  - Exposes port 3000
  - Requires VITE_API_BASE_URL environment variable

## Verifying Deployment

### Check Backend Health
```bash
curl https://visafin-gest.org/api/me
# Should return 401 Unauthorized (OK - no auth token)
```

### Check OAuth Endpoint
```bash
curl -X POST https://visafin-gest.org/api/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{"token": "test-token"}'
# Should return error about invalid token (OK - endpoint is working)
```

### Check Frontend
Visit `https://visafin-gest.org` in your browser
- Should load the React application
- Check browser console for any JavaScript errors
- Try signing in with Google

## Monitoring Logs

After deployment, check logs for errors:

### Backend Logs
```
/backend/logs/django-error.log
```

Look for:
- Database connection errors (if DATABASE_URL is wrong)
- Google OAuth token verification errors (if GOOGLE_CLIENT_ID is wrong)
- Missing secret key errors (if DJANGO_SECRET_KEY not set)

### Frontend Logs
- Browser DevTools Console (F12)
- Check for CORS errors or failed API calls
- Verify VITE_API_BASE_URL is correct

## Troubleshooting

### OAuth not working
- [ ] Check GOOGLE_CLIENT_ID in environment
- [ ] Verify Google Cloud Console has authorized this domain
- [ ] Check browser console for CORS errors
- [ ] Ensure VITE_API_BASE_URL in frontend matches deployed domain

### Database not connecting
- [ ] Verify DATABASE_URL is correctly formatted
- [ ] Check PostgreSQL container is running
- [ ] Review backend logs for connection errors

### Frontend not loading
- [ ] Check frontend build logs during deployment
- [ ] Verify VITE_API_BASE_URL is set in environment
- [ ] Ensure Node modules are installed correctly

## Security Checklist

- [ ] DJANGO_SECRET_KEY is strong and random (not default)
- [ ] DEBUG=False in production
- [ ] ALLOWED_HOSTS includes only your domains
- [ ] CORS_ALLOW_ALL_ORIGINS is disabled (or properly configured) in production
- [ ] Google OAuth Client ID matches in frontend and backend
- [ ] Google Cloud Console has production domain in authorized origins
- [ ] PostgreSQL credentials are changed from defaults
- [ ] HTTPS is enforced for all OAuth and API calls
- [ ] Logs are monitored for errors and suspicious activity

