import logging

from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from backend.rate_limit import get_client_ip, rate_limit_ok

logger = logging.getLogger(__name__)

# El refresh token del panel admin vive en una cookie HttpOnly propia (no en
# localStorage, y con un path acotado a /api/auth/ para que ni siquiera viaje
# en requests a otras rutas de la API). El access token sigue viajando en el
# body / header Authorization como antes — solo cambió dónde vive el refresh.
REFRESH_COOKIE_NAME = 'admin_refresh_token'
REFRESH_COOKIE_PATH = '/api/auth/'


def _set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        str(refresh_token),
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        path=REFRESH_COOKIE_PATH,
        max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
    )


def _clear_refresh_cookie(response):
    response.delete_cookie(REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_staff': user.is_staff,
    })


class AdminLoginView(APIView):
    """Login del panel admin: valida usuario/contraseña igual que el
    TokenObtainPairView estándar de simplejwt, pero el refresh token nunca
    llega al JavaScript del navegador — se manda como cookie HttpOnly. El
    body de la respuesta solo trae el access token (de corta duración)."""
    permission_classes = [AllowAny]

    def post(self, request):
        ip = get_client_ip(request)
        if not rate_limit_ok(f'admin-login:{ip}', max_attempts=10, window_seconds=300):
            logger.warning('Login admin bloqueado por rate limit (ip=%s)', ip)
            return Response({'error': 'Demasiados intentos. Intentá de nuevo en unos minutos.'}, status=429)

        serializer = TokenObtainPairSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning('Login admin fallido (ip=%s)', ip)
            return Response({'error': 'Usuario o contraseña incorrectos.'}, status=401)

        access = serializer.validated_data['access']
        refresh = serializer.validated_data['refresh']

        response = Response({'access': str(access)})
        _set_refresh_cookie(response, refresh)
        return response


class AdminRefreshView(APIView):
    """Renueva el access token leyendo el refresh desde la cookie HttpOnly
    (nunca desde el body). Si `ROTATE_REFRESH_TOKENS` está activo (lo está),
    también rota la cookie con el nuevo refresh token."""
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not token_str:
            return Response({'error': 'No hay sesión activa.'}, status=401)

        serializer = TokenRefreshSerializer(data={'refresh': token_str})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            response = Response({'error': 'La sesión expiró. Iniciá sesión de nuevo.'}, status=401)
            _clear_refresh_cookie(response)
            return response

        response = Response({'access': serializer.validated_data['access']})
        nuevo_refresh = serializer.validated_data.get('refresh')
        if nuevo_refresh:
            _set_refresh_cookie(response, nuevo_refresh)
        return response


class AdminLogoutView(APIView):
    """Invalida el refresh token (blacklist) y borra la cookie. Se permite
    llamar sin access token válido —puede haber expirado— total lo único
    que hace falta es la cookie de refresh."""
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if token_str:
            try:
                RefreshToken(token_str).blacklist()
            except TokenError:
                pass
        response = Response({'mensaje': 'Sesión cerrada correctamente.'})
        _clear_refresh_cookie(response)
        return response
