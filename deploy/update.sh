#!/bin/bash
# ==============================================================
# update.sh — Actualizar Esencias de la naturaleza en el servidor
# Uso desde el servidor (como root): bash /srv/esencias/deploy/update.sh
# Con git pull:                      bash /srv/esencias/deploy/update.sh --git
#
# Despliegue atómico del frontend: cada build va a
# frontend/releases/<fecha>_<commit>/ y el symlink frontend/current apunta
# al último. Nginx sirve siempre desde frontend/current — así un build a
# medio hacer nunca queda visible, y volver a un release anterior es
# reapuntar el symlink (ver deploy/ROLLBACK.md).
# ==============================================================

set -euo pipefail

APP_DIR="/srv/esencias"
VENV="$APP_DIR/venv"
RUN_AS="esencias"

echo "[$(date)] Iniciando actualización de Esencias..."

if [[ "${1:-}" == "--git" ]]; then
    echo "[$(date)] Pull desde git..."
    cd "$APP_DIR"
    sudo -u "$RUN_AS" git pull origin main
fi

echo "[$(date)] Actualizando dependencias Python..."
sudo -u "$RUN_AS" "$VENV/bin/pip" install -r "$APP_DIR/backend/requirements.txt" -q

echo "[$(date)] Plan de migraciones..."
cd "$APP_DIR/backend"
sudo -u "$RUN_AS" bash -c "export \$(grep -v '^#' .env | xargs -d '\n'); '$VENV/bin/python' manage.py migrate --plan"

echo "[$(date)] Aplicando migraciones..."
sudo -u "$RUN_AS" bash -c "export \$(grep -v '^#' .env | xargs -d '\n'); '$VENV/bin/python' manage.py migrate --noinput"

echo "[$(date)] Recopilando archivos estáticos..."
sudo -u "$RUN_AS" bash -c "export \$(grep -v '^#' .env | xargs -d '\n'); '$VENV/bin/python' manage.py collectstatic --noinput -v 0"

echo "[$(date)] Reiniciando backend con el código nuevo..."
systemctl restart esencias
sleep 1
curl -sf http://127.0.0.1:8001/api/health/ready/ >/dev/null || {
    echo "[$(date)] ❌ El backend no responde en /api/health/ready/ tras el restart. Revisar antes de seguir."
    exit 1
}

echo "[$(date)] Instalando dependencias del frontend..."
cd "$APP_DIR/frontend"
sudo -u "$RUN_AS" npm ci --silent

echo "[$(date)] Corriendo tests del frontend..."
sudo -u "$RUN_AS" npx vitest run

echo "[$(date)] Build + prerenderizado del frontend..."
sudo -u "$RUN_AS" env VITE_API_URL="${BACKEND_URL:-https://esencias.avilamotorepuesto.com.ar}/api" npm run build:prerender

RELEASE_ID="$(date +%Y%m%d_%H%M%S)_$(cd "$APP_DIR" && git rev-parse --short HEAD)"
echo "[$(date)] Publicando release $RELEASE_ID..."
mkdir -p "$APP_DIR/frontend/releases/$RELEASE_ID"
cp -r "$APP_DIR/frontend/dist/." "$APP_DIR/frontend/releases/$RELEASE_ID/"
chown -R "$RUN_AS:www-data" "$APP_DIR/frontend/releases/$RELEASE_ID"
ln -sfn "$APP_DIR/frontend/releases/$RELEASE_ID" "$APP_DIR/frontend/current"

echo "[$(date)] Limpiando releases viejos (se conservan los últimos 5)..."
cd "$APP_DIR/frontend/releases"
ls -1t | tail -n +6 | xargs -r rm -rf

echo "[$(date)] Verificando Nginx y recargando..."
nginx -t && systemctl reload nginx

echo "[$(date)] ✅ Actualización completada. Release activo: $RELEASE_ID"
systemctl status esencias --no-pager -l | head -10
