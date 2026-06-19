from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch

from apps.usuarios.models import UsuarioPerfil


def _crear_usuario(email='test@test.com', password='TestPass123', nombre='Ana', apellido='García'):
    user = User.objects.create_user(
        username=email, email=email,
        first_name=nombre, last_name=apellido,
        password=password,
    )
    UsuarioPerfil.objects.create(usuario=user, proveedor='local')
    return user


class RegistroViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/usuarios/registro/'
        self.datos = {
            'nombre': 'Ana', 'apellido': 'García',
            'email': 'ana@test.com',
            'password': 'Password123', 'password_confirmar': 'Password123',
        }

    def test_registro_exitoso_retorna_tokens(self):
        r = self.client.post(self.url, self.datos)
        self.assertEqual(r.status_code, 201)
        self.assertIn('access', r.data)
        self.assertIn('refresh', r.data)

    def test_registro_crea_usuario_y_perfil(self):
        self.client.post(self.url, self.datos)
        user = User.objects.get(email='ana@test.com')
        self.assertEqual(user.first_name, 'Ana')
        self.assertEqual(user.perfil.proveedor, 'local')

    def test_email_duplicado_retorna_400(self):
        self.client.post(self.url, self.datos)
        r = self.client.post(self.url, self.datos)
        self.assertEqual(r.status_code, 400)

    def test_passwords_no_coinciden_retorna_400(self):
        r = self.client.post(self.url, {**self.datos, 'password_confirmar': 'Diferente99'})
        self.assertEqual(r.status_code, 400)

    def test_password_corta_retorna_400(self):
        r = self.client.post(self.url, {**self.datos, 'password': '123', 'password_confirmar': '123'})
        self.assertEqual(r.status_code, 400)

    def test_email_invalido_retorna_400(self):
        r = self.client.post(self.url, {**self.datos, 'email': 'no-es-email'})
        self.assertEqual(r.status_code, 400)

    def test_campos_vacios_retorna_400(self):
        r = self.client.post(self.url, {})
        self.assertEqual(r.status_code, 400)

    def test_password_no_se_expone_en_respuesta(self):
        r = self.client.post(self.url, self.datos)
        self.assertNotIn('password', r.data)


class LoginViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/usuarios/login/'
        self.user = _crear_usuario()

    def test_login_exitoso_retorna_tokens(self):
        r = self.client.post(self.url, {'email': 'test@test.com', 'password': 'TestPass123'})
        self.assertEqual(r.status_code, 200)
        self.assertIn('access', r.data)
        self.assertIn('refresh', r.data)

    def test_password_incorrecta_retorna_401(self):
        r = self.client.post(self.url, {'email': 'test@test.com', 'password': 'Wrong!'})
        self.assertEqual(r.status_code, 401)

    def test_email_inexistente_retorna_401(self):
        r = self.client.post(self.url, {'email': 'noexiste@test.com', 'password': 'TestPass123'})
        self.assertEqual(r.status_code, 401)

    def test_email_case_insensitive(self):
        r = self.client.post(self.url, {'email': 'TEST@TEST.COM', 'password': 'TestPass123'})
        self.assertEqual(r.status_code, 200)

    def test_campos_vacios_retorna_400(self):
        r = self.client.post(self.url, {})
        self.assertEqual(r.status_code, 400)


class LogoutViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/usuarios/logout/'
        self.user = _crear_usuario()
        self.refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(self.refresh.access_token)}')

    def test_logout_exitoso(self):
        r = self.client.post(self.url, {'refresh': str(self.refresh)})
        self.assertEqual(r.status_code, 200)
        self.assertIn('mensaje', r.data)

    def test_logout_sin_auth_retorna_401(self):
        self.client.credentials()
        r = self.client.post(self.url, {'refresh': 'algo'})
        self.assertEqual(r.status_code, 401)

    def test_logout_token_invalido_igual_retorna_200(self):
        r = self.client.post(self.url, {'refresh': 'token-invalido'})
        self.assertEqual(r.status_code, 200)


class MeViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/usuarios/me/'
        self.user = _crear_usuario()
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

    def test_me_retorna_datos_del_usuario(self):
        r = self.client.get(self.url)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['nombre'], 'Ana')
        self.assertEqual(r.data['email'], 'test@test.com')

    def test_me_no_expone_password(self):
        r = self.client.get(self.url)
        self.assertNotIn('password', r.data)

    def test_me_sin_auth_retorna_401(self):
        self.client.credentials()
        r = self.client.get(self.url)
        self.assertEqual(r.status_code, 401)


@override_settings(GOOGLE_CLIENT_ID='fake-client-id-for-tests')
class GoogleAuthViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/usuarios/google/'

    @patch('apps.usuarios.views._verify_google_token')
    def test_google_login_crea_usuario_nuevo(self, mock_verify):
        mock_verify.return_value = {
            'google_id': 'g-123', 'email': 'nuevo@gmail.com',
            'nombre': 'Juan', 'apellido': 'Pérez',
        }
        r = self.client.post(self.url, {'credential': 'fake'})
        self.assertIn(r.status_code, [200, 201])
        self.assertIn('access', r.data)
        self.assertTrue(User.objects.filter(email='nuevo@gmail.com').exists())

    @patch('apps.usuarios.views._verify_google_token')
    def test_google_login_vincula_cuenta_local_existente(self, mock_verify):
        user = _crear_usuario(email='existente@gmail.com')
        mock_verify.return_value = {
            'google_id': 'g-456', 'email': 'existente@gmail.com',
            'nombre': 'María', 'apellido': 'López',
        }
        r = self.client.post(self.url, {'credential': 'fake'})
        self.assertIn(r.status_code, [200, 201])
        user.perfil.refresh_from_db()
        self.assertEqual(user.perfil.google_id, 'g-456')

    def test_sin_credential_retorna_400(self):
        r = self.client.post(self.url, {})
        self.assertEqual(r.status_code, 400)

    @patch('apps.usuarios.views._verify_google_token', side_effect=Exception('invalid token'))
    def test_token_invalido_retorna_400(self, mock_verify):
        r = self.client.post(self.url, {'credential': 'invalido'})
        self.assertEqual(r.status_code, 400)


class RecuperarPasswordViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/usuarios/recuperar-password/'
        _crear_usuario()

    def test_email_valido_retorna_mensaje_generico(self):
        r = self.client.post(self.url, {'email': 'test@test.com'})
        self.assertEqual(r.status_code, 200)
        self.assertIn('mensaje', r.data)

    def test_email_inexistente_retorna_mismo_mensaje(self):
        r = self.client.post(self.url, {'email': 'noexiste@test.com'})
        self.assertEqual(r.status_code, 200)
        self.assertIn('mensaje', r.data)

    def test_sin_email_retorna_400(self):
        r = self.client.post(self.url, {})
        self.assertEqual(r.status_code, 400)
