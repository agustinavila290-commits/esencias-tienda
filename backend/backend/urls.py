from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

from .seo_views import robots_txt, sitemap_xml
from .health_views import health_live, health_ready

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/auth/',     include('apps.productos.auth_urls')),
    path('api/',          include('apps.productos.urls')),
    path('api/',          include('apps.pedidos.urls')),
    path('api/usuarios/', include('apps.usuarios.urls')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/health/',       health_live,  name='health-live'),
    path('api/health/ready/', health_ready, name='health-ready'),
    # Servidos en la raíz del dominio (no bajo /api/) — así los espera un crawler.
    path('robots.txt',   robots_txt,  name='robots-txt'),
    path('sitemap.xml',  sitemap_xml, name='sitemap-xml'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
