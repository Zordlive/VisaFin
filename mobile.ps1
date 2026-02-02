# 📱 Test Mobile - Simple
# Lance ce script et ouvre l'URL affichée sur ton mobile

# Trouver l'IP locale
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" }).IPAddress | Select-Object -First 1

if (-not $ip) {
    Write-Host "❌ IP locale introuvable" -ForegroundColor Red
    exit 1
}

# Config backend
@"
DEBUG=True
DJANGO_SECRET_KEY=dev-key
ALLOWED_HOSTS=localhost,127.0.0.1,$ip
SITE_URL=http://${ip}:5173
"@ | Out-File -FilePath "backend\.env" -Encoding utf8

# Config frontend
@"
VITE_API_BASE_URL=http://${ip}:8000/api
"@ | Out-File -FilePath "frontend\.env.local" -Encoding utf8

# Démarrer
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd backend; python manage.py runserver 0.0.0.0:8000"
Start-Sleep 2
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- --host 0.0.0.0"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ PRÊT !" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Ouvre sur ton mobile :" -ForegroundColor Yellow
Write-Host ""
Write-Host "   http://${ip}:5173" -ForegroundColor White -BackgroundColor Blue
Write-Host ""
Write-Host "⚠️  Mobile sur le même WiFi" -ForegroundColor Yellow
Write-Host ""
