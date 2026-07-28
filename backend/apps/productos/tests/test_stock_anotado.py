from datetime import timedelta

from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from apps.productos.models import Producto, Categoria
from apps.pedidos.models import Pedido, ItemPedido
from apps.pedidos.services import PedidoService


def _make_producto(nombre='Test', precio=500, stock=10):
    cat, _ = Categoria.objects.get_or_create(nombre='Test', slug='test', defaults={'activo': True})
    return Producto.objects.create(nombre=nombre, precio=precio, stock=stock, categoria=cat, activo=True)


class ConDisponibilidadTest(TestCase):
    """`Producto.objects.con_disponibilidad()` debe dar el mismo resultado que
    la property `stock_disponible`, pero anotado (sin N+1) para listados."""

    def setUp(self):
        self.p = _make_producto(stock=10)

    def test_sin_reservas_igual_al_stock(self):
        obj = Producto.objects.con_disponibilidad().get(pk=self.p.pk)
        self.assertEqual(obj.stock_reservado, 0)
        self.assertEqual(obj.stock_disponible_anotado, 10)

    def test_descuenta_reservas_pendientes_vigentes(self):
        PedidoService.crear_reserva([{'producto_id': self.p.id, 'cantidad': 4}], '', '', '', '')
        obj = Producto.objects.con_disponibilidad().get(pk=self.p.pk)
        self.assertEqual(obj.stock_reservado, 4)
        self.assertEqual(obj.stock_disponible_anotado, 6)
        self.assertEqual(obj.stock_disponible_anotado, self.p.stock_disponible)

    def test_reserva_vencida_no_descuenta(self):
        pedido = Pedido.objects.create(
            estado='pendiente', total=self.p.precio,
            expires_at=timezone.now() - timedelta(hours=2),
        )
        ItemPedido.objects.create(pedido=pedido, producto=self.p, cantidad=3, precio_unitario=self.p.precio)
        obj = Producto.objects.con_disponibilidad().get(pk=self.p.pk)
        self.assertEqual(obj.stock_disponible_anotado, 10)

    def test_pedido_cancelado_no_descuenta(self):
        pedido = PedidoService.crear_reserva([{'producto_id': self.p.id, 'cantidad': 3}], '', '', '', '')
        PedidoService.cancelar_pedido(pedido.id)
        obj = Producto.objects.con_disponibilidad().get(pk=self.p.pk)
        self.assertEqual(obj.stock_disponible_anotado, 10)

    def test_nunca_negativo_aunque_reservado_supere_stock(self):
        # Caso borde defensivo: si por algún motivo lo reservado superara el
        # stock real (no debería pasar por las validaciones de crear_reserva),
        # el disponible anotado igual se clampea a 0, igual que la property.
        pedido = Pedido.objects.create(
            estado='pendiente', total=self.p.precio,
            expires_at=timezone.now() + timedelta(hours=1),
        )
        ItemPedido.objects.create(pedido=pedido, producto=self.p, cantidad=999, precio_unitario=self.p.precio)
        obj = Producto.objects.con_disponibilidad().get(pk=self.p.pk)
        self.assertEqual(obj.stock_disponible_anotado, 0)

    def test_no_genera_una_consulta_por_producto_en_un_listado(self):
        for i in range(5):
            _make_producto(nombre=f'Prod {i}', stock=5)

        with CaptureQueriesContext(connection) as ctx:
            productos = list(
                Producto.objects.con_disponibilidad().select_related('categoria').all()
            )
            for p in productos:
                # Acceder a los valores anotados no debe disparar queries extra.
                _ = (p.stock_reservado, p.stock_disponible_anotado)

        # Una sola consulta (con el JOIN + agregación) para todo el listado,
        # sin importar cuántos productos haya.
        self.assertEqual(len(ctx.captured_queries), 1)
