## Script PowerShell pour demarrer le serveur Express CryptoInvest

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " CryptoInvest - Serveur Express" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path -Path $PSScriptRoot -ChildPath "backend-nestjs"

if (-not (Test-Path -Path $backendPath)) {
    Write-Host "Erreur: Dossier backend-nestjs non trouve!" -ForegroundColor Red
    exit 1
}

Push-Location $backendPath

Write-Host "Dossier du backend: $backendPath" -ForegroundColor Green
Write-Host "Demarrage du serveur..." -ForegroundColor Yellow
Write-Host ""

# Vérifier que ts-node est installé
if (-not (Test-Path -Path "node_modules/ts-node")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Lancer le serveur
node node_modules/ts-node/dist/bin.js src/start.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Erreur: Le serveur n'a pas pu demarrer" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifiez:" -ForegroundColor Yellow
    Write-Host "  1. Les dependances: npm install" 
    Write-Host "  2. La base de donnees: npx prisma db push"
    Write-Host "  3. Le fichier .env"
    Write-Host ""
    Read-Host "Appuyez sur Entree pour quitter"
}

Pop-Location
