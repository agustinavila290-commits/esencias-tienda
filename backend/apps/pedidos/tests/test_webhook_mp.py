from unittest.mock import patch, MagicMock

from django.test import TestCase

from apps.productos.models import Producto, Categoria
from apps.pedidos.services import PedidoService


def _make_producto(nombre='Test', precio=500, stock=5):
    cat, _ = Categoria.objects.get_or_create(nombre='Test', slug='test', defaults={'activo': True})
    return Producto.objects.create(nombre=nombre, precio=precio, stock=stock, categoria=cat, activo=True)


def _mock_sdk(mp_status, external_reference, payment_id='PAY-1'):
    """Crea un mock de mercadopago.SDK que responde con un pago dado."""
    sdk = MagicMock()
    sdk.payment.return_value.get.return_value = {
        'status': 200,
        'response': {
            'id': payment_id,
            'status': mp_status,
            'external_reference': external_reference,
        },
    }
    return sdk


class WebhookMpTest(TestCase):

    def setUp(self):
        self.p = _make_producto(stock=10)
        self.pedido = PedidoService.crear_reserva(
            [{'producto_id': self.p.id, 'cantidad': 3}], '', '', '', ''
        )

    @patch('mercadopago.SDK')
    def test_pago_aprobado_confirma_pedido_pendiente(self, mock_sdk_cls):
        mock_sdk_cls.return_value = _mock_sdk('approved', self.pedido.codigo)
        PedidoService.procesar_webhook_mp('PAY-1')
        self.pedido.refresh_from_db()
        self.p.refresh_from_db()
        self.assertEqual(self.pedido.estado, 'confirmado')
        self.assertEqual(self.p.stock, 7)

    @patch('mercadopago.SDK')
    def test_pago_rechazado_cancela_pedido_pendiente(self, mock_sdk_cls):
        mock_sdk_cls.return_value = _mock_sdk('rejected', self.pedido.codigo)
        PedidoService.procesar_webhook_mp('PAY-2')
        self.pedido.refresh_from_db()
        self.assertEqual(self.pedido.estado, 'cancelado')

    @patch('mercadopago.SDK')
    def test_webhook_repetido_con_mismo_pago_es_idempotente(self, mock_sdk_cls):
        mock_sdk_cls.return_value = _mock_sdk('approved', self.pedido.codigo, payment_id='PAY-3')
        PedidoService.procesar_webhook_mp('PAY-3')
        PedidoService.procesar_webhook_mp('PAY-3')  # MP puede reenviar la misma notificación
        self.pedido.refresh_from_db()
        self.p.refresh_from_db()
        self.assertEqual(self.pedido.estado, 'confirmado')
        self.assertEqual(self.p.stock, 7)  # no se descontó dos veces

    @patch('mercadopago.SDK')
    def test_pago_no_encontrado_no_rompe(self, mock_sdk_cls):
        mock_sdk_cls.return_value = _mock_sdk('approved', 'PED-NOEXISTE')
        try:
            PedidoService.procesar_webhook_mp('PAY-4')
        except Exception as e:
            self.fail(f'No debería lanzar excepción: {e}')

    @patch('mercadopago.SDK')
    def test_pago_aprobado_en_pedido_vencido_con_stock_confirma_tardiamente(self, mock_sdk_cls):
        self.pedido.estado = 'vencido'
        self.pedido.save(update_fields=['estado'])
        mock_sdk_cls.return_value = _mock_sdk('approved', self.pedido.codigo, payment_id='PAY-5')

        PedidoService.procesar_webhook_mp('PAY-5')

        self.pedido.refresh_from_db()
        self.p.refresh_from_db()
        self.assertEqual(self.pedido.estado, 'confirmado')
        self.assertEqual(self.p.stock, 7)

    @patch('mercadopago.SDK')
    def test_pago_aprobado_en_pedido_vencido_sin_stock_no_confirma_ni_vende_de_mas(self, mock_sdk_cls):
        self.pedido.estado = 'vencido'
        self.pedido.save(update_fields=['estado'])
        # Otro pedido ya confirmado se llevó casi todo el stock real restante.
        self.p.stock = 1
        self.p.save(update_fields=['stock'])

        mock_sdk_cls.return_value = _mock_sdk('approved', self.pedido.codigo, payment_id='PAY-6')
        PedidoService.procesar_webhook_mp('PAY-6')

        self.pedido.refresh_from_db()
        self.p.refresh_from_db()
        self.assertEqual(self.pedido.estado, 'vencido')  # no se confirma
        self.assertEqual(self.p.stock, 1)  # no se descuenta de más
        self.assertTrue(
            self.pedido.historial.filter(nota__icontains='revisión manual').exists()
        )

    @patch('mercadopago.SDK')
    def test_pago_aprobado_en_pedido_ya_confirmado_no_duplica_descuento(self, mock_sdk_cls):
        PedidoService.confirmar_pedido(self.pedido.id)
        self.p.refresh_from_db()
        stock_tras_confirmar = self.p.stock

        mock_sdk_cls.return_value = _mock_sdk('approved', self.pedido.codigo, payment_id='PAY-7')
        PedidoService.procesar_webhook_mp('PAY-7')

        self.p.refresh_from_db()
        self.assertEqual(self.p.stock, stock_tras_confirmar)
