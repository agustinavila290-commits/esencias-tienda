from django.test import TestCase, override_settings
from apps.productos.models import Producto, Categoria


@override_settings(FRONTEND_URL='https://esencias.avilamotorepuesto.com.ar')
class RobotsTxtTest(TestCase):
    def test_status_y_content_type(self):
        r = self.client.get('/robots.txt')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r['Content-Type'], 'text/plain')

    def test_bloquea_rutas_privadas(self):
        r = self.client.get('/robots.txt')
        texto = r.content.decode()
        for ruta in ('/admin', '/django-admin/', '/api/', '/pedido/', '/login'):
            self.assertIn(f'Disallow: {ruta}', texto)

    def test_referencia_el_sitemap(self):
        r = self.client.get('/robots.txt')
        self.assertIn('Sitemap: https://esencias.avilamotorepuesto.com.ar/sitemap.xml', r.content.decode())


@override_settings(FRONTEND_URL='https://esencias.avilamotorepuesto.com.ar')
class SitemapXmlTest(TestCase):
    def setUp(self):
        self.cat = Categoria.objects.create(nombre='Sahumerios', slug='sahumerios', activo=True)
        self.cat_inactiva = Categoria.objects.create(nombre='Oculta', slug='oculta', activo=False)
        self.prod = Producto.objects.create(nombre='Palo Santo', precio=800, stock=5, categoria=self.cat, activo=True)
        self.prod_inactivo = Producto.objects.create(nombre='Descontinuado', precio=100, stock=0, activo=False)

    def test_status_y_content_type(self):
        r = self.client.get('/sitemap.xml')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r['Content-Type'], 'application/xml')

    def test_incluye_paginas_estaticas(self):
        texto = self.client.get('/sitemap.xml').content.decode()
        self.assertIn('<loc>https://esencias.avilamotorepuesto.com.ar/</loc>', texto)
        self.assertIn('<loc>https://esencias.avilamotorepuesto.com.ar/sobre-nosotros</loc>', texto)
        self.assertIn('<loc>https://esencias.avilamotorepuesto.com.ar/envios</loc>', texto)
        self.assertIn('<loc>https://esencias.avilamotorepuesto.com.ar/contacto</loc>', texto)
        self.assertIn('<loc>https://esencias.avilamotorepuesto.com.ar/preguntas-frecuentes</loc>', texto)
        self.assertIn('<loc>https://esencias.avilamotorepuesto.com.ar/como-comprar</loc>', texto)

    def test_no_incluye_paginas_noindex(self):
        texto = self.client.get('/sitemap.xml').content.decode()
        self.assertNotIn('/terminos</loc>', texto)
        self.assertNotIn('/privacidad</loc>', texto)

    def test_incluye_categoria_activa_y_excluye_inactiva(self):
        texto = self.client.get('/sitemap.xml').content.decode()
        self.assertIn('/categoria/sahumerios</loc>', texto)
        self.assertNotIn('/categoria/oculta</loc>', texto)

    def test_incluye_producto_activo_y_excluye_inactivo(self):
        texto = self.client.get('/sitemap.xml').content.decode()
        self.assertIn(f'/productos/{self.prod.slug}</loc>', texto)
        self.assertNotIn(f'/productos/{self.prod_inactivo.slug}</loc>', texto)

    def test_no_incluye_rutas_privadas(self):
        texto = self.client.get('/sitemap.xml').content.decode()
        for ruta in ('/admin', '/django-admin', '/pedido/', '/api/', '/login'):
            self.assertNotIn(ruta, texto)
