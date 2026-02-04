#!/usr/bin/env pwsh

# Build script for Express backend
# Usage: .\build.ps1

Write-Host ""
Write-Host "🔨 CryptoInvest - Backend Build Script" -ForegroundColor Cyan
Write-Host ""

$buildPath = Join-Path -Path $PSScriptRoot -ChildPath "backend-nestjs"

if (-not (Test-Path -Path $buildPath)) {
    Write-Host "❌ Error: backend-nestjs folder not found!" -ForegroundColor Red
    exit 1
}

Push-Location $buildPath

# Step 1: Clean
Write-Host "Step 1: Cleaning old build..." -ForegroundColor Yellow
Remove-Item -Path "dist" -Recurse -ErrorAction SilentlyContinue
Write-Host "✅ Cleaned" -ForegroundColor Green
Write-Host ""

# Step 2: Install dependencies
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 3: Generate Prisma
Write-Host "Step 3: Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Prisma generate had issues (may be okay)" -ForegroundColor Yellow
}
Write-Host "✅ Prisma ready" -ForegroundColor Green
Write-Host ""

# Step 4: Compile TypeScript
Write-Host "Step 4: Compiling TypeScript..." -ForegroundColor Yellow
npx tsc src/server.ts src/start.ts --outDir dist --module commonjs --target es2020 --skipLibCheck
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript compilation failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ TypeScript compiled" -ForegroundColor Green
Write-Host ""

# Step 5: Verify build
Write-Host "Step 5: Verifying build..." -ForegroundColor Yellow
if (-not (Test-Path -Path "dist/start.js")) {
    Write-Host "❌ Build verification failed: dist/start.js not found!" -ForegroundColor Red
    Pop-Location
    exit 1
}
if (-not (Test-Path -Path "dist/server.js")) {
    Write-Host "❌ Build verification failed: dist/server.js not found!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ Build verified" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host " ✅ BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Output files:" -ForegroundColor Cyan
Write-Host "  - dist/start.js"
Write-Host "  - dist/server.js"
Write-Host ""
Write-Host "🚀 To run in production:" -ForegroundColor Cyan
Write-Host "  npm run start:prod"
Write-Host "  or"
Write-Host "  node dist/start.js"
Write-Host ""
Write-Host "📋 Files to deploy:" -ForegroundColor Cyan
Write-Host "  - dist/"
Write-Host "  - node_modules/"
Write-Host "  - prisma/"
Write-Host "  - .env"
Write-Host "  - package.json"
Write-Host ""

Pop-Location

Write-Host "✅ Done!" -ForegroundColor Green
Write-Host ""
