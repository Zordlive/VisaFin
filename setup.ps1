#!/usr/bin/env pwsh

# Setup script - Initialise l'environnement complet
# Usage: .\setup.ps1

Write-Host ""
Write-Host "⚙️  CryptoInvest - Setup Script" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Python
Write-Host "Step 1: Checking Python..." -ForegroundColor Yellow
$pythonVersion = & python --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ $pythonVersion found" -ForegroundColor Green
} else {
    Write-Host "❌ Python not found! Please install Python 3.10+" -ForegroundColor Red
    Write-Host "Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: Setup Backend
Write-Host "Step 2: Setting up backend..." -ForegroundColor Yellow
$backendPath = Join-Path -Path $PSScriptRoot -ChildPath "backend"

if (-not (Test-Path -Path $backendPath)) {
    Write-Host "❌ Error: backend folder not found!" -ForegroundColor Red
    exit 1
}

Push-Location $backendPath

# Install backend dependencies
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend pip install failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Run migrations
Write-Host "Applying migrations..." -ForegroundColor Yellow
python manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Django migrations failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ Migrations applied" -ForegroundColor Green
Write-Host ""

# Step 3: Setup Frontend
Write-Host "Step 3: Setting up frontend..." -ForegroundColor Yellow
Pop-Location
$frontendPath = Join-Path -Path $PSScriptRoot -ChildPath "frontend"

if (-not (Test-Path -Path $frontendPath)) {
    Write-Host "⚠️  Frontend folder not found (optional)" -ForegroundColor Yellow
} else {
    Push-Location $frontendPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Frontend npm install had issues" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
    }
    Pop-Location
}

Write-Host ""

# Step 4: Check .env
Write-Host "Step 4: Checking environment..." -ForegroundColor Yellow
$backendEnv = Join-Path -Path $backendPath -ChildPath ".env"

if (-not (Test-Path -Path $backendEnv)) {
    Write-Host "⚠️  .env file not found in backend" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Create a .env file with:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "DEBUG=True" -ForegroundColor Gray
    Write-Host "DATABASE_URL=postgresql://user:password@localhost:5432/cryptoinvest" -ForegroundColor Gray
    Write-Host "DJANGO_SECRET_KEY=your-secret-key" -ForegroundColor Gray
    Write-Host "ALLOWED_HOSTS=localhost,127.0.0.1" -ForegroundColor Gray
    Write-Host "SITE_URL=http://localhost:8000" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✅ .env file found" -ForegroundColor Green
}

Write-Host ""

# Step 5: Done
Write-Host "Step 5: Backend ready" -ForegroundColor Yellow
Write-Host "✅ Django configured" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host " ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

Write-Host "📚 Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Configure .env file (if not already done):" -ForegroundColor Yellow
Write-Host "   notepad backend/.env" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Setup database:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   python manage.py migrate" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Start backend:" -ForegroundColor Yellow
Write-Host "   .\start-server.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣  Start frontend (in another terminal):" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   - README.md (general overview)" -ForegroundColor Gray
Write-Host ""

Pop-Location
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
