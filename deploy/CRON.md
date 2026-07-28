# Vencimiento automático de reservas (`manage.py vencer_pedidos`)

## Qué hace

Busca pedidos con `estado='pendiente'` y `expires_at` ya pasado, los marca
`vencido` y registra el cambio en `HistorialEstado`. Nunca toca stock real
(la reserva ya se calculaba "virtualmente" liberada por fecha; esto solo
corrige el estado visible del pedido) ni pedidos en otros estados. Es
**idempotente**: correrlo dos veces seguidas no hace nada la segunda vez.

Ejecución manual (para probar):

```bash
cd /srv/esencias/backend
../venv/bin/python manage.py vencer_pedidos
```

## Opción recomendada: systemd timer

Ya viene el par de unidades en este directorio:

```bash
sudo cp deploy/vencer-pedidos.service /etc/systemd/system/
sudo cp deploy/vencer-pedidos.timer   /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now vencer-pedidos.timer
```

Corre cada 5 minutos (razonable dado que la reserva dura 1 hora — un pedido
puede quedar como "pendiente" hasta 5 minutos después de vencido, lo cual no
afecta el stock disponible porque ese cálculo ya ignora reservas vencidas
por fecha, sea cual sea el `estado` guardado).

Verificar:

```bash
systemctl list-timers | grep vencer-pedidos
journalctl -u vencer-pedidos.service -n 50 --no-pager
```

## Alternativa: cron

Si se prefiere cron en lugar de systemd timer:

```cron
*/5 * * * * cd /srv/esencias/backend && /srv/esencias/venv/bin/python manage.py vencer_pedidos >> /srv/esencias/backend/logs/vencer-pedidos.log 2>&1
```

## Monitoreo

El comando loguea con el logger `apps.pedidos.vencer_pedidos` (ver `LOGGING`
en `backend/settings.py`). En producción esos logs terminan en la salida
estándar del servicio systemd (`journalctl -u vencer-pedidos.service`) o, si
se usa cron, en el archivo indicado arriba.
