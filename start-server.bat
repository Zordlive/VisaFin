@echo off
REM Script de démarrage du serveur Express pour Windows

cd /d "%~dp0backend-nestjs"

echo.
echo ==============================================
echo  CryptoInvest - Serveur Express
echo ==============================================
echo.

echo Demarrage du serveur...
node node_modules/ts-node/dist/bin.js src/start.ts

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Erreur: Le serveur n'a pas pu demarrer
    echo Verifiez:
    echo - Les dependances: npm install
    echo - La base de donnees: npx prisma db push
    echo - Le fichier .env
    pause
    exit /b 1
)
