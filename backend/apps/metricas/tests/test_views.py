from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.metricas.models import EventoMetrica


class RegistrarEventoTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        cache.clear()

    def tearDown(self):
        cache.clear()

    @override_settings(METRICAS_HABILITADAS=False)
    def test_no_guarda_nada_si_esta_deshabilitado(self):
        r = self.client.post('/api/metrica/', {'tipo': 'page_view', 'ruta': '/'})
        self.assertEqual(r.status_code, 204)
        self.assertEqual(EventoMetrica.objects.count(), 0)

    @override_settings(METRICAS_HABILITADAS=True)
    def test_guarda_el_evento_si_esta_habilitado(self):
        r = self.client.post('/api/metrica/', {'tipo': 'busqueda_sin_resultados', 'termino_busqueda': 'xyz'})
        self.assertEqual(r.status_code, 204)
        self.assertEqual(EventoMetrica.objects.count(), 1)
        evento = EventoMetrica.objects.first()
        self.assertEqual(evento.tipo, 'busqueda_sin_resultados')
        self.assertEqual(evento.termino_busqueda, 'xyz')

    @override_settings(METRICAS_HABILITADAS=True)
    def test_no_guarda_datos_personales(self):
        self.client.post('/api/metrica/', {
            'tipo': 'page_view', 'ruta': '/',
            'ip': '1.2.3.4', 'email': 'x@x.com',  # el serializer los ignora
        })
        evento = EventoMetrica.objects.first()
        self.assertFalse(hasattr(evento, 'ip'))
        self.assertFalse(hasattr(evento, 'email'))

    @override_settings(METRICAS_HABILITADAS=True)
    def test_tipo_invalido_no_rompe(self):
        r = self.client.post('/api/metrica/', {'tipo': 'no-existe'})
        self.assertEqual(r.status_code, 204)
        self.assertEqual(EventoMetrica.objects.count(), 0)

    @override_settings(METRICAS_HABILITADAS=True)
    def test_bloquea_pasado_el_limite(self):
        for _ in range(60):
            self.client.post('/api/metrica/', {'tipo': 'page_view', 'ruta': '/'})
        antes = EventoMetrica.objects.count()
        self.client.post('/api/metrica/', {'tipo': 'page_view', 'ruta': '/'})
        # El request extra no debe haberse guardado (rate-limited, pero
        # igual responde 204 para no romper nada en el frontend).
        self.assertEqual(EventoMetrica.objects.count(), antes)
