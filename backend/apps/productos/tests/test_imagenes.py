import shutil
import tempfile
from io import BytesIO

from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files.storage import default_storage
from django.test import TestCase, override_settings

from apps.productos.models import Producto, Categoria

_MEDIA_ROOT_TEST = tempfile.mkdtemp(prefix='esencias_test_media_')


def _imagen_fake(nombre='foto.jpg', tamano=(2000, 1000), formato='JPEG', color=(200, 50, 50)):
    buffer = BytesIO()
    Image.new('RGB', tamano, color=color).save(buffer, format=formato)
    buffer.seek(0)
    content_type = 'image/jpeg' if formato == 'JPEG' else f'image/{formato.lower()}'
    return SimpleUploadedFile(nombre, buffer.read(), content_type=content_type)


def _make_producto(**extra):
    cat, _ = Categoria.objects.get_or_create(nombre='Test', slug='test', defaults={'activo': True})
    defaults = dict(nombre='Producto con imagen', precio=500, stock=5, categoria=cat, activo=True)
    defaults.update(extra)
    return Producto.objects.create(**defaults)


@override_settings(MEDIA_ROOT=_MEDIA_ROOT_TEST)
class ProcesamientoDeImagenTest(TestCase):

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(_MEDIA_ROOT_TEST, ignore_errors=True)

    def test_convierte_a_webp(self):
        p = _make_producto(imagen=_imagen_fake())
        self.assertTrue(p.imagen.name.endswith('.webp'))

    def test_genera_miniatura(self):
        p = _make_producto(imagen=_imagen_fake())
        self.assertTrue(p.imagen_thumbnail)
        self.assertTrue(p.imagen_thumbnail.name.endswith('.webp'))

    def test_redimensiona_imagen_grande_al_maximo(self):
        p = _make_producto(imagen=_imagen_fake(tamano=(3000, 1500)))
        with Image.open(p.imagen.path) as img:
            self.assertLessEqual(max(img.size), 1600)

    def test_miniatura_es_mas_chica_que_la_imagen_principal(self):
        p = _make_producto(imagen=_imagen_fake(tamano=(3000, 1500)))
        with Image.open(p.imagen_thumbnail.path) as thumb:
            self.assertLessEqual(max(thumb.size), 400)

    def test_no_agranda_imagenes_chicas(self):
        p = _make_producto(imagen=_imagen_fake(tamano=(200, 100)))
        with Image.open(p.imagen.path) as img:
            self.assertEqual(img.size, (200, 100))

    def test_producto_sin_imagen_no_rompe(self):
        p = _make_producto()
        self.assertFalse(p.imagen)
        self.assertFalse(p.imagen_thumbnail)

    def test_reemplazar_imagen_borra_los_archivos_viejos(self):
        p = _make_producto(imagen=_imagen_fake())
        ruta_vieja = p.imagen.path
        ruta_thumb_vieja = p.imagen_thumbnail.path
        self.assertTrue(default_storage.exists(p.imagen.name))

        p.imagen = _imagen_fake(color=(10, 10, 200))
        p.save()

        # Los paths viejos ya no deben existir en disco tras el reemplazo.
        import os
        self.assertFalse(os.path.exists(ruta_vieja))
        self.assertFalse(os.path.exists(ruta_thumb_vieja))
        self.assertTrue(os.path.exists(p.imagen.path))

    def test_actualizar_producto_sin_tocar_imagen_no_la_reprocesa(self):
        p = _make_producto(imagen=_imagen_fake())
        nombre_original = p.imagen.name
        p.nombre = 'Nuevo nombre'
        p.save()
        p.refresh_from_db()
        self.assertEqual(p.imagen.name, nombre_original)

    def test_borrar_producto_borra_sus_archivos(self):
        p = _make_producto(imagen=_imagen_fake())
        ruta = p.imagen.path
        ruta_thumb = p.imagen_thumbnail.path
        p.delete()
        import os
        self.assertFalse(os.path.exists(ruta))
        self.assertFalse(os.path.exists(ruta_thumb))

    def test_acepta_png(self):
        p = _make_producto(imagen=_imagen_fake(nombre='foto.png', formato='PNG'))
        self.assertTrue(p.imagen.name.endswith('.webp'))

    def test_corrige_orientacion_no_rompe_sin_exif(self):
        # Imagen sin datos EXIF: exif_transpose debe ser un no-op seguro.
        p = _make_producto(imagen=_imagen_fake())
        self.assertTrue(p.imagen)


class ValidacionDeImagenTest(TestCase):

    def test_rechaza_extension_no_soportada(self):
        cat, _ = Categoria.objects.get_or_create(nombre='Test', slug='test', defaults={'activo': True})
        p = Producto(nombre='Malo', precio=100, stock=1, categoria=cat, activo=True)
        p.imagen = SimpleUploadedFile('archivo.gif', b'no-es-una-imagen-real', content_type='image/gif')
        with self.assertRaises(Exception):
            p.full_clean()
