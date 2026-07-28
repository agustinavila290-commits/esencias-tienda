#!/bin/bash
# ==============================================================
# restore-test.sh — Prueba de restauración SIN tocar la base de
# producción. Restaura un dump elegido en una base temporal
# ("esencias_restore_test") y compara conteos de filas básicos.
#
# Uso:
#   bash /srv/esencias/deploy/restore-test.sh /srv/esencias/backups/db_20260101_030000.sql.gz
#
# Al terminar, el script pregunta si borrar la base temporal
# (por defecto la deja, para poder inspeccionarla a mano).
#
# Requiere las mismas variables que backup.sh (DB_HOST, DB_PORT, DB_USER,
# DB_PASSWORD) disponibles en backend/.env.
# ==============================================================

set -euo pipefail

APP_DIR="/srv/esencias"
DUMP_FILE="${1:?Uso: restore-test.sh <ruta-al-dump.sql.gz>}"
TEST_DB="esencias_restore_test"

if [ -f "$APP_DIR/backend/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$APP_DIR/backend/.env"
    set +a
fi

if [ "${USE_SQLITE:-True}" != "False" ]; then
    echo "Este script es para PostgreSQL. En SQLite alcanza con copiar el .sqlite3 y abrirlo."
    exit 1
fi

export PGPASSWORD="${DB_PASSWORD:-}"
PSQL="psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres}"

echo "[$(date)] Creando base temporal '$TEST_DB'..."
$PSQL -d postgres -c "DROP DATABASE IF EXISTS $TEST_DB;"
$PSQL -d postgres -c "CREATE DATABASE $TEST_DB;"

echo "[$(date)] Restaurando $DUMP_FILE en '$TEST_DB'..."
gunzip -c "$DUMP_FILE" | $PSQL -d "$TEST_DB" > /dev/null

echo "[$(date)] Verificando conteos de filas en tablas clave..."
$PSQL -d "$TEST_DB" -c "
    SELECT 'productos_producto' AS tabla, count(*) FROM productos_producto
    UNION ALL SELECT 'pedidos_pedido', count(*) FROM pedidos_pedido
    UNION ALL SELECT 'auth_user', count(*) FROM auth_user;
"

echo
read -r -p "¿Borrar la base temporal '$TEST_DB'? [s/N] " respuesta
if [[ "$respuesta" =~ ^[sS]$ ]]; then
    $PSQL -d postgres -c "DROP DATABASE $TEST_DB;"
    echo "[$(date)] Base temporal eliminada."
else
    echo "[$(date)] Base temporal '$TEST_DB' queda disponible para inspección manual."
fi
