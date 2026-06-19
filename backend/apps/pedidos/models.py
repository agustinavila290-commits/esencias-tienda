import random
import string
from django.db import models


def _generar_codigo():
    chars = string.ascii_uppercase + string.digits
    return 'PED-' + ''.join(random.choices(chars, k=6))


class Pedido(models.Model):
    ESTADOS = [
        ('pendiente',  'Pendiente'),
        ('confirmado', 'Confirmado'),
        ('enviado',    'Enviado'),
        ('entregado',  'Entregado'),
        ('cancelado',  'Cancelado'),
        ('vencido',    'Vencido'),
    ]
    codigo            = models.CharField(max_length=20, unique=True, default=_generar_codigo, verbose_name='Código')
    cliente_nombre    = models.CharField(max_length=150, blank=True, verbose_name='Nombre')
    cliente_email     = models.EmailField(blank=True, verbose_name='Email')
    cliente_telefono  = models.CharField(max_length=30, blank=True, verbose_name='Teléfono')
    cliente_direccion = models.TextField(blank=True, verbose_name='Dirección')
    estado            = models.CharField(max_length=20, choices=ESTADOS, default='pendiente', verbose_name='Estado', db_index=True)
    total             = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Total')
    expires_at        = models.DateTimeField(verbose_name='Vence a las')
    created_at        = models.DateTimeField(auto_now_add=True, verbose_name='Creado')
    metodo_pago       = models.CharField(
        max_length=20,
        choices=[('whatsapp', 'WhatsApp'), ('mercadopago', 'Mercado Pago')],
        default='whatsapp', verbose_name='Método de pago'
    )
    mp_preference_id  = models.CharField(max_length=100, blank=True, verbose_name='MP Preference ID')
    mp_payment_id     = models.CharField(max_length=100, blank=True, verbose_name='MP Payment ID')
    mp_status         = models.CharField(max_length=50, blank=True, verbose_name='MP Status')

    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.codigo} — {self.get_estado_display()}'

    @property
    def vigente(self):
        from django.utils import timezone
        return self.estado == 'pendiente' and self.expires_at > timezone.now()


class ItemPedido(models.Model):
    pedido          = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='items')
    producto        = models.ForeignKey('productos.Producto', on_delete=models.PROTECT, related_name='items')
    cantidad        = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Precio unitario')

    class Meta:
        verbose_name = 'Ítem de pedido'
        verbose_name_plural = 'Ítems de pedido'

    def __str__(self):
        return f'{self.producto.nombre} x{self.cantidad}'

    @property
    def subtotal(self):
        return self.precio_unitario * self.cantidad


class HistorialEstado(models.Model):
    pedido     = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='historial')
    estado     = models.CharField(max_length=20, verbose_name='Estado')
    nota       = models.CharField(max_length=200, blank=True, verbose_name='Nota')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha')

    class Meta:
        verbose_name = 'Historial de estado'
        verbose_name_plural = 'Historial de estados'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.pedido.codigo} → {self.estado}'
