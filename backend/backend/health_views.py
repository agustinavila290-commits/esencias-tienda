"""Health checks para monitoreo (uptime checks, balanceadores, systemd,
etc.). No exponen ningún detalle interno más allá de "ok"/"error" por
componente — nada de queries, stack traces ni configuración."""
import logging

from django.core.cache import cache
from django.db import connection
from django.db.utils import OperationalError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_live(request):
    """Liveness: el proceso está arriba y puede responder. No toca DB ni cache."""
    return Response({'status': 'ok'})


@api_view(['GET'])
@permission_classes([AllowAny])
def health_ready(request):
    """Readiness: además de estar vivo, puede atender tráfico de verdad
    (la base de datos responde y la caché funciona)."""
    checks = {}
    todo_ok = True

    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        checks['database'] = 'ok'
    except OperationalError:
        logger.error('Health check: la base de datos no responde.')
        checks['database'] = 'error'
        todo_ok = False

    try:
        cache.set('health_check_ping', '1', 5)
        checks['cache'] = 'ok' if cache.get('health_check_ping') == '1' else 'error'
        if checks['cache'] != 'ok':
            todo_ok = False
    except Exception:
        logger.error('Health check: la caché no responde.')
        checks['cache'] = 'error'
        todo_ok = False

    status_code = 200 if todo_ok else 503
    return Response({'status': 'ok' if todo_ok else 'error', 'checks': checks}, status=status_code)
