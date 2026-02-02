# Local Development Setup Guide - CryptoInvest

## Prerequisites

- **Python 3.10+** (NOT 3.14 or later for older Pillow versions)
  - Download from: https://www.python.org/downloads/
  - Recommended: Python 3.11 or 3.12
  - Check version: `python --version`

- **Node.js 18+** (for frontend)
  - Download from: https://nodejs.org/

- **Git** (version control)
  - Download from: https://git-scm.com/

- **PostgreSQL 15** (optional, for local testing with real database)
  - Download from: https://www.postgresql.org/download/

---

## Backend Setup (Django)

### Option 1: Automated Setup (Recommended for Windows)

#### Using PowerShell:
```powershell
# In the project root directory
.\setup_backend.ps1
```

#### Using Command Prompt (CMD):
```cmd
# In the project root directory
setup_backend.bat
```

### Option 2: Manual Setup

#### Step 1: Create Virtual Environment
```bash
cd backend
python -m venv venv
```

#### Step 2: Activate Virtual Environment
**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
.\venv\Scripts\activate.bat
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

#### Step 3: Upgrade pip
```bash
python -m pip install --upgrade pip
```

#### Step 4: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 5: Run Migrations
```bash
python manage.py migrate
```

#### Step 6: Create Superuser (Optional, for admin panel)
```bash
python manage.py createsuperuser
# Follow the prompts to create an admin account
```

#### Step 7: Run Development Server
```bash
python manage.py runserver
# Server runs at http://127.0.0.1:8000
```

---

## Frontend Setup (React + Vite)

### Step 1: Install Node Dependencies
```bash
cd frontend
npm install
```

### Step 2: Create .env.development File
```bash
# frontend/.env.development
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
```

### Step 3: Run Development Server
```bash
npm run dev
# Server runs at http://localhost:5173
```

---

## Running Both Services Together

### Terminal 1: Backend
```bash
cd backend
source venv/bin/activate  # or .venv\Scripts\activate on Windows
python manage.py runserver
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Then visit: http://localhost:5173 in your browser

---

## Database Configuration

### Option A: SQLite (Default, for development)
No setup needed - uses `db.sqlite3` file in backend directory.

### Option B: PostgreSQL (Recommended for testing production)

#### Install PostgreSQL
- Windows: https://www.postgresql.org/download/windows/
- Mac: https://www.postgresql.org/download/macosx/
- Linux: `sudo apt-get install postgresql`

#### Create Database and User
```bash
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL prompt:
CREATE DATABASE cryptoinvest;
CREATE USER investuser WITH PASSWORD 'investpass123';
ALTER ROLE investuser SET client_encoding TO 'utf8';
ALTER ROLE investuser SET default_transaction_isolation TO 'read committed';
ALTER ROLE investuser SET default_transaction_deferrable TO on;
ALTER ROLE investuser SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE cryptoinvest TO investuser;
\q
```

#### Update Backend Settings
Create `backend/.env` file:
```
DATABASE_URL=postgresql://investuser:investpass123@localhost:5432/cryptoinvest
DJANGO_SECRET_KEY=dev-key-not-for-production
DEBUG=True
GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
```

#### Run Migrations
```bash
python manage.py migrate
```

---

## Environment Variables

### Backend (.env or set manually)
```
# Database
DATABASE_URL=postgresql://investuser:investpass123@localhost:5432/cryptoinvest

# Django
DEBUG=True                    # Only for development!
DJANGO_SECRET_KEY=dev-key    # Change in production
SECRET_KEY=dev-key           # Fallback

# Google OAuth
GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com

# Site
SITE_URL=http://localhost:8000
ALLOWED_HOSTS=localhost,127.0.0.1

# Email (optional, for development)
DJANGO_EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Frontend (.env.development)
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
```

---

## Useful Commands

### Backend
```bash
# Run development server
python manage.py runserver

# Run on specific port
python manage.py runserver 0.0.0.0:8000

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser

# Access admin panel
# http://localhost:8000/admin

# Run tests
python manage.py test

# Shell
python manage.py shell
```

### Frontend
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'django'"
**Solution**: Make sure virtual environment is activated
```bash
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Windows CMD
.\venv\Scripts\activate.bat

# Linux/Mac
source venv/bin/activate
```

### "Pillow installation fails"
**Solution**: Update Pillow to version 11.0.0 or higher
```bash
pip install --upgrade Pillow
```

### "Port 8000 already in use"
**Solution**: Use different port
```bash
python manage.py runserver 8001
```

### "Port 5173 already in use"
**Solution**: Vite will automatically use next available port, or configure in `frontend/vite.config.ts`

### "CORS errors in browser console"
**Solution**: Ensure `VITE_API_BASE_URL` points to correct backend URL
- Development: `http://localhost:8000/api`
- Production: `https://visafin-gest.org/api`

### "Database connection error"
**Solution**: 
1. Verify PostgreSQL is running
2. Check DATABASE_URL is correct
3. Run migrations: `python manage.py migrate`

### "Google OAuth not working"
**Solution**:
1. Verify GOOGLE_CLIENT_ID is set
2. Check Google Cloud Console has `localhost:5173` and `localhost:3000` in authorized origins
3. Review browser console for CORS errors

---

## Testing OAuth Locally

1. Add to Google Cloud Console authorized origins:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - `http://127.0.0.1:5173`
   - `http://127.0.0.1:3000`

2. Start both servers:
   ```bash
   # Terminal 1
   cd backend && python manage.py runserver

   # Terminal 2
   cd frontend && npm run dev
   ```

3. Visit `http://localhost:5173`

4. Click "Sign in with Google"

5. Complete the OAuth flow

6. Check browser DevTools for requests to `/api/auth/google-login`

---

## File Structure

```
CryptoInvest/
├── backend/
│   ├── venv/                 # Virtual environment
│   ├── api/                  # Django app
│   ├── invest_backend/       # Django settings
│   ├── manage.py
│   ├── requirements.txt      # Python dependencies
│   └── db.sqlite3            # SQLite database (default)
│
├── frontend/
│   ├── node_modules/         # NPM dependencies
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   ├── .env.development      # Development environment vars
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml        # Production deployment
├── setup_backend.bat         # Automated setup (Windows CMD)
├── setup_backend.ps1         # Automated setup (Windows PowerShell)
└── README.md
```

---

## Next Steps

1. **Backend Setup**: Follow the Backend Setup section above
2. **Frontend Setup**: Follow the Frontend Setup section above
3. **Test Locally**: Run both servers and test OAuth flow
4. **Database**: Optional - switch to PostgreSQL for testing production-like setup
5. **Deployment**: When ready, follow [COOLIFY_DEPLOYMENT_GUIDE.md](COOLIFY_DEPLOYMENT_GUIDE.md)

---

## Support

For issues:
1. Check logs in `backend/logs/` directory
2. Review browser DevTools console
3. Check [OAUTH_VALIDATION_CHECKLIST.md](OAUTH_VALIDATION_CHECKLIST.md)
4. Review individual service documentation:
   - Backend: [README.md](backend/README.md)
   - Frontend: [README.md](frontend/README.md)

