from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/auth/',     include('apps.productos.auth_urls')),
    path('api/',          include('apps.productos.urls')),
    path('api/',          include('apps.pedidos.urls')),
    path('api/usuarios/', include('apps.usuarios.urls')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
