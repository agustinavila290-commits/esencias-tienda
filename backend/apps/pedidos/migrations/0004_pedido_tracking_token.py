import uuid

from django.db import migrations, models


def poblar_tracking_tokens(apps, schema_editor):
    """Genera un UUID único para cada pedido ya existente. Se hace acá
    (RunPython) en vez de dejar que la columna se agregue directamente como
    unique+default porque un default "callable" en un AddField no está
    garantizado por todos los backends al agregar la columna en una sola
    operación (Django recomienda este patrón de 2 pasos para campos únicos
    con default dinámico sobre tablas con datos existentes)."""
    Pedido = apps.get_model('pedidos', 'Pedido')
    for pedido in Pedido.objects.all():
        pedido.tracking_token = uuid.uuid4()
        pedido.save(update_fields=['tracking_token'])


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0003_pedido_cliente_direccion_pedido_cliente_email_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedido',
            name='tracking_token',
            field=models.UUIDField(default=uuid.uuid4, editable=False, null=True),
        ),
        migrations.RunPython(poblar_tracking_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='pedido',
            name='tracking_token',
            field=models.UUIDField(
                default=uuid.uuid4, editable=False, unique=True, db_index=True,
                verbose_name='Token de seguimiento',
                help_text='Token público impredecible para consultar el pedido sin autenticarse (junto con el código).',
            ),
        ),
        migrations.AddIndex(
            model_name='pedido',
            index=models.Index(fields=['estado', 'expires_at'], name='pedido_estado_expira_idx'),
        ),
    ]
