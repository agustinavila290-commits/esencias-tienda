from django.db import models


class EventoMetrica(models.Model):
    """Evento comercial anónimo y agregable: ni el modelo ni la vista que lo
    escribe (ver views.py) guardan IP, user-agent, cookies ni ningún dato
    personal — a propósito, para no necesitar aviso de cookies ni tocar la
    política de privacidad. Pensado para responder preguntas de negocio
    ("¿qué se busca sin resultados?", "¿qué se agrega al carrito?"), no para
    trackear personas."""

    TIPO_CHOICES = [
        ('page_view',               'Vista de página'),
        ('busqueda',                'Búsqueda'),
        ('busqueda_sin_resultados', 'Búsqueda sin resultados'),
        ('agregar_carrito',         'Agregar al carrito'),
        ('checkout_iniciado',       'Checkout iniciado'),
        ('pedido_creado',           'Pedido creado'),
    ]

    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES, db_index=True, verbose_name='Tipo de evento')
    ruta = models.CharField(max_length=255, blank=True, verbose_name='Ruta')
    producto_id = models.PositiveIntegerField(null=True, blank=True, verbose_name='ID de producto')
    termino_busqueda = models.CharField(max_length=200, blank=True, verbose_name='Término de búsqueda')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Fecha')

    class Meta:
        verbose_name = 'Evento de métrica'
        verbose_name_plural = 'Eventos de métrica'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_tipo_display()} — {self.created_at:%Y-%m-%d %H:%M}'
