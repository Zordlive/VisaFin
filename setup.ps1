#!/usr/bin/env pwsh

# Setup script - Initialise l'environnement complet
# Usage: .\setup.ps1

Write-Host ""
Write-Host "⚙️  CryptoInvest - Setup Script" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node.js
Write-Host "Step 1: Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = & node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found! Please install Node.js 18+" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: Setup Backend
Write-Host "Step 2: Setting up backend..." -ForegroundColor Yellow
$backendPath = Join-Path -Path $PSScriptRoot -ChildPath "backend-nestjs"

if (-not (Test-Path -Path $backendPath)) {
    Write-Host "❌ Error: backend-nestjs folder not found!" -ForegroundColor Red
    exit 1
}

Push-Location $backendPath

# Install backend dependencies
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend npm install failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
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
    Write-Host "⚠️  .env file not found in backend-nestjs" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Create a .env file with:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "DATABASE_URL=postgresql://user:password@localhost:5432/cryptoinvest" -ForegroundColor Gray
    Write-Host "JWT_SECRET=your-secret-key-here-min-32-characters" -ForegroundColor Gray
    Write-Host "JWT_REFRESH_SECRET=your-refresh-secret-here-min-32-characters" -ForegroundColor Gray
    Write-Host "PORT=3000" -ForegroundColor Gray
    Write-Host "NODE_ENV=development" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✅ .env file found" -ForegroundColor Green
}

Write-Host ""

# Step 5: Setup Prisma
Write-Host "Step 5: Setting up database..." -ForegroundColor Yellow
Push-Location $backendPath

npx prisma generate 2>&1 | Out-Null
Write-Host "✅ Prisma configured" -ForegroundColor Green

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
Write-Host "   nano backend-nestjs/.env" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Setup database:" -ForegroundColor Yellow
Write-Host "   cd backend-nestjs" -ForegroundColor Gray
Write-Host "   npx prisma db push" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Start backend:" -ForegroundColor Yellow
Write-Host "   .\start-server.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣  Start frontend (in another terminal):" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "5️⃣  Test API:" -ForegroundColor Yellow
Write-Host "   cd backend-nestjs" -ForegroundColor Gray
Write-Host "   node test-api.js" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   - README.md (general overview)" -ForegroundColor Gray
Write-Host "   - backend-nestjs/README-EXPRESS.md (backend guide)" -ForegroundColor Gray
Write-Host "   - MIGRATION_EXPRESS.md (migration details)" -ForegroundColor Gray
Write-Host ""

Pop-Location
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
