# Rollback — Mejora del carrito (despliegue del 2026-07-29)

Rediseño integral del carrito (drawer lateral, revalidación contra el backend,
deshacer al eliminar). Solo cambios de frontend — sin migraciones, sin cambios
de contrato de API.

Commit anterior: `cefe99c`
Release anterior (symlink `frontend/current` antes del deploy): `20260729_090134_cefe99c`
Release desplegada en esta actualización: `20260729_094019_50119f0`

```bash
ln -sfn /srv/esencias/frontend/releases/20260729_090134_cefe99c /srv/esencias/frontend/current
sudo systemctl reload nginx   # no hace falta reiniciar Gunicorn: no hubo cambios de backend
```

Si la release anterior ya no está (se conservan solo las últimas 5):

```bash
cd /srv/esencias && sudo -u esencias git checkout cefe99c
bash /srv/esencias/deploy/update.sh
```

---

# Rollback — Fase 10 (despliegue del 2026-07-29)

Renovación estética integral del frontend público y ajustes de coherencia en el admin.
Solo cambios de frontend — sin migraciones, sin cambios de contrato de API.

Commit anterior (el que corría en prod antes de este despliegue): `a4b08a4`
Release anterior (symlink `frontend/current` antes del deploy): `20260728_122807_a4b08a4`
Release desplegada en esta actualización: `20260729_084459_55d2bf0`

Rollback más simple y de menor riesgo (estructura de releases atómicos ya activa):

```bash
ln -sfn /srv/esencias/frontend/releases/20260728_122807_a4b08a4 /srv/esencias/frontend/current
sudo systemctl reload nginx   # no hace falta reiniciar Gunicorn: no hubo cambios de backend
```

Si por algún motivo la release anterior ya no está en `frontend/releases/` (se conservan solo las
últimas 5), volver el código a `a4b08a4` y reconstruir:

```bash
cd /srv/esencias && sudo -u esencias git checkout a4b08a4
bash /srv/esencias/deploy/update.sh
```

---

# Rollback — Fase 9 (despliegue del 2026-07-28)

Backup pre-despliegue en el servidor: `/srv/esencias-backups/pre-fase9_20260728_112119/`
Commit anterior (el que corría en prod antes de este despliegue): `7a0c36c`
Tag local/remoto que lo marca: `pre-fase9-deploy`
Commit desplegado en este release: ver `git log --oneline -1` en `/srv/esencias` tras el deploy.

Todos los comandos de esta guía se ejecutan en el servidor (root@168.197.49.221, puerto SSH 5684)
salvo que se indique lo contrario. **No corren solos** — son la referencia para actuar rápido si algo
sale mal.

## 1. Rollback de código (backend + frontend, sin releases atómicos)

```bash
cd /srv/esencias
git fetch origin
git checkout 7a0c36c    # o: git checkout pre-fase9-deploy
```

## 2. Rollback del frontend (build atómico vía symlink)

Si ya se armó la estructura de releases (`/srv/esencias/frontend/releases/<id>/` +
symlink `current`), simplemente apuntar el symlink al release anterior:

```bash
ls -la /srv/esencias/frontend/releases/           # ver qué releases existen
ln -sfn /srv/esencias/frontend/releases/<release-anterior> /srv/esencias/frontend/current
sudo systemctl reload nginx   # nginx sirve desde /srv/esencias/frontend/current -> no hace falta reiniciar Gunicorn
```

Si todavía no había releases previos (como en este primer despliegue con esta estructura), restaurar
el build viejo desde el backup:

```bash
BK=/srv/esencias-backups/pre-fase9_20260728_112119
rm -rf /srv/esencias/frontend/dist_rollback
mkdir -p /srv/esencias/frontend/dist_rollback
tar -xzf "$BK/frontend-dist-actual.tar.gz" -C /srv/esencias/frontend/dist_rollback
# apuntar nginx (o el symlink current) a dist_rollback/dist temporalmente
```

## 3. Rollback de migraciones

**Solo si hace falta** — revisar primero qué migraciones nuevas se aplicaron:

```bash
cd /srv/esencias/backend
source ../venv/bin/activate
python manage.py showmigrations productos pedidos
```

Todas las migraciones de este despliegue son aditivas (agregan columnas/índices nullable o con
backfill seguro — ver informe final, sección "Migraciones"). Revertirlas es opcional y de bajo
riesgo, pero si hace falta:

```bash
python manage.py migrate pedidos 0003
python manage.py migrate productos 0002
```

Si algo sale mal a mitad de camino, la opción más segura y rápida es restaurar el dump completo
(paso 4) en vez de desandar migraciones una por una.

## 4. Restauración de PostgreSQL

**Esto sobreescribe la base actual — usar solo si hace falta revertir datos, no solo código.**

```bash
BK=/srv/esencias-backups/pre-fase9_20260728_112119
sudo systemctl stop esencias    # cortar escrituras mientras se restaura
source /srv/esencias/backend/.env
export PGPASSWORD="$DB_PASSWORD"
dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" "$BK/db_esencias.dump"
unset PGPASSWORD
sudo systemctl start esencias
```

## 5. Restauración de media

```bash
BK=/srv/esencias-backups/pre-fase9_20260728_112119
rm -rf /srv/esencias/backend/media
tar -xzf "$BK/media.tar.gz" -C /srv/esencias/backend
```

## 6. Rollback de Nginx

```bash
BK=/srv/esencias-backups/pre-fase9_20260728_112119
cp "$BK/nginx-esencias.conf.bak" /etc/nginx/sites-available/esencias
nginx -t && sudo systemctl reload nginx
```

## 7. Rollback de systemd (Gunicorn)

```bash
BK=/srv/esencias-backups/pre-fase9_20260728_112119
cp "$BK/esencias.service.bak" /etc/systemd/system/esencias.service
sudo systemctl daemon-reload
sudo systemctl restart esencias
```

## 8. Reinicio general tras cualquier rollback

```bash
sudo systemctl restart esencias
sudo systemctl status esencias --no-pager
curl -sf https://esencias.avilamotorepuesto.com.ar/api/health/ready/
```

## Notas

- El POS (`avilapos.service`, puerto 8000) no se toca en ningún paso de este rollback.
- `.env` de backend/frontend también están respaldados en `$BK/backend.env.bak` y
  `$BK/frontend.env.bak` por si hace falta revertir alguna variable nueva.
