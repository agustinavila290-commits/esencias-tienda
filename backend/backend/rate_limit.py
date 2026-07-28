"""Utilidad compartida de rate limiting basada en el cache de Django (por
defecto en memoria local; en producción puede apuntar a Redis vía
`REDIS_URL`, ver settings.py). Pensada para usarse en cualquier vista
pública sensible (login, registro, creación de pedidos, seguimiento, etc.)
sin duplicar la lógica de conteo en cada app."""
from django.core.cache import cache


def get_client_ip(request) -> str:
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR', 'unknown')


def rate_limit_ok(key: str, max_attempts: int, window_seconds: int) -> bool:
    """Incrementa el contador de `key` y devuelve False si ya se superó
    `max_attempts` dentro de los últimos `window_seconds`."""
    count = cache.get(key, 0)
    if count >= max_attempts:
        return False
    cache.set(key, count + 1, window_seconds)
    return True
