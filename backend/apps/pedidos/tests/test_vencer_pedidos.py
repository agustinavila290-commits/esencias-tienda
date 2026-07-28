from datetime import timedelta

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from apps.productos.models import Producto, Categoria
from apps.pedidos.models import Pedido, ItemPedido


def _make_producto(nombre='Test', precio=500, stock=5):
    cat, _ = Categoria.objects.get_or_create(nombre='Test', slug='test', defaults={'activo': True})
    return Producto.objects.create(nombre=nombre, precio=precio, stock=stock, categoria=cat, activo=True)


def _make_pedido(producto, estado='pendiente', expires_at=None, cantidad=1):
    pedido = Pedido.objects.create(
        estado=estado,
        total=producto.precio * cantidad,
        expires_at=expires_at or timezone.now() + timedelta(hours=1),
    )
    ItemPedido.objects.create(pedido=pedido, producto=producto, cantidad=cantidad, precio_unitario=producto.precio)
    return pedido


class VencerPedidosCommandTest(TestCase):

    def setUp(self):
        self.p = _make_producto(stock=10)

    def test_marca_como_vencido_pedido_pendiente_expirado(self):
        pedido = _make_pedido(self.p, estado='pendiente', expires_at=timezone.now() - timedelta(minutes=1))
        call_command('vencer_pedidos')
        pedido.refresh_from_db()
        self.assertEqual(pedido.estado, 'vencido')

    def test_registra_en_historial(self):
        pedido = _make_pedido(self.p, estado='pendiente', expires_at=timezone.now() - timedelta(minutes=1))
        call_command('vencer_pedidos')
        self.assertTrue(pedido.historial.filter(estado='vencido').exists())

    def test_no_toca_pedido_pendiente_no_vencido(self):
        pedido = _make_pedido(self.p, estado='pendiente', expires_at=timezone.now() + timedelta(minutes=30))
        call_command('vencer_pedidos')
        pedido.refresh_from_db()
        self.assertEqual(pedido.estado, 'pendiente')

    def test_no_toca_pedido_confirmado_aunque_este_expirado(self):
        pedido = _make_pedido(self.p, estado='confirmado', expires_at=timezone.now() - timedelta(hours=2))
        call_command('vencer_pedidos')
        pedido.refresh_from_db()
        self.assertEqual(pedido.estado, 'confirmado')

    def test_no_toca_pedido_cancelado(self):
        pedido = _make_pedido(self.p, estado='cancelado', expires_at=timezone.now() - timedelta(hours=2))
        call_command('vencer_pedidos')
        pedido.refresh_from_db()
        self.assertEqual(pedido.estado, 'cancelado')

    def test_no_toca_pedido_entregado(self):
        pedido = _make_pedido(self.p, estado='entregado', expires_at=timezone.now() - timedelta(hours=2))
        call_command('vencer_pedidos')
        pedido.refresh_from_db()
        self.assertEqual(pedido.estado, 'entregado')

    def test_no_descuenta_stock_real(self):
        pedido = _make_pedido(self.p, estado='pendiente', expires_at=timezone.now() - timedelta(minutes=1), cantidad=3)
        call_command('vencer_pedidos')
        self.p.refresh_from_db()
        self.assertEqual(self.p.stock, 10)

    def test_idempotente_correr_dos_veces(self):
        pedido = _make_pedido(self.p, estado='pendiente', expires_at=timezone.now() - timedelta(minutes=1))
        call_command('vencer_pedidos')
        call_command('vencer_pedidos')
        pedido.refresh_from_db()
        self.assertEqual(pedido.estado, 'vencido')
        # Solo debe existir una entrada de historial "vencido", no duplicada.
        self.assertEqual(pedido.historial.filter(estado='vencido').count(), 1)

    def test_procesa_multiples_pedidos_vencidos_a_la_vez(self):
        p2 = _make_pedido(self.p, estado='pendiente', expires_at=timezone.now() - timedelta(minutes=5))
        p3 = _make_pedido(self.p, estado='pendiente', expires_at=timezone.now() - timedelta(minutes=1))
        call_command('vencer_pedidos')
        p2.refresh_from_db()
        p3.refresh_from_db()
        self.assertEqual(p2.estado, 'vencido')
        self.assertEqual(p3.estado, 'vencido')

    def test_stock_disponible_libera_reserva_de_pedido_vencido(self):
        pedido = _make_pedido(self.p, estado='pendiente', expires_at=timezone.now() - timedelta(minutes=1), cantidad=4)
        call_command('vencer_pedidos')
        self.p.refresh_from_db()
        self.assertEqual(self.p.stock_disponible, 10)
