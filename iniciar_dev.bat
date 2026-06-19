@echo off
title Esencias de la naturaleza — Dev
echo Iniciando backend en puerto 8001...
start "Backend Esencias" cmd /k "cd /d "%~dp0backend" && venv\Scripts\activate && python manage.py runserver 8001"
timeout /t 3 /nobreak >nul
echo Iniciando frontend en puerto 5174...
start "Frontend Esencias" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo.
echo Backend: http://localhost:8001
echo Frontend: http://localhost:5174
echo Admin Django: http://localhost:8001/admin
pause
