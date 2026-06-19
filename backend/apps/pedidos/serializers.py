from rest_framework import serializers
from django.utils import timezone
from .models import Pedido, ItemPedido, HistorialEstado


class ItemPedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ItemPedido
        fields = ['id', 'producto', 'producto_nombre', 'cantidad', 'precio_unitario', 'subtotal']


class HistorialEstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialEstado
        fields = ['id', 'estado', 'nota', 'created_at']


class PedidoSerializer(serializers.ModelSerializer):
    items     = ItemPedidoSerializer(many=True, read_only=True)
    historial = HistorialEstadoSerializer(many=True, read_only=True)
    vigente   = serializers.BooleanField(read_only=True)
    minutos_restantes = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            'id', 'codigo',
            'cliente_nombre', 'cliente_email', 'cliente_telefono', 'cliente_direccion',
            'estado', 'metodo_pago', 'total',
            'expires_at', 'created_at', 'vigente', 'minutos_restantes',
            'items', 'historial',
        ]

    def get_minutos_restantes(self, obj):
        if obj.estado != 'pendiente':
            return None
        diff = (obj.expires_at - timezone.now()).total_seconds()
        return max(0, int(diff // 60))
