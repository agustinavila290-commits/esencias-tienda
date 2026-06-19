from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from .models import Pedido, ItemPedido


class ItemPedidoInline(admin.TabularInline):
    model = ItemPedido
    extra = 0
    readonly_fields = ['producto', 'cantidad', 'precio_unitario']
    can_delete = False


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'cliente_nombre', 'estado_badge', 'total_fmt', 'reserva_status', 'created_at']
    list_filter = ['estado']
    search_fields = ['codigo', 'cliente_nombre']
    readonly_fields = ['codigo', 'total', 'expires_at', 'created_at']
    inlines = [ItemPedidoInline]
    ordering = ['-created_at']

    def total_fmt(self, obj):
        return f'${obj.total:,.0f}'.replace(',', '.')
    total_fmt.short_description = 'Total'

    def estado_badge(self, obj):
        colores = {
            'pendiente': '#f59e0b',
            'confirmado': '#10b981',
            'cancelado': '#6b7280',
            'vencido': '#ef4444',
        }
        color = colores.get(obj.estado, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px;font-size:11px">{}</span>',
            color, obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'

    def reserva_status(self, obj):
        if obj.estado != 'pendiente':
            return '—'
        ahora = timezone.now()
        if obj.expires_at > ahora:
            mins = int((obj.expires_at - ahora).total_seconds() // 60)
            return format_html('<span style="color:green">⏱ {} min</span>', mins)
        return format_html('<span style="color:red">Vencida</span>')
    reserva_status.short_description = 'Reserva'
