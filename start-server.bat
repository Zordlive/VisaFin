@echo off
REM Script de démarrage du serveur Django pour Windows

cd /d "%~dp0backend"

echo.
echo ==============================================
echo  CryptoInvest - Serveur Django
echo ==============================================
echo.

echo Demarrage du serveur...
python manage.py runserver

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Erreur: Le serveur n'a pas pu demarrer
    echo Verifiez:
    echo - Les dependances: pip install -r requirements.txt
    echo - La base de donnees: python manage.py migrate
    echo - Le fichier .env
    pause
    exit /b 1
)
