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
        nombres = [p['nombre'] for p in r.data['results']]
        self.assertIn('Sahumerio Rosa', nombres)
        self.assertIn('Incienso Lavanda', nombres)
        self.assertNotIn('Descontinuado', nombres)

    def test_respuesta_es_paginada(self):
        r = self.client.get('/api/productos/')
        for campo in ('count', 'next', 'previous', 'results'):
            self.assertIn(campo, r.data)
        self.assertEqual(r.data['count'], 3)

    def test_respuesta_incluye_campos_esperados(self):
        r = self.client.get('/api/productos/')
        p = r.data['results'][0]
        for campo in ('id', 'nombre', 'precio', 'stock_disponible', 'disponibilidad',
                      'imagen_url', 'categoria_slug', 'categoria_nombre'):
            self.assertIn(campo, p)

    def test_imagen_url_es_none_si_no_tiene_imagen(self):
        r = self.client.get('/api/productos/')
        p = next(x for x in r.data['results'] if x['nombre'] == 'Sahumerio Rosa')
        self.assertIsNone(p['imagen_url'])

    def test_stock_disponible_igual_al_stock_real_sin_reservas(self):
        r = self.client.get('/api/productos/')
        p = next(x for x in r.data['results'] if x['nombre'] == 'Sahumerio Rosa')
        self.assertEqual(p['stock_disponible'], 10)
        self.assertEqual(p['disponibilidad'], 'disponible')

    # ── Búsqueda ────────────────────────────────────────────────────────────────

    def test_search_por_nombre(self):
        r = self.client.get('/api/productos/?search=Rosa')
        nombres = [p['nombre'] for p in r.data['results']]
        self.assertIn('Sahumerio Rosa', nombres)
        self.assertNotIn('Incienso Lavanda', nombres)

    def test_search_case_insensitive(self):
        r = self.client.get('/api/productos/?search=rosa')
        self.assertEqual(len(r.data['results']), 1)
        self.assertEqual(r.data['results'][0]['nombre'], 'Sahumerio Rosa')

    def test_search_por_descripcion(self):
        r = self.client.get('/api/productos/?search=relajante')
        self.assertEqual(len(r.data['results']), 1)
        self.assertEqual(r.data['results'][0]['nombre'], 'Incienso Lavanda')

    def test_search_por_categoria(self):
        r = self.client.get('/api/productos/?search=Inciensos')
        nombres = [p['nombre'] for p in r.data['results']]
        self.assertIn('Incienso Lavanda', nombres)

    def test_search_sin_resultados_retorna_lista_vacia(self):
        r = self.client.get('/api/productos/?search=XYZ_NO_EXISTE')
        self.assertEqual(r.data['results'], [])

    def test_search_vacio_retorna_todos_los_activos(self):
        r = self.client.get('/api/productos/?search=')
        self.assertEqual(len(r.data['results']), 3)

    # ── Filtro por categoría ────────────────────────────────────────────────────

    def test_filter_por_categoria_slug(self):
        r = self.client.get('/api/productos/?categoria=sahumerios')
        nombres = [p['nombre'] for p in r.data['results']]
        self.assertIn('Sahumerio Rosa', nombres)
        self.assertIn('Palo Santo', nombres)
        self.assertNotIn('Incienso Lavanda', nombres)

    def test_filter_categoria_inexistente_retorna_vacio(self):
        r = self.client.get('/api/productos/?categoria=no-existe')
        self.assertEqual(r.data['results'], [])

    # ── Filtro por disponibilidad y precio ──────────────────────────────────────

    def test_filter_disponible_excluye_agotados(self):
        Producto.objects.create(nombre='Agotado', precio=100, stock=0, categoria=self.cat_sah, activo=True)
        r = self.client.get('/api/productos/?disponible=1')
        nombres = [p['nombre'] for p in r.data['results']]
        self.assertNotIn('Agotado', nombres)
        self.assertIn('Sahumerio Rosa', nombres)

    def test_filter_precio_min_max(self):
        r = self.client.get('/api/productos/?precio_min=400&precio_max=600')
        nombres = [p['nombre'] for p in r.data['results']]
        self.assertEqual(nombres, ['Sahumerio Rosa'])

    def test_filter_precio_invalido_se_ignora_sin_error(self):
        r = self.client.get('/api/productos/?precio_min=no-es-un-numero')
        self.assertEqual(r.status_code, 200)

    # ── Orden ───────────────────────────────────────────────────────────────────

    def test_orden_precio_asc(self):
        r = self.client.get('/api/productos/?orden=precio_asc')
        precios = [float(p['precio']) for p in r.data['results']]
        self.assertEqual(precios, sorted(precios))

    def test_orden_precio_desc(self):
        r = self.client.get('/api/productos/?orden=precio_desc')
        precios = [float(p['precio']) for p in r.data['results']]
        self.assertEqual(precios, sorted(precios, reverse=True))

    def test_orden_nuevos_primero_mayor_id(self):
        # En tests los created_at pueden coincidir; los diferenciamos con update()
        from django.utils import timezone
        from datetime import timedelta
        Producto.objects.filter(pk=self.p_rosa.pk).update(created_at=timezone.now() - timedelta(hours=2))
        Producto.objects.filter(pk=self.p_lav.pk).update(created_at=timezone.now() - timedelta(hours=1))
        Producto.objects.filter(pk=self.p_palo.pk).update(created_at=timezone.now())

        r = self.client.get('/api/productos/?orden=nuevos')
        ids = [p['id'] for p in r.data['results']]
        self.assertEqual(ids[0], self.p_palo.id)
        self.assertEqual(ids[-1], self.p_rosa.id)

    def test_orden_nombre_az_por_defecto(self):
        r = self.client.get('/api/productos/')
        nombres = [p['nombre'] for p in r.data['results']]
        self.assertEqual(nombres, sorted(nombres))

    # ── Paginación ───────────────────────────────────────────────────────────────

    def test_page_size_limita_resultados(self):
        r = self.client.get('/api/productos/?page_size=2')
        self.assertEqual(len(r.data['results']), 2)
        self.assertIsNotNone(r.data['next'])

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


