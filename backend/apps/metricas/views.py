from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from backend.rate_limit import get_client_ip, rate_limit_ok
from .serializers import EventoMetricaSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def registrar_evento(request):
    """Registra un evento comercial anónimo (ver models.py). Pensado para
    llamarse "fire and forget" desde el frontend: nunca devuelve un error
    que el usuario tenga que ver, y está apagado por defecto
    (METRICAS_HABILITADAS=False) para no recolectar nada sin que el
    negocio lo haya decidido explícitamente."""
    if not getattr(settings, 'METRICAS_HABILITADAS', False):
        return Response(status=status.HTTP_204_NO_CONTENT)

    ip = get_client_ip(request)
    if not rate_limit_ok(f'metrica:{ip}', max_attempts=60, window_seconds=60):
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = EventoMetricaSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
    return Response(status=status.HTTP_204_NO_CONTENT)
