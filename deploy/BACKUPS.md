# Backups — Esencias de la naturaleza

## Qué se respalda

1. **Base de datos** (PostgreSQL en producción, `pg_dump` comprimido; o el
   archivo `db.sqlite3` si por algún motivo se sigue usando SQLite).
2. **`/media`** (imágenes de productos subidas desde el panel) como
   `.tar.gz`.

Los scripts están en `deploy/backup.sh` (backup) y `deploy/restore-test.sh`
(prueba de restauración segura, en base temporal, sin tocar producción).

## Configuración

`backup.sh` lee `backend/.env` para obtener `DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD`, `DB_NAME`, `USE_SQLITE` — **no hace falta escribir ninguna
contraseña en el script ni en este documento**, usa las mismas credenciales
que ya usa Django para conectarse.

Variables opcionales del script:

| Variable         | Default                  | Qué hace                          |
|------------------|---------------------------|------------------------------------|
| `BACKUP_DIR`     | `/srv/esencias/backups`   | Dónde se guardan los backups       |
| `RETENTION_DAYS` | `14`                      | Backups más viejos se borran solos |

## Programación (cron diario a las 03:00)

```bash
sudo mkdir -p /srv/esencias/backups
sudo chown root:root /srv/esencias/backups
sudo chmod 700 /srv/esencias/backups
sudo chmod +x /srv/esencias/deploy/backup.sh

# crontab de root:
sudo crontab -e
# agregar:
0 3 * * * /srv/esencias/deploy/backup.sh >> /srv/esencias/backups/backup.log 2>&1
```

## Permisos

- `/srv/esencias/backups` → `700` (solo root).
- Cada dump/tar generado → `600` (solo lectura/escritura para el dueño).
- Los backups **no** deben quedar accesibles vía Nginx: no están dentro de
  `/srv/esencias/backend/media` ni de `/srv/esencias/frontend/dist`, así que
  no hay ruta pública que los sirva. Confirmar igual que ningún `location`
  de Nginx apunte a `/srv/esencias/backups`.

## Retención y ubicación recomendada

- Retención local: 14 días (configurable).
- **Recomendado**: además de la copia local, sincronizar periódicamente la
  carpeta `/srv/esencias/backups` a un almacenamiento fuera del servidor
  (otro VPS, un bucket S3-compatible, etc.) con `rsync`/`rclone`, para que un
  problema con el disco del servidor no se lleve backups y datos a la vez.
  Esto queda fuera del alcance de este cambio (requiere credenciales de un
  proveedor externo que no están definidas todavía) — se deja como mejora
  pendiente documentada.

## Prueba de restauración

**Nunca restaurar directamente sobre la base de producción para "probar".**
Usar `deploy/restore-test.sh <ruta-al-dump>`, que:

1. Crea una base temporal `esencias_restore_test`.
2. Restaura el dump ahí.
3. Muestra conteos de filas de las tablas clave (`productos_producto`,
   `pedidos_pedido`, `auth_user`) para verificar que el restore trajo datos.
4. Pregunta si borrar la base temporal (o se puede inspeccionar a mano antes
   de borrarla).

Ejecutar esta prueba al menos una vez después de configurar los backups, y
periódicamente (ej. una vez al mes) para confirmar que los dumps siguen
siendo restaurables.

## Variables de entorno nuevas

Ninguna variable nueva en `.env` — los scripts reutilizan las que ya existen
(`DB_*`, `USE_SQLITE`). `BACKUP_DIR` y `RETENTION_DAYS` son opcionales y se
pueden exportar antes de llamar al script si se quiere cambiar el default.
