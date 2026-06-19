"""Script para cargar productos de prueba. Correr con: python manage.py shell < scripts/cargar_datos_prueba.py"""
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.productos.models import Producto

productos = [
    {'nombre': 'Sahumerio de Lavanda', 'descripcion': 'Relajante y purificador. Ideal para meditar y descansar.', 'precio': 1500, 'stock': 20},
    {'nombre': 'Incienso de Sándalo', 'descripcion': 'Aroma suave y terroso. Perfecto para crear ambientes cálidos.', 'precio': 1200, 'stock': 15},
    {'nombre': 'Sahumerio de Rosa', 'descripcion': 'Dulce y floral. Transmite amor y bienestar.', 'precio': 1800, 'stock': 3},
    {'nombre': 'Incienso de Mirra', 'descripcion': 'Intenso y místico. Utilizado en rituales de protección.', 'precio': 2000, 'stock': 0},
]

for p in productos:
    obj, created = Producto.objects.get_or_create(nombre=p['nombre'], defaults=p)
    estado = 'Creado' if created else 'Ya existía'
    print(f'{estado}: {obj.nombre} (slug: {obj.slug})')

print(f'\nTotal productos: {Producto.objects.count()}')
