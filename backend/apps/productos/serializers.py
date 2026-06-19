from rest_framework import serializers
from .models import Producto, Categoria


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'slug', 'icono', 'orden']


class ProductoPublicoSerializer(serializers.ModelSerializer):
    stock_disponible = serializers.IntegerField(read_only=True)
    imagen_url = serializers.SerializerMethodField()
    categoria_slug = serializers.SlugRelatedField(
        source='categoria', slug_field='slug', read_only=True
    )
    categoria_nombre = serializers.CharField(
        source='categoria.nombre', read_only=True, default=None
    )

    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'descripcion', 'precio', 'slug',
                  'imagen_url', 'stock_disponible', 'activo',
                  'categoria_slug', 'categoria_nombre']

    def get_imagen_url(self, obj):
        request = self.context.get('request')
        if obj.imagen:
            return request.build_absolute_uri(obj.imagen.url) if request else obj.imagen.url
        return None


class ProductoAdminSerializer(serializers.ModelSerializer):
    stock_disponible = serializers.IntegerField(read_only=True)
    imagen_url = serializers.SerializerMethodField()
    imagen = serializers.ImageField(required=False, allow_null=True)
    categoria_nombre = serializers.CharField(
        source='categoria.nombre', read_only=True, default=None
    )

    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'descripcion', 'precio', 'stock',
                  'slug', 'imagen', 'imagen_url', 'stock_disponible',
                  'activo', 'categoria', 'categoria_nombre', 'created_at']
        read_only_fields = ['slug', 'created_at']

    def get_imagen_url(self, obj):
        request = self.context.get('request')
        if obj.imagen:
            return request.build_absolute_uri(obj.imagen.url) if request else obj.imagen.url
        return None
