from django.test import TestCase
from django.utils import timezone
from datetime import timedelta

from apps.productos.models import Producto, Categoria
from apps.pedidos.models import Pedido, ItemPedido
from apps.pedidos.services import PedidoService


def _make_producto(nombre='Test', precio=500, stock=5, activo=True):
    cat, _ = Categoria.objects.get_or_create(nombre='Test', slug='test', defaults={'activo': True})
    return Producto.objects.create(nombre=nombre, precio=precio, stock=stock, categoria=cat, activo=activo)


class CrearReservaTest(TestCase):
    """Tests de PedidoService.crear_reserva."""

    def setUp(self):
        self.p = _make_producto()

    def _reservar(self, cantidad=1, **kwargs):
        return PedidoService.crear_reserva(
            [{'producto_id': self.p.id, 'cantidad': cantidad}],
            kwargs.get('nombre', ''), '', '', ''
        )

    def test_crea_pedido_en_estado_pendiente(self):
        pedido = self._reservar(1)
        self.assertEqual(pedido.estado, 'pendiente')

    def test_crea_item_con_cantidad_correcta(self):
        pedido = self._reservar(3)
        self.assertEqual(pedido.items.count(), 1)
        self.assertEqual(pedido.items.first().cantidad, 3)

    def test_precio_unitario_igual_al_precio_del_producto(self):
        pedido = self._reservar(2)
        item = pedido.items.first()
        self.assertEqual(float(item.precio_unitario), float(self.p.precio))

    def test_total_calculado_correctamente(self):
        pedido = self._reservar(3)
        self.assertEqual(float(pedido.total), float(self.p.precio) * 3)

    def test_guarda_datos_del_cliente(self):
        pedido = PedidoService.crear_reserva(
            [{'producto_id': self.p.id, 'cantidad': 1}],
            'Ana García', 'ana@mail.com', '1122334455', 'Calle Falsa 123'
        )
        self.assertEqual(pedido.cliente_nombre, 'Ana García')
        self.assertEqual(pedido.cliente_email, 'ana@mail.com')
        self.assertEqual(pedido.cliente_telefono, '1122334455')
        self.assertEqual(pedido.cliente_direccion, 'Calle Falsa 123')

    def test_expires_at_es_en_una_hora(self):
        antes = timezone.now()
        pedido = self._reservar(1)
        despues = timezone.now()
        self.assertGreater(pedido.expires_at, antes + timedelta(minutes=59))
        self.assertLess(pedido.expires_at, despues + timedelta(minutes=61))

    def test_falla_si_stock_insuficiente(self):
        with self.assertRaises(ValueError):
            self._reservar(cantidad=self.p.stock + 1)

    def test_falla_si_cantidad_es_cero(self):
        with self.assertRaises(ValueError):
            self._reservar(cantidad=0)

    def test_falla_si_producto_inactivo(self):
        inactivo = _make_producto(nombre='Inactivo', activo=False)
        with self.assertRaises(ValueError):
            PedidoService.crear_reserva([{'producto_id': inactivo.id, 'cantidad': 1}], '', '', '', '')

    def test_falla_si_producto_no_existe(self):
        with self.assertRaises(ValueError):
            PedidoService.crear_reserva([{'producto_id': 99999, 'cantidad': 1}], '', '', '', '')

    def test_falla_con_line_items_vacios(self):
        with self.assertRaises((ValueError, Exception)):
            PedidoService.crear_reserva([], '', '', '', '')

    def test_multiples_productos_en_un_pedido(self):
        p2 = _make_producto(nombre='Segundo', precio=300, stock=10)
        pedido = PedidoService.crear_reserva([
            {'producto_id': self.p.id, 'cantidad': 2},
            {'producto_id': p2.id,     'cantidad': 1},
        ], '', '', '', '')
        self.assertEqual(pedido.items.count(), 2)
        self.assertEqual(float(pedido.total), float(self.p.precio) * 2 + float(p2.precio))


