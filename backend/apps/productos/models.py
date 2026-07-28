import uuid
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import models
from django.db.models import Sum, F, Q
from django.db.models.functions import Coalesce, Greatest
from django.utils import timezone
from django.utils.text import slugify

from .validators import validar_imagen_producto

IMAGEN_DIMENSION_MAXIMA = 1600  # px, lado más largo
MINIATURA_DIMENSION = 400       # px, lado más largo


class Categoria(models.Model):
    nombre = models.CharField(max_length=100, verbose_name='Nombre')
    slug   = models.SlugField(unique=True, max_length=120, blank=True, verbose_name='Slug')
    icono  = models.CharField(max_length=10, blank=True, verbose_name='Ícono (emoji)')
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    orden  = models.PositiveIntegerField(default=0, verbose_name='Orden')
    activo = models.BooleanField(default=True, verbose_name='Activo')

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['activo'], name='categoria_activo_idx'),
        ]

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)


class ProductoQuerySet(models.QuerySet):
    def con_disponibilidad(self):
        """Anota `stock_reservado` y `stock_disponible_anotado` calculados en
        una sola consulta (vía Sum/Coalesce/Greatest), para evitar la
        consulta N+1 que implica leer `Producto.stock_disponible` (la
        property) producto por producto en un listado.

        Se usa un nombre distinto a la property `stock_disponible` para el
        valor "disponible" porque Django no puede hacer `setattr` de una
        anotación sobre un nombre que ya es una property de solo lectura.
        """
        ahora = timezone.now()
        reservado_vigente = Q(items__pedido__estado='pendiente', items__pedido__expires_at__gt=ahora)
        return self.annotate(
            stock_reservado=Coalesce(Sum('items__cantidad', filter=reservado_vigente), 0),
        ).annotate(
            stock_disponible_anotado=Greatest(F('stock') - F('stock_reservado'), 0),
        )


class Producto(models.Model):
    nombre = models.CharField(max_length=200, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    precio = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Precio')
    stock = models.PositiveIntegerField(default=0, verbose_name='Stock real')
    imagen = models.ImageField(
        upload_to='productos/', blank=True, null=True, verbose_name='Imagen',
        validators=[validar_imagen_producto],
        help_text='Se redimensiona y convierte a WebP automáticamente al guardar.',
    )
    imagen_thumbnail = models.ImageField(
        upload_to='productos/thumbs/', blank=True, null=True, editable=False,
        verbose_name='Miniatura (generada automáticamente)',
    )
    slug = models.SlugField(unique=True, max_length=220, blank=True, verbose_name='Slug')
    activo = models.BooleanField(default=True, verbose_name='Activo')
    categoria = models.ForeignKey(
        Categoria, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='productos',
        verbose_name='Categoría'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')

    objects = ProductoQuerySet.as_manager()

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['-activo', 'nombre']
        indexes = [
            models.Index(fields=['activo'], name='producto_activo_idx'),
        ]

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.nombre)
            slug = base
            n = 1
            while Producto.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base}-{n}'
                n += 1
            self.slug = slug

        # Si esta imagen reemplaza una anterior, se borran los archivos viejos
        # (imagen + miniatura) del storage una vez que el guardado sea exitoso.
        archivos_a_borrar = []
        if self.pk:
            anterior = Producto.objects.filter(pk=self.pk).only('id', 'imagen', 'imagen_thumbnail').first()
            if anterior and anterior.imagen and anterior.imagen.name != (self.imagen.name if self.imagen else None):
                archivos_a_borrar.append(anterior.imagen.name)
                if anterior.imagen_thumbnail:
                    archivos_a_borrar.append(anterior.imagen_thumbnail.name)

        # `_committed=False` = archivo recién subido, todavía no escrito a
        # storage → es el momento de procesarlo (resize + WebP + miniatura).
        # Si es una instancia ya guardada sin cambios de imagen, no se reprocesa.
        if self.imagen and not self.imagen._committed:
            self._procesar_imagen()

        super().save(*args, **kwargs)

        for nombre_archivo in archivos_a_borrar:
            default_storage.delete(nombre_archivo)

    def delete(self, *args, **kwargs):
        archivos = [f.name for f in (self.imagen, self.imagen_thumbnail) if f]
        resultado = super().delete(*args, **kwargs)
        for nombre_archivo in archivos:
            default_storage.delete(nombre_archivo)
        return resultado

    def _procesar_imagen(self):
        """Corrige orientación EXIF, redimensiona a un máximo razonable y
        convierte a WebP; genera además una miniatura para catálogo/grillas."""
        from PIL import Image, ImageOps

        imagen_original = Image.open(self.imagen)
        imagen_original = ImageOps.exif_transpose(imagen_original)
        if imagen_original.mode not in ('RGB', 'RGBA'):
            imagen_original = imagen_original.convert('RGB')

        principal = imagen_original.copy()
        principal.thumbnail((IMAGEN_DIMENSION_MAXIMA, IMAGEN_DIMENSION_MAXIMA), Image.LANCZOS)
        buffer_principal = BytesIO()
        principal.save(buffer_principal, format='WEBP', quality=85)

        miniatura = imagen_original.copy()
        miniatura.thumbnail((MINIATURA_DIMENSION, MINIATURA_DIMENSION), Image.LANCZOS)
        buffer_miniatura = BytesIO()
        miniatura.save(buffer_miniatura, format='WEBP', quality=80)

        nombre_archivo = f'{uuid.uuid4().hex}.webp'
        # save(..., save=False): escribe al storage ya mismo, sin disparar
        # otro Model.save() (evita recursión — el save() de afuera continúa
        # normalmente después de esto).
        self.imagen.save(nombre_archivo, ContentFile(buffer_principal.getvalue()), save=False)
        self.imagen_thumbnail.save(nombre_archivo, ContentFile(buffer_miniatura.getvalue()), save=False)

    @property
    def stock_disponible(self):
        """stock real − reservas pendientes no vencidas, para una única
        instancia (una consulta extra). Para listados, usar
        `Producto.objects.con_disponibilidad()` y leer `stock_disponible_anotado`
        para evitar N+1 — ver `ProductoQuerySet.con_disponibilidad`."""
        from apps.pedidos.models import ItemPedido
        reservado = ItemPedido.objects.filter(
            pedido__estado='pendiente',
            pedido__expires_at__gt=timezone.now(),
            producto=self,
        ).aggregate(total=Sum('cantidad'))['total'] or 0
        return max(0, self.stock - reservado)
