# Setup script for CryptoInvest backend development on Windows PowerShell
# Usage: .\setup_backend.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CryptoInvest Backend Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend folder
$backendPath = Join-Path $PSScriptRoot "backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "ERROR: backend directory not found at $backendPath" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.10+ from https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    if (-not $?) {
        Write-Host "ERROR: Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Virtual environment already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"
if (-not $?) {
    Write-Host "ERROR: Failed to activate virtual environment" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

Write-Host ""
Write-Host "Installing requirements..." -ForegroundColor Yellow
pip install -r requirements.txt
if (-not $?) {
    Write-Host "ERROR: Failed to install requirements" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Yellow
python manage.py migrate
if (-not $?) {
    Write-Host "ERROR: Failed to run migrations" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the development server, run:" -ForegroundColor Green
Write-Host "  python manage.py runserver" -ForegroundColor Cyan
Write-Host ""
Write-Host "To deactivate the virtual environment, run:" -ForegroundColor Green
Write-Host "  deactivate" -ForegroundColor Cyan
Write-Host ""