class StockDisponibleTest(TestCase):
    """Tests de Producto.stock_disponible teniendo en cuenta reservas."""

    def setUp(self):
        self.p = _make_producto(stock=10)

    def test_stock_disponible_sin_reservas_es_igual_al_stock(self):
        self.assertEqual(self.p.stock_disponible, 10)

    def test_stock_disponible_descuenta_reservas_pendientes_vigentes(self):
        PedidoService.crear_reserva([{'producto_id': self.p.id, 'cantidad': 4}], '', '', '', '')
        self.p.refresh_from_db()
        self.assertEqual(self.p.stock_disponible, 6)

    def test_reserva_vencida_no_descuenta_del_stock(self):
        # Crear una reserva expirada manualmente
        pedido = Pedido.objects.create(
            estado='pendiente',
            total=self.p.precio,
            expires_at=timezone.now() - timedelta(hours=2)
        )
        ItemPedido.objects.create(pedido=pedido, producto=self.p, cantidad=3, precio_unitario=self.p.precio)
        self.p.refresh_from_db()
        self.assertEqual(self.p.stock_disponible, 10)

    def test_pedido_cancelado_no_descuenta_del_stock(self):
        pedido = PedidoService.crear_reserva([{'producto_id': self.p.id, 'cantidad': 3}], '', '', '', '')
        PedidoService.cancelar_pedido(pedido.id)
        self.p.refresh_from_db()
        self.assertEqual(self.p.stock_disponible, 10)

    def test_multiples_reservas_se_acumulan(self):
        PedidoService.crear_reserva([{'producto_id': self.p.id, 'cantidad': 3}], '', '', '', '')
        PedidoService.crear_reserva([{'producto_id': self.p.id, 'cantidad': 2}], '', '', '', '')
        self.p.refresh_from_db()
        self.assertEqual(self.p.stock_disponible, 5)

    def test_no_puede_reservar_mas_del_stock_disponible(self):
        PedidoService.crear_reserva([{'producto_id': self.p.id, 'cantidad': 8}], '', '', '', '')
        with self.assertRaises(ValueError):
            PedidoService.crear_reserva([{'producto_id': self.p.id, 'cantidad': 5}], '', '', '', '')


class ConfirmarPedidoTest(TestCase):
    """Tests de PedidoService.confirmar_pedido."""

    def setUp(self):
        self.p = _make_producto(stock=10)
        self.pedido = PedidoService.crear_reserva(
            [{'producto_id': self.p.id, 'cantidad': 3}], '', '', '', ''
        )

    def test_confirmar_cambia_estado_a_confirmado(self):
        PedidoService.confirmar_pedido(self.pedido.id)
        self.pedido.refresh_from_db()
        self.assertEqual(self.pedido.estado, 'confirmado')

    def test_confirmar_descuenta_stock_real(self):
        PedidoService.confirmar_pedido(self.pedido.id)
        self.p.refresh_from_db()
        self.assertEqual(self.p.stock, 7)

    def test_confirmar_pedido_inexistente_lanza_excepcion(self):
        with self.assertRaises(Pedido.DoesNotExist):
            PedidoService.confirmar_pedido(99999)

    def test_no_se_puede_confirmar_dos_veces(self):
        PedidoService.confirmar_pedido(self.pedido.id)
        with self.assertRaises(ValueError):
            PedidoService.confirmar_pedido(self.pedido.id)


class CancelarPedidoTest(TestCase):
    """Tests de PedidoService.cancelar_pedido."""

    def setUp(self):
        self.p = _make_producto(stock=5)
        self.pedido = PedidoService.crear_reserva(
            [{'producto_id': self.p.id, 'cantidad': 2}], '', '', '', ''
        )

    def test_cancelar_cambia_estado_a_cancelado(self):
        PedidoService.cancelar_pedido(self.pedido.id)
        self.pedido.refresh_from_db()
        self.assertEqual(self.pedido.estado, 'cancelado')

    def test_no_se_puede_cancelar_pedido_confirmado(self):
        PedidoService.confirmar_pedido(self.pedido.id)
        with self.assertRaises(ValueError):
            PedidoService.cancelar_pedido(self.pedido.id)

    def test_cancelar_pedido_inexistente_lanza_excepcion(self):
        with self.assertRaises(Pedido.DoesNotExist):
            PedidoService.cancelar_pedido(99999)
