from django.core.exceptions import ValidationError

EXTENSIONES_PERMITIDAS = {'.jpg', '.jpeg', '.png', '.webp'}
TAMANO_MAXIMO_MB = 5
TAMANO_MAXIMO_BYTES = TAMANO_MAXIMO_MB * 1024 * 1024


def validar_imagen_producto(archivo):
    """Valida extensión y tamaño de una imagen subida para un producto.
    El procesamiento real (resize, conversión a WebP, miniatura) pasa en
    `Producto.save()` — acá solo se rechaza lo que no sea una imagen válida."""
    import os

    nombre = getattr(archivo, 'name', '') or ''
    ext = os.path.splitext(nombre)[1].lower()
    if ext not in EXTENSIONES_PERMITIDAS:
        raise ValidationError(
            f'Formato de imagen no soportado ({ext or "desconocido"}). '
            f'Usá: {", ".join(sorted(EXTENSIONES_PERMITIDAS))}.'
        )

    size = getattr(archivo, 'size', 0)
    if size and size > TAMANO_MAXIMO_BYTES:
        raise ValidationError(f'La imagen supera el tamaño máximo permitido ({TAMANO_MAXIMO_MB} MB).')
