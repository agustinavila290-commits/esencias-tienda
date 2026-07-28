from django.test import TestCase
from rest_framework.test import APIClient

from apps.productos.models import Producto, Categoria
from apps.pedidos.services import PedidoService


def _make_producto(nombre='Test', precio=500, stock=5):
    cat, _ = Categoria.objects.get_or_create(nombre='Test', slug='test', defaults={'activo': True})
    return Producto.objects.create(nombre=nombre, precio=precio, stock=stock, categoria=cat, activo=True)


class PedidoSeguimientoViewTest(TestCase):
    """Tests para GET /api/pedidos/<codigo>/seguimiento/?token=..."""

    def setUp(self):
        self.client = APIClient()
        self.p = _make_producto(stock=10)
        self.pedido = PedidoService.crear_reserva(
            [{'producto_id': self.p.id, 'cantidad': 2}], 'Ana', 'ana@mail.com', '', ''
        )

    def _url(self, codigo=None, token=None):
        codigo = codigo if codigo is not None else self.pedido.codigo
        url = f'/api/pedidos/{codigo}/seguimiento/'
        if token is not None:
            url += f'?token={token}'
        return url

    def test_codigo_y_token_correctos_devuelven_el_pedido(self):
        r = self.client.get(self._url(token=self.pedido.tracking_token))
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['codigo'], self.pedido.codigo)
        self.assertEqual(r.data['estado'], 'pendiente')
        self.assertEqual(len(r.data['items']), 1)

    def test_sin_token_da_400(self):
        r = self.client.get(self._url())
        self.assertEqual(r.status_code, 400)

    def test_token_incorrecto_da_404(self):
        r = self.client.get(self._url(token='00000000-0000-0000-0000-000000000000'))
        self.assertEqual(r.status_code, 404)

    def test_token_con_formato_invalido_da_404_no_500(self):
        r = self.client.get(self._url(token='no-es-un-uuid'))
        self.assertEqual(r.status_code, 404)

    def test_codigo_correcto_pero_de_otro_pedido_no_filtra_datos(self):
        # Mismo código no existe para otro pedido, pero probamos que un
        # código inexistente con un token válido (de otro pedido) tampoco cuela.
        r = self.client.get(self._url(codigo='PED-NOEXISTE', token=self.pedido.tracking_token))
        self.assertEqual(r.status_code, 404)

    def test_no_expone_pedido_de_otro_cliente_sin_su_token(self):
        otro_pedido = PedidoService.crear_reserva(
            [{'producto_id': self.p.id, 'cantidad': 1}], 'Otro Cliente', '', '', ''
        )
        # Intento acceder al pedido de "Otro Cliente" con el token de Ana.
        r = self.client.get(self._url(codigo=otro_pedido.codigo, token=self.pedido.tracking_token))
        self.assertEqual(r.status_code, 404)

    def test_incluye_historial_y_tracking_token(self):
        r = self.client.get(self._url(token=self.pedido.tracking_token))
        self.assertIn('historial', r.data)
        self.assertIn('tracking_token', r.data)
