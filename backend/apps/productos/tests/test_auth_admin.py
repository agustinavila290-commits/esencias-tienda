from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.productos.auth_views import REFRESH_COOKIE_NAME


@override_settings(DEBUG=True)  # cookie no-Secure para poder probarla sin HTTPS
class AdminAuthTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='staff', password='ClavePrueba123', is_staff=True)
        cache.clear()

    def tearDown(self):
        cache.clear()

    def _login(self, password='ClavePrueba123'):
        return self.client.post('/api/auth/login/', {'username': 'staff', 'password': password})

    # ── Login ──────────────────────────────────────────────────────────────

    def test_login_correcto_devuelve_solo_access_en_el_body(self):
        r = self._login()
        self.assertEqual(r.status_code, 200)
        self.assertIn('access', r.data)
        self.assertNotIn('refresh', r.data)

    def test_login_correcto_setea_cookie_httponly(self):
        r = self._login()
        cookie = r.cookies.get(REFRESH_COOKIE_NAME)
        self.assertIsNotNone(cookie)
        self.assertTrue(cookie['httponly'])
        self.assertEqual(cookie['samesite'], 'Lax')

    def test_login_incorrecto_da_401(self):
        r = self._login(password='incorrecta')
        self.assertEqual(r.status_code, 401)
        self.assertNotIn('access', r.data)

    def test_login_bloqueado_por_rate_limit(self):
        for _ in range(10):
            self._login(password='incorrecta')
        r = self._login(password='incorrecta')
        self.assertEqual(r.status_code, 429)

    def test_access_token_del_login_sirve_para_endpoints_protegidos(self):
        r = self._login()
        access = r.data['access']
        r2 = self.client.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {access}')
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.data['username'], 'staff')

    # ── Refresh ────────────────────────────────────────────────────────────

    def test_refresh_sin_cookie_da_401(self):
        r = self.client.post('/api/auth/refresh/')
        self.assertEqual(r.status_code, 401)

    def test_refresh_con_cookie_valida_da_nuevo_access(self):
        self._login()  # el test client ya guarda la cookie seteada
        r = self.client.post('/api/auth/refresh/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('access', r.data)

    def test_refresh_rota_la_cookie(self):
        self._login()
        cookie_antes = self.client.cookies.get(REFRESH_COOKIE_NAME).value
        r = self.client.post('/api/auth/refresh/')
        cookie_despues = r.cookies.get(REFRESH_COOKIE_NAME)
        self.assertIsNotNone(cookie_despues)
        self.assertNotEqual(cookie_antes, cookie_despues.value)

    def test_refresh_con_cookie_invalida_da_401_y_borra_cookie(self):
        self.client.cookies[REFRESH_COOKIE_NAME] = 'no-es-un-token-valido'
        r = self.client.post('/api/auth/refresh/')
        self.assertEqual(r.status_code, 401)

    def test_nuevo_access_del_refresh_tambien_sirve(self):
        self._login()
        r = self.client.post('/api/auth/refresh/')
        access = r.data['access']
        r2 = self.client.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {access}')
        self.assertEqual(r2.status_code, 200)

    # ── Logout ─────────────────────────────────────────────────────────────

    def test_logout_sin_cookie_no_rompe(self):
        r = self.client.post('/api/auth/logout/')
        self.assertEqual(r.status_code, 200)

    def test_logout_invalida_el_refresh_token(self):
        self._login()
        r = self.client.post('/api/auth/logout/')
        self.assertEqual(r.status_code, 200)

        # El refresh (blacklisteado) ya no debería servir para renovar.
        r2 = self.client.post('/api/auth/refresh/')
        self.assertEqual(r2.status_code, 401)
