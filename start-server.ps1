## Script PowerShell pour demarrer le serveur Django CryptoInvest

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " CryptoInvest - Serveur Django" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path -Path $PSScriptRoot -ChildPath "backend"

if (-not (Test-Path -Path $backendPath)) {
    Write-Host "Erreur: Dossier backend non trouve!" -ForegroundColor Red
    exit 1
}

Push-Location $backendPath

Write-Host "Dossier du backend: $backendPath" -ForegroundColor Green
Write-Host "Demarrage du serveur..." -ForegroundColor Yellow
Write-Host ""

# Lancer le serveur Django
python manage.py runserver

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Erreur: Le serveur n'a pas pu demarrer" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifiez:" -ForegroundColor Yellow
    Write-Host "  1. Les dependances: pip install -r requirements.txt" 
    Write-Host "  2. La base de donnees: python manage.py migrate"
    Write-Host "  3. Le fichier .env"
    Write-Host ""
    Read-Host "Appuyez sur Entree pour quitter"
}

Pop-Location
