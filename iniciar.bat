@echo off
title ZGym SaaS Launcher
echo ===================================================
echo           INICIANDO PLATAFORMA ZGYM SAAS
echo ===================================================
echo.
echo 1. Iniciando API Backend en puerto 5000...
start "ZGym Backend API (Puerto 5000)" cmd /k "cd /d "%~dp0server" && npm run dev"

echo 2. Iniciando Cliente PWA en puerto 5173...
start "ZGym Cliente PWA (Puerto 5173)" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo Esperando inicializacion de servicios...
timeout /t 4 /nobreak > nul

echo 3. Abriendo ZGym en el navegador...
start http://localhost:5173

echo.
echo ===================================================
echo  ZGym esta ejecutandose.
echo  Podes instalarla desde Chrome tocando "Instalar ZGym"
echo ===================================================
timeout /t 4
