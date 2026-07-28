"""Vistas de SEO servidas en la raíz del dominio (no bajo /api/):
robots.txt y sitemap.xml. Usan datos reales de productos/categorías
activos — nunca hay que regenerarlos a mano al agregar contenido."""
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.http import require_GET

from apps.productos.models import Producto, Categoria

# Páginas institucionales estáticas de la SPA que sí queremos indexadas.
# (Términos y Privacidad quedan afuera a propósito: están marcadas `noindex`
# en el frontend, no tendría sentido listarlas acá.)
PAGINAS_ESTATICAS = ['', 'sobre-nosotros', 'envios', 'contacto', 'preguntas-frecuentes', 'como-comprar']

# Nunca deben quedar en el sitemap ni ser rastreadas: panel admin, checkout,
# páginas de auth, endpoints de API, seguimiento privado de pedidos.
RUTAS_NO_INDEXABLES = [
    '/admin', '/django-admin/', '/login',
    '/ingresar', '/registro', '/recuperar-password',
    '/pedido/', '/api/',
]


@require_GET
def robots_txt(request):
    frontend_url = settings.FRONTEND_URL.rstrip('/')
    lineas = ['User-agent: *']
    lineas += [f'Disallow: {ruta}' for ruta in RUTAS_NO_INDEXABLES]
    lineas += ['', f'Sitemap: {frontend_url}/sitemap.xml']
    return HttpResponse('\n'.join(lineas), content_type='text/plain')


@require_GET
def sitemap_xml(request):
    frontend_url = settings.FRONTEND_URL.rstrip('/')

    urls = [f'{frontend_url}/{pagina}' if pagina else f'{frontend_url}/' for pagina in PAGINAS_ESTATICAS]
    urls += [
        f'{frontend_url}/categoria/{slug}'
        for slug in Categoria.objects.filter(activo=True).values_list('slug', flat=True)
    ]
    urls += [
        f'{frontend_url}/productos/{slug}'
        for slug in Producto.objects.filter(activo=True).values_list('slug', flat=True)
    ]

    entradas = '\n'.join(f'  <url><loc>{url}</loc></url>' for url in urls)
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'{entradas}\n'
        '</urlset>'
    )
    return HttpResponse(xml, content_type='application/xml')