class ProductoPorSlugViewTest(TestCase):
    """Tests para GET /api/productos/slug/<slug>/ — detalle + relacionados."""

    def setUp(self):
        self.client = APIClient()
        self.cat = Categoria.objects.create(nombre='Sahumerios', slug='sahumerios', activo=True)
        self.otra_cat = Categoria.objects.create(nombre='Inciensos', slug='inciensos', activo=True)

        self.p = Producto.objects.create(
            nombre='Sahumerio Palo Santo', precio=800, stock=10,
            categoria=self.cat, activo=True, descripcion='Madera sagrada',
        )
        self.hermano = Producto.objects.create(
            nombre='Sahumerio Rosa', precio=500, stock=5, categoria=self.cat, activo=True,
        )
        self.otro = Producto.objects.create(
            nombre='Incienso Lavanda', precio=300, stock=5, categoria=self.otra_cat, activo=True,
        )
        self.inactivo_misma_cat = Producto.objects.create(
            nombre='Descontinuado', precio=100, stock=0, categoria=self.cat, activo=False,
        )

    def test_encuentra_producto_por_slug(self):
        r = self.client.get(f'/api/productos/slug/{self.p.slug}/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['nombre'], 'Sahumerio Palo Santo')

    def test_slug_generado_a_partir_del_nombre(self):
        self.assertEqual(self.p.slug, 'sahumerio-palo-santo')

    def test_slug_inexistente_da_404(self):
        r = self.client.get('/api/productos/slug/no-existe/')
        self.assertEqual(r.status_code, 404)

    def test_producto_inactivo_por_slug_da_404(self):
        r = self.client.get(f'/api/productos/slug/{self.inactivo_misma_cat.slug}/')
        self.assertEqual(r.status_code, 404)

    def test_incluye_relacionados_de_la_misma_categoria(self):
        r = self.client.get(f'/api/productos/slug/{self.p.slug}/')
        nombres = [x['nombre'] for x in r.data['relacionados']]
        self.assertIn('Sahumerio Rosa', nombres)
        self.assertNotIn('Incienso Lavanda', nombres)
        self.assertNotIn('Sahumerio Palo Santo', nombres)  # nunca se incluye a sí mismo

    def test_relacionados_excluye_inactivos(self):
        r = self.client.get(f'/api/productos/slug/{self.p.slug}/')
        nombres = [x['nombre'] for x in r.data['relacionados']]
        self.assertNotIn('Descontinuado', nombres)

    def test_sin_categoria_no_tiene_relacionados(self):
        suelto = Producto.objects.create(nombre='Suelto', precio=200, stock=5, activo=True)
        r = self.client.get(f'/api/productos/slug/{suelto.slug}/')
        self.assertEqual(r.data['relacionados'], [])


class CategoriasListViewTest(TestCase):
    """Tests para GET /api/categorias/."""

    def setUp(self):
        self.client = APIClient()
        self.cat_activa  = Categoria.objects.create(nombre='Sahumerios', slug='sahumerios', activo=True)
        self.cat_inactiva = Categoria.objects.create(nombre='Oculta', slug='oculta', activo=False)

    def tearDown(self):
        from django.core.cache import cache
        cache.clear()

    def test_lista_solo_categorias_activas(self):
        r = self.client.get('/api/categorias/')
        self.assertEqual(r.status_code, 200)
        slugs = [c['slug'] for c in r.data]
        self.assertIn('sahumerios', slugs)
        self.assertNotIn('oculta', slugs)

    def test_incluye_descripcion(self):
        r = self.client.get('/api/categorias/')
        self.assertIn('descripcion', r.data[0])

    def test_cache_se_invalida_al_crear_categoria(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        from django.contrib.auth.models import User

        r1 = self.client.get('/api/categorias/')
        self.assertEqual(len(r1.data), 1)

        user = User.objects.create_user(username='admin', password='x', is_staff=True)
        token = str(RefreshToken.for_user(user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        r_create = self.client.post('/api/admin/categorias/', {'nombre': 'Velas', 'activo': True})
        self.assertEqual(r_create.status_code, 201)

        r2 = self.client.get('/api/categorias/')
        slugs = [c['slug'] for c in r2.data]
        self.assertIn('velas', slugs)
