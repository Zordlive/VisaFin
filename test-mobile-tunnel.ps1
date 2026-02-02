# Script PowerShell pour tester avec tunnel HTTPS (compatible Google OAuth)
# Utilise localtunnel pour créer des URLs HTTPS publiques temporaires

Write-Host "🌐 Configuration tunnel HTTPS pour test mobile..." -ForegroundColor Cyan
Write-Host ""

# Vérifier si localtunnel est installé
$ltInstalled = npm list -g localtunnel 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "📦 Installation de localtunnel..." -ForegroundColor Yellow
    npm install -g localtunnel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation de localtunnel" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Localtunnel installé" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Démarrage du backend Django..." -ForegroundColor Cyan

# Démarrer le backend en arrière-plan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python manage.py runserver 8000" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "✅ Backend démarré sur http://localhost:8000" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Création du tunnel HTTPS pour le backend..." -ForegroundColor Cyan

# Créer le tunnel pour le backend
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "lt --port 8000 --subdomain cryptoinvest-api-test" -WindowStyle Normal

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "⚠️  IMPORTANT: Note l'URL du tunnel backend affichée dans la fenêtre" -ForegroundColor Yellow
Write-Host "    Exemple: https://cryptoinvest-api-test.loca.lt" -ForegroundColor White
Write-Host ""

$backendUrl = Read-Host "Entre l'URL complète du tunnel backend (ex: https://xxxxx.loca.lt)"

if (-not $backendUrl) {
    Write-Host "❌ URL du backend requise" -ForegroundColor Red
    exit 1
}

# Mettre à jour le fichier .env.local du frontend
$frontendEnv = @"
VITE_API_BASE_URL=${backendUrl}/api
VITE_GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
"@

Set-Content -Path "frontend\.env.local" -Value $frontendEnv
Write-Host "✅ Frontend configuré pour utiliser: ${backendUrl}/api" -ForegroundColor Green

# Mettre à jour le backend .env
$backendDomain = $backendUrl -replace 'https://', ''
$backendEnv = @"
DEBUG=True
DJANGO_SECRET_KEY=dev-secret-key-for-tunnel-testing
ALLOWED_HOSTS=localhost,127.0.0.1,${backendDomain}
GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
SITE_URL=${backendUrl}
"@

Set-Content -Path "backend\.env" -Value $backendEnv
Write-Host "✅ Backend configuré pour accepter: ${backendDomain}" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  REDÉMARRE le backend pour prendre en compte les changements!" -ForegroundColor Red
Write-Host ""

$restart = Read-Host "Redémarrer le backend maintenant? (O/n)"
if ($restart -eq "" -or $restart -eq "O" -or $restart -eq "o") {
    # Arrêter le backend précédent (approximatif)
    Get-Process | Where-Object { $_.CommandLine -like "*manage.py runserver*" } | Stop-Process -Force 2>$null
    Start-Sleep -Seconds 2
    
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python manage.py runserver 8000" -WindowStyle Normal
    Write-Host "✅ Backend redémarré" -ForegroundColor Green
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "🚀 Démarrage du frontend..." -ForegroundColor Cyan

# Démarrer le frontend
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "🌐 Création du tunnel HTTPS pour le frontend..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "lt --port 5173 --subdomain cryptoinvest-app-test" -WindowStyle Normal

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ CONFIGURATION TERMINÉE!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 INSTRUCTIONS MOBILE:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Regarde la fenêtre du tunnel frontend" -ForegroundColor White
Write-Host "   2. Note l'URL (ex: https://cryptoinvest-app-test.loca.lt)" -ForegroundColor White
Write-Host "   3. Ouvre cette URL sur ton mobile (n'importe où dans le monde!)" -ForegroundColor White
Write-Host "   4. La première fois, localtunnel demande une confirmation" -ForegroundColor White
Write-Host "      Clique sur 'Click to Continue'" -ForegroundColor White
Write-Host ""
Write-Host "✅ Avec HTTPS, Google OAuth fonctionnera!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Note: Les tunnels localtunnel peuvent être lents" -ForegroundColor Yellow
Write-Host "    C'est normal pour des tests temporaires" -ForegroundColor Yellow
Write-Host ""
