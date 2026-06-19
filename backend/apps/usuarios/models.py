from django.db import models
from django.contrib.auth.models import User


class UsuarioPerfil(models.Model):
    PROVEEDOR_LOCAL  = 'local'
    PROVEEDOR_GOOGLE = 'google'
    PROVEEDOR_CHOICES = [
        (PROVEEDOR_LOCAL,  'Local'),
        (PROVEEDOR_GOOGLE, 'Google'),
    ]

    usuario   = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    proveedor = models.CharField(max_length=10, choices=PROVEEDOR_CHOICES, default=PROVEEDOR_LOCAL)
    google_id = models.CharField(max_length=100, blank=True, null=True, unique=True)

    class Meta:
        verbose_name = 'Perfil de usuario'
        verbose_name_plural = 'Perfiles de usuarios'

    def __str__(self):
        return f"{self.usuario.get_full_name()} ({self.proveedor})"
