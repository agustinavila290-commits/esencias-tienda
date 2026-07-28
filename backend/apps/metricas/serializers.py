from rest_framework import serializers
from .models import EventoMetrica


class EventoMetricaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventoMetrica
        fields = ['tipo', 'ruta', 'producto_id', 'termino_busqueda']
