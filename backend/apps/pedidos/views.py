import logging

from django.core.exceptions import ValidationError
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Pedido
from .serializers import PedidoSerializer
from .services import PedidoService
from backend.rate_limit import get_client_ip, rate_limit_ok

logger = logging.getLogger(__name__)


# ── Endpoint público: crear pedido ────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def crear_pedido(request):
    ip = get_client_ip(request)
    if not rate_limit_ok(f'crear-pedido:{ip}', max_attempts=20, window_seconds=3600):
        logger.warning('crear_pedido bloqueado por rate limit (ip=%s)', ip)
        return Response({'error': 'Demasiados pedidos creados. Probá de nuevo en un rato.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    data = request.data or {}
    line_items        = data.get('line_items') or []
    cliente_nombre    = (data.get('cliente_nombre')    or '').strip()
    cliente_email     = (data.get('cliente_email')     or '').strip()
    cliente_telefono  = (data.get('cliente_telefono')  or '').strip()
    cliente_direccion = (data.get('cliente_direccion') or '').strip()

    if not line_items:
        return Response({'error': 'line_items es obligatorio y no puede estar vacío.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        pedido = PedidoService.crear_reserva(
            line_items, cliente_nombre, cliente_email, cliente_telefono, cliente_direccion
        )
    except ValueError as e:
        errores = e.args[0] if e.args else ['Error al crear el pedido.']
        return Response({'error': 'Stock insuficiente', 'detalle': errores}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(PedidoSerializer(pedido).data, status=status.HTTP_201_CREATED)


# ── Endpoint público: crear preferencia MP ────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def crear_preferencia_mp(request, pk):
    try:
        pedido = Pedido.objects.get(pk=pk)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        init_point = PedidoService.crear_preferencia_mp(pedido.id)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': f'Error al crear preferencia MP: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'init_point': init_point})


# ── Webhook Mercado Pago ──────────────────────────────────────────────────────

@csrf_exempt
@api_view(['POST', 'GET'])
@permission_classes([AllowAny])
def mp_webhook(request):
    topic      = request.query_params.get('type') or request.query_params.get('topic')
    payment_id = request.query_params.get('data.id') or request.query_params.get('id')

    if not payment_id and request.data:
        payment_id = request.data.get('data', {}).get('id')

    if topic != 'payment' or not payment_id:
        logger.info('MP webhook: notificación ignorada (topic=%s, payment_id=%s)', topic, payment_id)
        return Response({'status': 'ignored'})

    try:
        PedidoService.procesar_webhook_mp(payment_id)
    except Exception:
        # Mercado Pago reintenta si no responde 200, así que igual devolvemos
        # 200 (evita una tormenta de reintentos) pero dejamos el error en el log.
        logger.exception('MP webhook: error inesperado procesando payment_id=%s', payment_id)

    return Response({'status': 'ok'})


# ── Seguimiento público de pedido ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def pedido_seguimiento(request, codigo):
    """Consulta segura de un pedido por su código + token de seguimiento
    (?token=<uuid>, generado en `Pedido.tracking_token`). El código corto por
    sí solo NO alcanza —es adivinable/enumerable (6 caracteres)—, así que
    ambos deben coincidir. No expone pedidos de otros clientes: sin el token
    correcto, la respuesta es 404 igual que si el pedido no existiera."""
    ip = get_client_ip(request)
    if not rate_limit_ok(f'pedido-seguimiento:{ip}', max_attempts=30, window_seconds=300):
        return Response({'error': 'Demasiadas consultas. Probá de nuevo en unos minutos.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    token = request.query_params.get('token', '').strip()
    if not token:
        return Response({'error': 'Falta el token de seguimiento.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        pedido = Pedido.objects.prefetch_related('items__producto', 'historial').get(
            codigo=codigo, tracking_token=token,
        )
    except (Pedido.DoesNotExist, ValidationError, ValueError):
        return Response({'error': 'Pedido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    return Response(PedidoSerializer(pedido).data)


# ── Endpoints admin ───────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_pedidos_list(request):
    estado = request.query_params.get('estado')
    search = request.query_params.get('search', '').strip()
    qs = Pedido.objects.prefetch_related('items__producto', 'historial').order_by('-created_at')
    if estado:
        qs = qs.filter(estado=estado)
    if search:
        qs = qs.filter(Q(codigo__icontains=search) | Q(cliente_nombre__icontains=search))
    return Response(PedidoSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_confirmar_pedido(request, pk):
    try:
        pedido = PedidoService.confirmar_pedido(pk)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(PedidoSerializer(pedido).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_cancelar_pedido(request, pk):
    try:
        pedido = PedidoService.cancelar_pedido(pk)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(PedidoSerializer(pedido).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_marcar_enviado(request, pk):
    nota = (request.data.get('nota') or '').strip()
    try:
        pedido = PedidoService.marcar_enviado(pk, nota)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(PedidoSerializer(pedido).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_marcar_entregado(request, pk):
    nota = (request.data.get('nota') or '').strip()
    try:
        pedido = PedidoService.marcar_entregado(pk, nota)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(PedidoSerializer(pedido).data)
