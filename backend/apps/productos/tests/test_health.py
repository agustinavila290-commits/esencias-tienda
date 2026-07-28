from unittest.mock import patch

from django.test import TestCase


class HealthLiveTest(TestCase):
    def test_responde_ok(self):
        r = self.client.get('/api/health/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['status'], 'ok')

    def test_no_requiere_autenticacion(self):
        r = self.client.get('/api/health/')
        self.assertNotEqual(r.status_code, 401)


class HealthReadyTest(TestCase):
    def test_responde_ok_cuando_todo_funciona(self):
        r = self.client.get('/api/health/ready/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['status'], 'ok')
        self.assertEqual(r.data['checks']['database'], 'ok')
        self.assertEqual(r.data['checks']['cache'], 'ok')

    def test_no_expone_detalles_sensibles(self):
        r = self.client.get('/api/health/ready/')
        texto = str(r.data)
        for palabra_prohibida in ('SECRET_KEY', 'password', 'PASSWORD', 'Traceback'):
            self.assertNotIn(palabra_prohibida, texto)

    @patch('backend.health_views.connection')
    def test_da_503_si_falla_la_base_de_datos(self, mock_connection):
        from django.db.utils import OperationalError
        mock_connection.cursor.side_effect = OperationalError('no conecta')
        r = self.client.get('/api/health/ready/')
        self.assertEqual(r.status_code, 503)
        self.assertEqual(r.data['checks']['database'], 'error')
