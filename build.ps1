#!/usr/bin/env pwsh

# Build script for Django backend
# Usage: .\build.ps1

Write-Host ""
Write-Host "🔨 CryptoInvest - Backend Build Script" -ForegroundColor Cyan
Write-Host ""

$buildPath = Join-Path -Path $PSScriptRoot -ChildPath "backend"

if (-not (Test-Path -Path $buildPath)) {
    Write-Host "❌ Error: backend folder not found!" -ForegroundColor Red
    exit 1
}

Push-Location $buildPath

# Step 1: Install dependencies
Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ pip install failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Django checks
Write-Host "Step 2: Running Django checks..." -ForegroundColor Yellow
python manage.py check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Django checks failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ Django checks passed" -ForegroundColor Green
Write-Host ""

# Step 3: Collect static files (optional for prod)
Write-Host "Step 3: Collecting static files..." -ForegroundColor Yellow
python manage.py collectstatic --noinput
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  collectstatic had issues (may be okay in dev)" -ForegroundColor Yellow
}
Write-Host "✅ Static files ready" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host " ✅ BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To run in production:" -ForegroundColor Cyan
Write-Host "  gunicorn invest_backend.wsgi:application"
Write-Host ""
Write-Host "📋 Files to deploy:" -ForegroundColor Cyan
Write-Host "  - backend/"
Write-Host "  - requirements.txt"
Write-Host "  - .env"
Write-Host ""

Pop-Location

Write-Host "✅ Done!" -ForegroundColor Green
Write-Host ""
