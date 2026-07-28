from rest_framework import serializers
from .models import Producto, Categoria
from .validators import validar_imagen_producto


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'slug', 'icono', 'descripcion', 'orden']


def _stock_disponible(obj):
    """Lee el valor anotado por `con_disponibilidad()` si está presente
    (listados); si no, cae a la property de una sola instancia (detalle,
    resultado de un create/update)."""
    anotado = getattr(obj, 'stock_disponible_anotado', None)
    return anotado if anotado is not None else obj.stock_disponible


def _stock_reservado(obj):
    anotado = getattr(obj, 'stock_reservado', None)
    if anotado is not None:
        return anotado
    return max(0, obj.stock - obj.stock_disponible)


def _disponibilidad(obj):
    """Estado visual para las tarjetas de producto: agotado (stock real 0),
    reservado_temporalmente (hay stock real pero todo está reservado por
    otros carritos en curso), ultimas_unidades (poco disponible) o disponible.
    Umbral de "últimas unidades" (<=3) alineado con el color usado en el
    admin de Django (ProductoAdmin.stock_disp)."""
    disponible = _stock_disponible(obj)
    if obj.stock <= 0:
        return 'agotado'
    if disponible <= 0:
        return 'reservado_temporalmente'
    if disponible <= 3:
        return 'ultimas_unidades'
    return 'disponible'


class ProductoPublicoSerializer(serializers.ModelSerializer):
    stock_disponible = serializers.SerializerMethodField()
    disponibilidad = serializers.SerializerMethodField()
    imagen_url = serializers.SerializerMethodField()
    imagen_thumbnail_url = serializers.SerializerMethodField()
    categoria_slug = serializers.SlugRelatedField(
        source='categoria', slug_field='slug', read_only=True
    )
    categoria_nombre = serializers.CharField(
        source='categoria.nombre', read_only=True, default=None
    )

    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'descripcion', 'precio', 'slug',
                  'imagen_url', 'imagen_thumbnail_url', 'stock_disponible', 'disponibilidad', 'activo',
                  'categoria_slug', 'categoria_nombre']

    def get_stock_disponible(self, obj):
        return _stock_disponible(obj)

    def get_disponibilidad(self, obj):
        return _disponibilidad(obj)

    def get_imagen_url(self, obj):
        request = self.context.get('request')
        if obj.imagen:
            return request.build_absolute_uri(obj.imagen.url) if request else obj.imagen.url
        return None

    def get_imagen_thumbnail_url(self, obj):
        request = self.context.get('request')
        # Si por algún motivo no hay miniatura generada, se cae a la imagen
        # completa antes que dejar la tarjeta sin imagen.
        archivo = obj.imagen_thumbnail or obj.imagen
        if archivo:
            return request.build_absolute_uri(archivo.url) if request else archivo.url
        return None


class ProductoAdminSerializer(serializers.ModelSerializer):
    stock_disponible = serializers.SerializerMethodField()
    stock_reservado = serializers.SerializerMethodField()
    imagen_url = serializers.SerializerMethodField()
    imagen_thumbnail_url = serializers.SerializerMethodField()
    imagen = serializers.ImageField(required=False, allow_null=True, validators=[validar_imagen_producto])
    categoria_nombre = serializers.CharField(
        source='categoria.nombre', read_only=True, default=None
    )

    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'descripcion', 'precio', 'stock',
                  'slug', 'imagen', 'imagen_url', 'imagen_thumbnail_url',
                  'stock_reservado', 'stock_disponible',
                  'activo', 'categoria', 'categoria_nombre', 'created_at']
        read_only_fields = ['slug', 'created_at']

    def get_stock_disponible(self, obj):
        return _stock_disponible(obj)

    def get_stock_reservado(self, obj):
        return _stock_reservado(obj)

    def get_imagen_url(self, obj):
        request = self.context.get('request')
        if obj.imagen:
            return request.build_absolute_uri(obj.imagen.url) if request else obj.imagen.url
        return None

    def get_imagen_thumbnail_url(self, obj):
        request = self.context.get('request')
        archivo = obj.imagen_thumbnail or obj.imagen
        if archivo:
            return request.build_absolute_uri(archivo.url) if request else archivo.url
        return None
