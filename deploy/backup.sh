#!/bin/bash
# ==============================================================
# backup.sh — Backup diario de Esencias de la naturaleza
# (base de datos + /media). No contiene contraseñas: se leen de
# backend/.env (las mismas que ya usa Django para conectarse).
#
# Uso manual:   bash /srv/esencias/deploy/backup.sh
# Cron sugerido (todos los días a las 03:00, con retención de 14 días):
#   0 3 * * * /srv/esencias/deploy/backup.sh >> /srv/esencias/backups/backup.log 2>&1
#
# Variables opcionales (export antes de llamar al script, o editar acá):
#   BACKUP_DIR      default: /srv/esencias/backups
#   RETENTION_DAYS  default: 14
# ==============================================================

set -euo pipefail

APP_DIR="/srv/esencias"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [ -f "$APP_DIR/backend/.env" ]; then
    # OJO: no usar `source`/`. archivo` acá — SECRET_KEY y DB_PASSWORD son
    # strings generados al azar que pueden incluir '$', backticks, etc., y
    # source los interpretaría como código bash (falla con "unbound variable"
    # o, peor, podría ejecutar algo). Se leen línea por línea como texto
    # literal en cambio.
    set -a
    while IFS='=' read -r key value; do
        [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
        export "$key=$value"
    done < <(grep -vE '^\s*(#|$)' "$APP_DIR/backend/.env")
    set +a
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "[$(date)] Iniciando backup..."

# --- Base de datos ---
if [ "${USE_SQLITE:-True}" = "False" ]; then
    DUMP_FILE="$BACKUP_DIR/db_${TIMESTAMP}.sql.gz"
    # PGPASSWORD se toma de la misma DB_PASSWORD que usa Django (viene del .env
    # de arriba); no se hardcodea ninguna contraseña acá. Alternativa más
    # segura: configurar un archivo ~/.pgpass en vez de esta variable.
    PGPASSWORD="${DB_PASSWORD:-}" pg_dump \
        -h "${DB_HOST:-localhost}" \
        -p "${DB_PORT:-5432}" \
        -U "${DB_USER:-postgres}" \
        "${DB_NAME:-esencias}" \
        | gzip > "$DUMP_FILE"
    chmod 600 "$DUMP_FILE"
    echo "[$(date)] Backup de base de datos (PostgreSQL): $DUMP_FILE"
else
    DUMP_FILE="$BACKUP_DIR/db_${TIMESTAMP}.sqlite3"
    cp "$APP_DIR/backend/db.sqlite3" "$DUMP_FILE"
    chmod 600 "$DUMP_FILE"
    echo "[$(date)] USE_SQLITE=True: copiado $DUMP_FILE"
fi

# --- Media (imágenes de productos) ---
MEDIA_FILE="$BACKUP_DIR/media_${TIMESTAMP}.tar.gz"
tar -czf "$MEDIA_FILE" -C "$APP_DIR/backend" media
chmod 600 "$MEDIA_FILE"
echo "[$(date)] Backup de media: $MEDIA_FILE"

# --- Retención ---
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db_*' -o -name 'media_*' \) -mtime "+$RETENTION_DAYS" -delete
echo "[$(date)] Backups con más de $RETENTION_DAYS días eliminados de $BACKUP_DIR."

echo "[$(date)] ✅ Backup completado."
