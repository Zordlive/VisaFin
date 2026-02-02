# Script PowerShell pour tester l'application sur mobile
# Ce script démarre le backend et frontend avec accès réseau local

Write-Host "📱 Configuration pour test mobile..." -ForegroundColor Cyan

# Obtenir l'adresse IP locale
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -like "192.168.*" }).IPAddress

if (-not $localIP) {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -like "10.*" }).IPAddress
}

if (-not $localIP) {
    Write-Host "❌ Impossible de trouver l'adresse IP locale" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Adresse IP locale: $localIP" -ForegroundColor Green
Write-Host ""
Write-Host "📋 URLs pour mobile:" -ForegroundColor Yellow
Write-Host "   Frontend: http://${localIP}:5173" -ForegroundColor White
Write-Host "   Backend:  http://${localIP}:8000" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Configuration en cours..." -ForegroundColor Cyan

# Créer un fichier .env.local pour le frontend
$frontendEnv = @"
VITE_API_BASE_URL=http://${localIP}:8000/api
VITE_GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
"@

Set-Content -Path "frontend\.env.local" -Value $frontendEnv
Write-Host "✅ Fichier frontend/.env.local créé" -ForegroundColor Green

# Créer un fichier .env.local pour le backend
$backendEnv = @"
DEBUG=True
DJANGO_SECRET_KEY=dev-secret-key-for-mobile-testing
ALLOWED_HOSTS=localhost,127.0.0.1,$localIP
GOOGLE_CLIENT_ID=562113266712-p7i84kjqmnri2ihs3lqd1d3saqh8von0.apps.googleusercontent.com
SITE_URL=http://${localIP}:5173
"@

Set-Content -Path "backend\.env" -Value $backendEnv
Write-Host "✅ Fichier backend/.env créé" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Démarrage des serveurs..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 INSTRUCTIONS MOBILE:" -ForegroundColor Yellow
Write-Host "   1. Connecte ton mobile au même WiFi que ton PC" -ForegroundColor White
Write-Host "   2. Ouvre ton navigateur mobile" -ForegroundColor White
Write-Host "   3. Va sur: http://${localIP}:5173" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Note: Google OAuth ne fonctionnera pas sur HTTP (seulement HTTPS)" -ForegroundColor Red
Write-Host "    Tu peux tester la connexion email/mot de passe uniquement" -ForegroundColor Red
Write-Host ""

# Demander confirmation
$confirm = Read-Host "Démarrer les serveurs maintenant? (O/n)"
if ($confirm -eq "" -or $confirm -eq "O" -or $confirm -eq "o") {
    Write-Host ""
    Write-Host "🔵 Démarrage du backend..." -ForegroundColor Blue
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python manage.py runserver 0.0.0.0:8000"
    
    Start-Sleep -Seconds 2
    
    Write-Host "🟢 Démarrage du frontend..." -ForegroundColor Green
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev -- --host 0.0.0.0"
    
    Write-Host ""
    Write-Host "✅ Serveurs démarrés!" -ForegroundColor Green
    Write-Host "📱 Ouvre http://${localIP}:5173 sur ton mobile" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "ℹ️  Configuration prête. Lance manuellement:" -ForegroundColor Yellow
    Write-Host "   Backend:  cd backend && python manage.py runserver 0.0.0.0:8000" -ForegroundColor White
    Write-Host "   Frontend: cd frontend && npm run dev -- --host 0.0.0.0" -ForegroundColor White
}
