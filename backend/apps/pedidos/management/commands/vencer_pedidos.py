import logging

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.pedidos.models import Pedido, HistorialEstado

logger = logging.getLogger('apps.pedidos.vencer_pedidos')


class Command(BaseCommand):
    help = (
        'Marca como "vencido" los pedidos pendientes cuya reserva ya expiró. '
        'No descuenta stock real ni modifica pedidos en otros estados. '
        'Es idempotente: correrlo varias veces (ej. desde cron) es seguro.'
    )

    def handle(self, *args, **options):
        ahora = timezone.now()

        with transaction.atomic():
            # select_for_update evita que este comando y una confirmación/cancelación
            # concurrente (admin o webhook de MP) procesen el mismo pedido a la vez.
            pendientes_vencidos = list(
                Pedido.objects
                .select_for_update()
                .filter(estado='pendiente', expires_at__lte=ahora)
            )

            codigos = []
            for pedido in pendientes_vencidos:
                pedido.estado = 'vencido'
                pedido.save(update_fields=['estado'])
                HistorialEstado.objects.create(
                    pedido=pedido,
                    estado='vencido',
                    nota='Reserva vencida automáticamente (vencer_pedidos)',
                )
                codigos.append(pedido.codigo)

        if codigos:
            logger.info('Pedidos vencidos: %s (total=%d)', ', '.join(codigos), len(codigos))
            self.stdout.write(self.style.SUCCESS(f'{len(codigos)} pedido(s) marcados como vencido.'))
        else:
            logger.info('vencer_pedidos: sin pedidos pendientes vencidos para procesar.')
            self.stdout.write('No hay pedidos vencidos para procesar.')
