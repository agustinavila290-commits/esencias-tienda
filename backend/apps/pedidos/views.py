from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Pedido
from .serializers import PedidoSerializer
from .services import PedidoService


# ── Endpoint público: crear pedido ────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def crear_pedido(request):
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
        return Response({'status': 'ignored'})

    try:
        PedidoService.procesar_webhook_mp(payment_id)
    except Exception:
        pass

    return Response({'status': 'ok'})


# ── Endpoints admin ───────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_pedidos_list(request):
    estado = request.query_params.get('estado')
    qs = Pedido.objects.prefetch_related('items__producto', 'historial').order_by('-created_at')
    if estado:
        qs = qs.filter(estado=estado)
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
