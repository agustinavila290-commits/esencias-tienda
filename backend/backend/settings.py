from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'apps.productos',
    'apps.pedidos',
    'apps.usuarios',
    'apps.metricas',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Base de datos
USE_SQLITE = config('USE_SQLITE', default=True, cast=bool)
if USE_SQLITE:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='esencias'),
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-ar'
TIME_ZONE = 'America/Argentina/Buenos_Aires'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Cache — usada para rate limiting (ver backend/rate_limit.py) y la caché
# corta de /api/categorias/. En un solo proceso de desarrollo, memoria local
# alcanza. En producción con más de un worker de Gunicorn, cada worker tendría
# su propia memoria y el rate limit/caché no se compartiría entre ellos — para
# eso, configurar REDIS_URL (requiere `pip install django-redis`, ya listado
# como opcional en requirements.txt) y listo, sin tocar código.
REDIS_URL = config('REDIS_URL', default='')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {'CLIENT_CLASS': 'django_redis.client.DefaultClient'},
        }
    }
else:
    CACHES = {
        'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}
    }

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}

# Auth backends — permite login por email además del username por defecto
AUTHENTICATION_BACKENDS = [
    'apps.usuarios.backends.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# Google OAuth
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='')

# CORS
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS', default='http://localhost:5174'
).split(',')
CORS_ALLOW_ALL_ORIGINS = DEBUG
# Necesario para que el navegador mande/reciba la cookie HttpOnly del refresh
# token del admin. django-cors-headers automáticamente deja de mandar "*" en
# Access-Control-Allow-Origin cuando esto está en True (manda el origin exacto),
# así que sigue siendo seguro combinado con CORS_ALLOW_ALL_ORIGINS en dev.
CORS_ALLOW_CREDENTIALS = True

# CSRF — dominios desde los que se acepta un POST con cookies (mismo dominio
# real en producción gracias al proxy de Nginx; en dev, orígenes del front).
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS', default='http://localhost:5174,http://localhost:5175'
).split(',')

# Cabeceras de seguridad. Estas aplican a lo que responde Django directamente
# (API JSON, /django-admin/) — el HTML de la SPA de React lo sirve Nginx en
# producción, así que su Content-Security-Policy se define en
# deploy/nginx-esencias.conf, no acá.
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
X_FRAME_OPTIONS = 'DENY'

if not DEBUG:
    # Cookies de sesión/CSRF de Django (no confundir con la cookie propia
    # admin_refresh_token, que ya se marca Secure fuera de DEBUG en
    # apps/productos/auth_views.py).
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    # SECURE_SSL_REDIRECT queda apagado por defecto: Nginx ya redirige
    # HTTP→HTTPS antes de que la request llegue a Django (ver
    # deploy/nginx-esencias.conf). Si se activa acá también, Django necesita
    # confiar en el header que manda Nginx para saber que la conexión ya es
    # HTTPS, o entra en loop de redirects.
    SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    # HSTS: arranca en un valor conservador (1 semana) y se puede subir desde
    # .env una vez confirmado que todo el sitio funciona bien en HTTPS.
    SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=604800, cast=int)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = config('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=False, cast=bool)

# Métricas comerciales — anónimas, sin cookies ni datos personales (ver
# apps/metricas). Apagado por defecto: hay que decidirlo explícitamente.
METRICAS_HABILITADAS = config('METRICAS_HABILITADAS', default=False, cast=bool)

# WhatsApp
WHATSAPP_NUMBER = config('WHATSAPP_NUMBER', default='549XXXXXXXXXX')

# Mercado Pago
MP_ACCESS_TOKEN = config('MP_ACCESS_TOKEN', default='')
FRONTEND_URL    = config('FRONTEND_URL', default='http://localhost:5175')
BACKEND_URL     = config('BACKEND_URL', default='http://localhost:8001')

# Email
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend' if DEBUG else 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='')
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='')

# Logging — necesario para que los logger.info/warning/error de las apps
# (webhook de MP, vencer_pedidos, etc.) se vean en consola (dev) o en el
# log de Gunicorn (prod, vía journalctl/--error-logfile).
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '[{asctime}] {levelname} {name}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# Jazzmin — panel de admin mejorado
JAZZMIN_SETTINGS = {
    'site_title': 'Esencias de la naturaleza',
    'site_header': 'Esencias Admin',
    'site_brand': '🌿 Esencias',
    'welcome_sign': 'Panel de administración',
    'search_model': ['productos.Producto', 'pedidos.Pedido'],
    'topmenu_links': [
        {'name': 'Ver tienda', 'url': '/', 'new_window': True},
    ],
    'icons': {
        'productos.Categoria': 'fas fa-tags',
        'productos.Producto': 'fas fa-leaf',
        'pedidos.Pedido': 'fas fa-shopping-bag',
        'pedidos.ItemPedido': 'fas fa-list',
        'auth.User': 'fas fa-user',
    },
    'show_sidebar': True,
    'navigation_expanded': True,
}

# Sentry — opcional. La app funciona igual si no está configurado o si el
# paquete no está instalado (el import está guardado detrás de un try/except
# a propósito). Nunca manda datos de request completos por defecto (Sentry ya
# excluye contraseñas y cookies de forma automática, pero se desactiva
# send_default_pii para no mandar tampoco IP/usuario de más).
SENTRY_DSN = config('SENTRY_DSN', default='')
if SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration

        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[DjangoIntegration()],
            traces_sample_rate=config('SENTRY_TRACES_SAMPLE_RATE', default=0.0, cast=float),
            send_default_pii=False,
            environment='production' if not DEBUG else 'development',
        )
    except ImportError:
        import logging
        logging.getLogger(__name__).warning(
            'SENTRY_DSN está configurado pero sentry-sdk no está instalado '
            '(pip install sentry-sdk). Sentry queda deshabilitado.'
        )
