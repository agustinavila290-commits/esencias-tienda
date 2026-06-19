from django.contrib import admin
from django.utils.html import format_html
from .models import Producto, Categoria


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['icono', 'nombre', 'slug', 'orden', 'activo']
    list_editable = ['orden', 'activo']
    prepopulated_fields = {'slug': ('nombre',)}
    ordering = ['orden', 'nombre']


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'categoria', 'precio_fmt', 'stock', 'stock_disp', 'activo', 'imagen_preview']
    list_editable = ['activo']
    list_filter = ['activo', 'categoria']
    search_fields = ['nombre', 'slug']
    readonly_fields = ['slug', 'created_at', 'imagen_preview']
    ordering = ['-activo', 'nombre']

    def precio_fmt(self, obj):
        return f'${obj.precio:,.0f}'.replace(',', '.')
    precio_fmt.short_description = 'Precio'

    def stock_disp(self, obj):
        disp = obj.stock_disponible
        color = 'green' if disp > 3 else ('orange' if disp > 0 else 'red')
        return format_html('<span style="color:{}">{}</span>', color, disp)
    stock_disp.short_description = 'Disponible'

    def imagen_preview(self, obj):
        if obj.imagen:
            return format_html('<img src="{}" style="max-height:80px;border-radius:4px"/>', obj.imagen.url)
        return '—'
    imagen_preview.short_description = 'Vista previa'
