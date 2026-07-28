from django.contrib import admin
from .models import EventoMetrica


@admin.register(EventoMetrica)
class EventoMetricaAdmin(admin.ModelAdmin):
    list_display = ['tipo', 'ruta', 'termino_busqueda', 'producto_id', 'created_at']
    list_filter = ['tipo', 'created_at']
    search_fields = ['ruta', 'termino_busqueda']
    ordering = ['-created_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
