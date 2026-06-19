from django.db import models
from django.utils.text import slugify


class Categoria(models.Model):
    nombre = models.CharField(max_length=100, verbose_name='Nombre')
    slug   = models.SlugField(unique=True, max_length=120, blank=True, verbose_name='Slug')
    icono  = models.CharField(max_length=10, blank=True, verbose_name='Ícono (emoji)')
    orden  = models.PositiveIntegerField(default=0, verbose_name='Orden')
    activo = models.BooleanField(default=True, verbose_name='Activo')

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)


class Producto(models.Model):
    nombre = models.CharField(max_length=200, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    precio = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Precio')
    stock = models.PositiveIntegerField(default=0, verbose_name='Stock real')
    imagen = models.ImageField(upload_to='productos/', blank=True, null=True, verbose_name='Imagen')
    slug = models.SlugField(unique=True, max_length=220, blank=True, verbose_name='Slug')
    activo = models.BooleanField(default=True, verbose_name='Activo')
    categoria = models.ForeignKey(
        Categoria, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='productos',
        verbose_name='Categoría'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['-activo', 'nombre']

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
        super().save(*args, **kwargs)

    @property
    def stock_disponible(self):
        """stock real − reservas pendientes no vencidas."""
        from apps.pedidos.models import ItemPedido
        from django.utils import timezone
        from django.db.models import Sum
        reservado = ItemPedido.objects.filter(
            pedido__estado='pendiente',
            pedido__expires_at__gt=timezone.now(),
            producto=self,
        ).aggregate(total=Sum('cantidad'))['total'] or 0
        return max(0, self.stock - reservado)
