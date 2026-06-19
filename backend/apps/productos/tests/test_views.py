from django.test import TestCase
from rest_framework.test import APIClient
from apps.productos.models import Producto, Categoria


class ProductosListViewTest(TestCase):
    """Tests para GET /api/productos/ — filtros, búsqueda y orden."""

    def setUp(self):
        self.client = APIClient()
        self.cat_sah = Categoria.objects.create(nombre='Sahumerios', slug='sahumerios', activo=True)
        self.cat_inc = Categoria.objects.create(nombre='Inciensos',  slug='inciensos',  activo=True)

        self.p_rosa  = Producto.objects.create(nombre='Sahumerio Rosa',   precio=500, stock=10, categoria=self.cat_sah, activo=True,  descripcion='Aroma suave y floral')
        self.p_lav   = Producto.objects.create(nombre='Incienso Lavanda', precio=300, stock=5,  categoria=self.cat_inc, activo=True,  descripcion='Relajante y medicinal')
        self.p_palo  = Producto.objects.create(nombre='Palo Santo',       precio=800, stock=3,  categoria=self.cat_sah, activo=True,  descripcion='Madera sagrada')
        self.p_inact = Producto.objects.create(nombre='Descontinuado',    precio=100, stock=0,  categoria=self.cat_sah, activo=False, descripcion='Sin stock')

    # ── Listado básico ──────────────────────────────────────────────────────────

    def test_lista_solo_productos_activos(self):
        r = self.client.get('/api/productos/')
        self.assertEqual(r.status_code, 200)
        nombres = [p['nombre'] for p in r.data]
        self.assertIn('Sahumerio Rosa', nombres)
        self.assertIn('Incienso Lavanda', nombres)
        self.assertNotIn('Descontinuado', nombres)

    def test_respuesta_incluye_campos_esperados(self):
        r = self.client.get('/api/productos/')
        p = r.data[0]
        for campo in ('id', 'nombre', 'precio', 'stock_disponible', 'imagen_url', 'categoria_slug', 'categoria_nombre'):
            self.assertIn(campo, p)

    def test_imagen_url_es_none_si_no_tiene_imagen(self):
        r = self.client.get('/api/productos/')
        p = next(x for x in r.data if x['nombre'] == 'Sahumerio Rosa')
        self.assertIsNone(p['imagen_url'])

    def test_stock_disponible_igual_al_stock_real_sin_reservas(self):
        r = self.client.get('/api/productos/')
        p = next(x for x in r.data if x['nombre'] == 'Sahumerio Rosa')
        self.assertEqual(p['stock_disponible'], 10)

    # ── Búsqueda ────────────────────────────────────────────────────────────────

    def test_search_por_nombre(self):
        r = self.client.get('/api/productos/?search=Rosa')
        nombres = [p['nombre'] for p in r.data]
        self.assertIn('Sahumerio Rosa', nombres)
        self.assertNotIn('Incienso Lavanda', nombres)

    def test_search_case_insensitive(self):
        r = self.client.get('/api/productos/?search=rosa')
        self.assertEqual(len(r.data), 1)
        self.assertEqual(r.data[0]['nombre'], 'Sahumerio Rosa')

    def test_search_por_descripcion(self):
        r = self.client.get('/api/productos/?search=relajante')
        self.assertEqual(len(r.data), 1)
        self.assertEqual(r.data[0]['nombre'], 'Incienso Lavanda')

    def test_search_sin_resultados_retorna_lista_vacia(self):
        r = self.client.get('/api/productos/?search=XYZ_NO_EXISTE')
        self.assertEqual(r.data, [])

    def test_search_vacio_retorna_todos_los_activos(self):
        r = self.client.get('/api/productos/?search=')
        self.assertEqual(len(r.data), 3)

    # ── Filtro por categoría ────────────────────────────────────────────────────

    def test_filter_por_categoria_slug(self):
        r = self.client.get('/api/productos/?categoria=sahumerios')
        nombres = [p['nombre'] for p in r.data]
        self.assertIn('Sahumerio Rosa', nombres)
        self.assertIn('Palo Santo', nombres)
        self.assertNotIn('Incienso Lavanda', nombres)

    def test_filter_categoria_inexistente_retorna_vacio(self):
        r = self.client.get('/api/productos/?categoria=no-existe')
        self.assertEqual(r.data, [])

    # ── Orden ───────────────────────────────────────────────────────────────────

    def test_orden_precio_asc(self):
        r = self.client.get('/api/productos/?orden=precio_asc')
        precios = [float(p['precio']) for p in r.data]
        self.assertEqual(precios, sorted(precios))

    def test_orden_precio_desc(self):
        r = self.client.get('/api/productos/?orden=precio_desc')
        precios = [float(p['precio']) for p in r.data]
        self.assertEqual(precios, sorted(precios, reverse=True))

    def test_orden_nuevos_primero_mayor_id(self):
        # En tests los created_at pueden coincidir; los diferenciamos con update()
        from django.utils import timezone
        from datetime import timedelta
        Producto.objects.filter(pk=self.p_rosa.pk).update(created_at=timezone.now() - timedelta(hours=2))
        Producto.objects.filter(pk=self.p_lav.pk).update(created_at=timezone.now() - timedelta(hours=1))
        Producto.objects.filter(pk=self.p_palo.pk).update(created_at=timezone.now())

        r = self.client.get('/api/productos/?orden=nuevos')
        ids = [p['id'] for p in r.data]
        self.assertEqual(ids[0], self.p_palo.id)
        self.assertEqual(ids[-1], self.p_rosa.id)

    def test_orden_nombre_az_por_defecto(self):
        r = self.client.get('/api/productos/')
        nombres = [p['nombre'] for p in r.data]
        self.assertEqual(nombres, sorted(nombres))

    # ── Detalle de producto ─────────────────────────────────────────────────────

    def test_detalle_producto_existe(self):
        r = self.client.get(f'/api/productos/{self.p_rosa.id}/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['nombre'], 'Sahumerio Rosa')

    def test_detalle_producto_inactivo_retorna_404(self):
        r = self.client.get(f'/api/productos/{self.p_inact.id}/')
        self.assertEqual(r.status_code, 404)

    def test_detalle_producto_inexistente_retorna_404(self):
        r = self.client.get('/api/productos/99999/')
        self.assertEqual(r.status_code, 404)


class CategoriasListViewTest(TestCase):
    """Tests para GET /api/categorias/."""

    def setUp(self):
        self.client = APIClient()
        self.cat_activa  = Categoria.objects.create(nombre='Sahumerios', slug='sahumerios', activo=True)
        self.cat_inactiva = Categoria.objects.create(nombre='Oculta', slug='oculta', activo=False)

    def test_lista_solo_categorias_activas(self):
        r = self.client.get('/api/categorias/')
        self.assertEqual(r.status_code, 200)
        slugs = [c['slug'] for c in r.data]
        self.assertIn('sahumerios', slugs)
        self.assertNotIn('oculta', slugs)
