from django.urls import path
from .views import registrar_evento

urlpatterns = [
    path('metrica/', registrar_evento, name='metrica-registrar'),
]
