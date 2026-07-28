import logging

from django.db import transaction
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta

from .models import Pedido, ItemPedido, HistorialEstado
from apps.productos.models import Producto

logger = logging.getLogger(__name__)


class PedidoService:

    @staticmethod
    def _historial(pedido, estado, nota=''):
        HistorialEstado.objects.create(pedido=pedido, estado=estado, nota=nota)

    @staticmethod
    @transaction.atomic
    def crear_reserva(
        line_items: list,
        cliente_nombre: str = '',
        cliente_email: str = '',
        cliente_telefono: str = '',
        cliente_direccion: str = '',
    ) -> Pedido:
        errores = []
        items_validados = []

        for item in line_items:
            producto_id = item.get('producto_id')
            try:
                cantidad = int(item.get('cantidad', 0))
            except (TypeError, ValueError):
                cantidad = 0

            if not producto_id or cantidad < 1:
                errores.append('Ítem inválido: falta producto_id o cantidad.')
                continue

            try:
                producto = Producto.objects.select_for_update().get(pk=producto_id, activo=True)
            except Producto.DoesNotExist:
                errores.append(f'Producto {producto_id} no encontrado o inactivo.')
                continue

            ahora = timezone.now()
            reservado = ItemPedido.objects.filter(
                pedido__estado='pendiente',
                pedido__expires_at__gt=ahora,
                producto=producto,
            ).aggregate(total=Sum('cantidad'))['total'] or 0

            disponible = producto.stock - reservado
            if disponible < cantidad:
                errores.append(
                    f'{producto.nombre}: stock insuficiente '
                    f'(disponible: {disponible}, solicitado: {cantidad}).'
                )
                continue

            items_validados.append({
                'producto': producto,
                'cantidad': cantidad,
                'precio_unitario': producto.precio,
            })

        if errores:
            raise ValueError(errores)

        if not items_validados:
            raise ValueError(['No hay ítems válidos para procesar.'])

        total = sum(it['precio_unitario'] * it['cantidad'] for it in items_validados)

        pedido = Pedido.objects.create(
            cliente_nombre=cliente_nombre,
            cliente_email=cliente_email,
            cliente_telefono=cliente_telefono,
            cliente_direccion=cliente_direccion,
            total=total,
            expires_at=timezone.now() + timedelta(hours=1),
        )

        for it in items_validados:
            ItemPedido.objects.create(
                pedido=pedido,
                producto=it['producto'],
                cantidad=it['cantidad'],
                precio_unitario=it['precio_unitario'],
            )

        PedidoService._historial(pedido, 'pendiente', 'Reserva creada')
        return pedido

    @staticmethod
    @transaction.atomic
    def confirmar_pedido(pedido_id: int) -> Pedido:
        pedido = Pedido.objects.select_for_update().get(pk=pedido_id)

        if pedido.estado != 'pendiente':
            raise ValueError(f'El pedido está en estado "{pedido.get_estado_display()}" y no se puede confirmar.')

        for item in pedido.items.select_related('producto').select_for_update():
            item.producto.stock = max(0, item.producto.stock - item.cantidad)
            item.producto.save(update_fields=['stock'])

        pedido.estado = 'confirmado'
        pedido.save(update_fields=['estado'])
        PedidoService._historial(pedido, 'confirmado', 'Pedido confirmado')
        return pedido

    @staticmethod
    @transaction.atomic
    def cancelar_pedido(pedido_id: int) -> Pedido:
        pedido = Pedido.objects.select_for_update().get(pk=pedido_id)
        if pedido.estado != 'pendiente':
            raise ValueError(f'El pedido está en estado "{pedido.get_estado_display()}" y no se puede cancelar.')
        pedido.estado = 'cancelado'
        pedido.save(update_fields=['estado'])
        PedidoService._historial(pedido, 'cancelado', 'Pedido cancelado')
        return pedido

    @staticmethod
    @transaction.atomic
    def marcar_enviado(pedido_id: int, nota: str = '') -> Pedido:
        pedido = Pedido.objects.select_for_update().get(pk=pedido_id)
        if pedido.estado != 'confirmado':
            raise ValueError(f'Solo se pueden enviar pedidos confirmados. Estado actual: "{pedido.get_estado_display()}".')
        pedido.estado = 'enviado'
        pedido.save(update_fields=['estado'])
        PedidoService._historial(pedido, 'enviado', nota or 'Pedido enviado')
        return pedido

    @staticmethod
    @transaction.atomic
    def marcar_entregado(pedido_id: int, nota: str = '') -> Pedido:
        pedido = Pedido.objects.select_for_update().get(pk=pedido_id)
        if pedido.estado != 'enviado':
            raise ValueError(f'Solo se pueden entregar pedidos enviados. Estado actual: "{pedido.get_estado_display()}".')
        pedido.estado = 'entregado'
        pedido.save(update_fields=['estado'])
        PedidoService._historial(pedido, 'entregado', nota or 'Pedido entregado')
        return pedido

    @staticmethod
    def confirmar_pedido_tardio(pedido_id: int, nota: str = '') -> Pedido:
        """Confirma un pedido `vencido` o `cancelado` cuyo pago de Mercado Pago
        se aprobó después de que la reserva expiró (o fue cancelada).

        Política: solo se confirma —y solo entonces se descuenta stock real—
        si todavía hay stock real suficiente para cubrir el pedido completo.
        Si no lo hay, el pedido queda como estaba (no se vende de más) y se
        deja constancia en el historial para que el negocio lo resuelva a
        mano (reembolso manual desde Mercado Pago, contactar al cliente, etc.).
        """
        stock_faltante = None

        with transaction.atomic():
            pedido = Pedido.objects.select_for_update().get(pk=pedido_id)

            if pedido.estado not in ('vencido', 'cancelado'):
                raise ValueError(
                    f'confirmar_pedido_tardio solo aplica a pedidos vencidos o cancelados. '
                    f'Estado actual: "{pedido.get_estado_display()}".'
                )

            items = list(pedido.items.select_related('producto').select_for_update())
            faltantes = [item for item in items if item.producto.stock < item.cantidad]

            if not faltantes:
                for item in items:
                    item.producto.stock = max(0, item.producto.stock - item.cantidad)
                    item.producto.save(update_fields=['stock'])

                pedido.estado = 'confirmado'
                pedido.save(update_fields=['estado'])
                PedidoService._historial(
                    pedido, 'confirmado',
                    nota or 'Pago de Mercado Pago aprobado tardíamente; confirmado con stock disponible'
                )
                return pedido

            # Hay stock insuficiente: no confirmamos y no tocamos stock. Se sale de
            # este atomic sin haber escrito nada, para poder registrar el rechazo
            # en una transacción propia (ver más abajo) que sí sobreviva al
            # ValueError que levantamos a continuación.
            stock_faltante = ', '.join(
                f'{it.producto.nombre} (necesita {it.cantidad}, hay {it.producto.stock})'
                for it in faltantes
            )

        PedidoService._historial(
            pedido, pedido.estado,
            f'Pago de Mercado Pago aprobado tardíamente pero sin stock suficiente '
            f'({stock_faltante}). Requiere revisión manual (reembolso o reposición).'
        )
        raise ValueError(f'Stock insuficiente para confirmar tardíamente: {stock_faltante}')

    @staticmethod
    def crear_preferencia_mp(pedido_id: int) -> str:
        import mercadopago
        from django.conf import settings

        pedido = Pedido.objects.prefetch_related('items__producto').get(pk=pedido_id)

        if pedido.estado != 'pendiente':
            raise ValueError('Solo se puede crear preferencia para pedidos pendientes.')

        sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)

        items = [
            {
                'title': item.producto.nombre,
                'quantity': item.cantidad,
                'unit_price': float(item.precio_unitario),
                'currency_id': 'ARS',
            }
            for item in pedido.items.all()
        ]

        preference_data = {
            'items': items,
            'external_reference': pedido.codigo,
            'back_urls': {
                'success': f'{settings.FRONTEND_URL}/pago-exitoso?pedido={pedido.codigo}',
                'failure': f'{settings.FRONTEND_URL}/pago-cancelado?pedido={pedido.codigo}',
                'pending': f'{settings.FRONTEND_URL}/pago-pendiente?pedido={pedido.codigo}',
            },
            'auto_return': 'approved',
            'notification_url': f'{settings.BACKEND_URL}/api/pedidos/mp-webhook/',
            'statement_descriptor': 'Esencias de la naturaleza',
        }

        result = sdk.preference().create(preference_data)

        if result['status'] not in (200, 201):
            raise ValueError(f'Error MP: {result.get("response")}')

        response = result['response']
        init_point = response.get('sandbox_init_point') if settings.DEBUG else response.get('init_point')

        pedido.mp_preference_id = response['id']
        pedido.metodo_pago = 'mercadopago'
        pedido.save(update_fields=['mp_preference_id', 'metodo_pago'])

        return init_point

    @staticmethod
    def procesar_webhook_mp(payment_id: str) -> None:
        import mercadopago
        from django.conf import settings

        sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)
        result = sdk.payment().get(payment_id)

        if result['status'] != 200:
            logger.warning('MP webhook: no se pudo consultar el pago %s (status=%s)', payment_id, result['status'])
            return

        payment = result['response']
        mp_status = payment.get('status', '')
        external_ref = payment.get('external_reference', '')

        if not external_ref:
            logger.warning('MP webhook: pago %s no trae external_reference, se ignora.', payment_id)
            return

        try:
            pedido = Pedido.objects.get(codigo=external_ref)
        except Pedido.DoesNotExist:
            logger.error(
                'MP webhook: pago %s referencia el pedido "%s" que no existe.',
                payment_id, external_ref,
            )
            return

        # Idempotencia: si ya vimos este mismo pago con este mismo estado, no repetir
        # ningún efecto secundario (confirmar/cancelar) — Mercado Pago puede reenviar
        # la misma notificación varias veces.
        ya_procesado = pedido.mp_payment_id == str(payment_id) and pedido.mp_status == mp_status
        if ya_procesado:
            logger.info(
                'MP webhook: pago %s ya había sido procesado con estado "%s" para %s, se ignora.',
                payment_id, mp_status, pedido.codigo,
            )
            return

        pedido.mp_payment_id = str(payment_id)
        pedido.mp_status = mp_status
        pedido.save(update_fields=['mp_payment_id', 'mp_status'])

        logger.info(
            'MP webhook: pedido %s -> mp_status="%s" (estado del pedido: "%s")',
            pedido.codigo, mp_status, pedido.estado,
        )

        if mp_status == 'approved':
            if pedido.estado == 'pendiente':
                PedidoService.confirmar_pedido(pedido.id)
                logger.info('MP webhook: pedido %s confirmado (pago aprobado en término).', pedido.codigo)
            elif pedido.estado in ('vencido', 'cancelado'):
                # La reserva ya no estaba vigente cuando llegó la aprobación del pago.
                # Se intenta confirmar igual, pero solo si sigue habiendo stock real
                # suficiente: nunca se vende más de lo que hay físicamente.
                try:
                    PedidoService.confirmar_pedido_tardio(
                        pedido.id, nota=f'Pago de Mercado Pago {payment_id} aprobado tardíamente'
                    )
                    logger.warning(
                        'MP webhook: pedido %s confirmado tardíamente (pago llegó después del vencimiento).',
                        pedido.codigo,
                    )
                except ValueError as e:
                    logger.error(
                        'MP webhook: pedido %s no se pudo confirmar tardíamente (%s). '
                        'Requiere revisión manual — el pago quedó registrado en el pedido.',
                        pedido.codigo, e,
                    )
            # Si ya está confirmado/enviado/entregado no hay nada más que hacer;
            # solo se actualizaron mp_payment_id / mp_status arriba.
        elif mp_status in ('cancelled', 'rejected') and pedido.estado == 'pendiente':
            PedidoService.cancelar_pedido(pedido.id)
