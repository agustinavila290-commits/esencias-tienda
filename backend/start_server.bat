@echo off
title Backend — Esencias de la naturaleza
cd /d "%~dp0"
call venv\Scripts\activate
python manage.py runserver 8001
pause
