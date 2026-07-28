from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from apps.productos.models import Producto, Categoria
from apps.pedidos.services import PedidoService


def _make_producto(stock=1000):
    cat, _ = Categoria.objects.get_or_create(nombre='Test', slug='test', defaults={'activo': True})
    return Producto.objects.create(nombre='Test', precio=100, stock=stock, categoria=cat, activo=True)


class CrearPedidoRateLimitTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.p = _make_producto()
        cache.clear()

    def tearDown(self):
        cache.clear()

    def _crear(self):
        return self.client.post('/api/pedidos/crear/', {
            'line_items': [{'producto_id': self.p.id, 'cantidad': 1}],
        }, format='json')

    def test_permite_hasta_el_limite(self):
        for _ in range(20):
            r = self._crear()
            self.assertEqual(r.status_code, 201)

    def test_bloquea_pasado_el_limite(self):
        for _ in range(20):
            self._crear()
        r = self._crear()
        self.assertEqual(r.status_code, 429)


class PedidoSeguimientoRateLimitTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.p = _make_producto()
        self.pedido = PedidoService.crear_reserva([{'producto_id': self.p.id, 'cantidad': 1}], '', '', '', '')
        cache.clear()

    def tearDown(self):
        cache.clear()

    def _consultar(self):
        return self.client.get(f'/api/pedidos/{self.pedido.codigo}/seguimiento/?token={self.pedido.tracking_token}')

    def test_permite_hasta_el_limite(self):
        for _ in range(30):
            r = self._consultar()
            self.assertEqual(r.status_code, 200)

    def test_bloquea_pasado_el_limite(self):
        for _ in range(30):
            self._consultar()
        r = self._consultar()
        self.assertEqual(r.status_code, 429)
