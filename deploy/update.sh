#!/bin/bash
# ==============================================================
# update.sh — Actualizar Esencias de la naturaleza en el servidor
# Uso desde el servidor: bash /srv/esencias/deploy/update.sh
# Con git pull:          bash /srv/esencias/deploy/update.sh --git
# ==============================================================

set -euo pipefail

APP_DIR="/srv/esencias"
VENV="$APP_DIR/venv"

echo "[$(date)] Iniciando actualización de Esencias..."

if [ -f "$APP_DIR/backend/.env" ]; then
    export $(grep -v '^#' "$APP_DIR/backend/.env" | xargs)
fi

if [[ "${1:-}" == "--git" ]]; then
    echo "[$(date)] Pull desde git..."
    cd "$APP_DIR"
    git pull origin main
fi

echo "[$(date)] Actualizando dependencias Python..."
"$VENV/bin/pip" install -r "$APP_DIR/backend/requirements.txt" -q

echo "[$(date)] Aplicando migraciones..."
cd "$APP_DIR/backend"
"$VENV/bin/python" manage.py migrate --noinput

echo "[$(date)] Recopilando archivos estáticos..."
"$VENV/bin/python" manage.py collectstatic --noinput -q

echo "[$(date)] Compilando frontend..."
cd "$APP_DIR/frontend"
npm install --silent
npm run build

echo "[$(date)] Reiniciando servicio..."
sudo systemctl restart esencias
sudo nginx -t && sudo systemctl reload nginx

echo "[$(date)] ✅ Actualización completada."
sudo systemctl status esencias --no-pager -l | head -10
