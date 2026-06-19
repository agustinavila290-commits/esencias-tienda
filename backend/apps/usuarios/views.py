from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import UsuarioPerfil
from .serializers import RegistroSerializer, LoginSerializer, UsuarioSerializer


def _get_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR', 'unknown')


def _rate_limit(key: str, max_attempts: int = 10, window: int = 300) -> bool:
    count = cache.get(key, 0)
    if count >= max_attempts:
        return False
    cache.set(key, count + 1, window)
    return True


def _tokens_para_usuario(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
    }


def _verify_google_token(credential: str) -> dict:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    idinfo = id_token.verify_oauth2_token(
        credential,
        google_requests.Request(),
        settings.GOOGLE_CLIENT_ID,
    )
    return {
        'google_id': idinfo['sub'],
        'email':     idinfo['email'],
        'nombre':    idinfo.get('given_name', ''),
        'apellido':  idinfo.get('family_name', ''),
    }


class RegistroView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not _rate_limit(f'registro:{_get_ip(request)}', max_attempts=10, window=3600):
            return Response({'error': 'Demasiados intentos. Intentá de nuevo en 1 hora.'}, status=429)

        serializer = RegistroSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        user = serializer.save()
        return Response(_tokens_para_usuario(user), status=201)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not _rate_limit(f'login:{_get_ip(request)}', max_attempts=10, window=300):
            return Response({'error': 'Demasiados intentos. Intentá de nuevo en 5 minutos.'}, status=429)

        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        email    = serializer.validated_data['email'].lower()
        password = serializer.validated_data['password']

        user = authenticate(request, email=email, password=password)
        if not user:
            return Response({'error': 'Email o contraseña incorrectos.'}, status=401)
        if not user.is_active:
            return Response({'error': 'Tu cuenta está desactivada.'}, status=401)

        return Response(_tokens_para_usuario(user))


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh', ''))
            token.blacklist()
        except TokenError:
            pass
        return Response({'mensaje': 'Sesión cerrada correctamente.'})


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        credential = request.data.get('credential')
        if not credential:
            return Response({'error': 'Token de Google requerido.'}, status=400)
        if not getattr(settings, 'GOOGLE_CLIENT_ID', ''):
            return Response({'error': 'Google OAuth no está configurado en el servidor.'}, status=503)

        try:
            datos = _verify_google_token(credential)
        except Exception:
            return Response({'error': 'Token de Google inválido o expirado.'}, status=400)

        email     = datos['email'].lower()
        google_id = datos['google_id']

        # Buscar por google_id (usuario ya usó Google antes)
        perfil = UsuarioPerfil.objects.filter(google_id=google_id).select_related('usuario').first()
        if perfil:
            return Response(_tokens_para_usuario(perfil.usuario))

        # Buscar por email (vincular cuenta local existente)
        try:
            user = User.objects.get(email=email)
            perfil, _ = UsuarioPerfil.objects.get_or_create(usuario=user)
            perfil.google_id = google_id
            perfil.proveedor = 'google'
            perfil.save()
        except User.DoesNotExist:
            # Crear usuario nuevo
            user = User.objects.create_user(
                username=email,
                email=email,
                first_name=datos['nombre'],
                last_name=datos['apellido'],
            )
            user.set_unusable_password()
            user.save()
            UsuarioPerfil.objects.create(usuario=user, proveedor='google', google_id=google_id)

        return Response(_tokens_para_usuario(user), status=201)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UsuarioSerializer(request.user).data)


class RecuperarPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        if not email:
            return Response({'error': 'El email es requerido.'}, status=400)

        # Respuesta genérica — no revelar si el email existe
        respuesta_ok = Response({'mensaje': 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.'})

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return respuesta_ok

        uid   = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        link  = f"{settings.FRONTEND_URL}/recuperar-password/{uid}/{token}/"

        send_mail(
            subject='Restablecer contraseña — Esencias de la naturaleza',
            message=(
                f"Hola {user.first_name or user.email},\n\n"
                f"Recibimos una solicitud para restablecer tu contraseña.\n\n"
                f"Hacé clic en el siguiente enlace (válido por 24 horas):\n{link}\n\n"
                f"Si no solicitaste el cambio, ignorá este mensaje.\n\n"
                f"Saludos,\nEsencias de la naturaleza"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL or 'noreply@esencias.com',
            recipient_list=[email],
            fail_silently=True,
        )
        return respuesta_ok


class RecuperarPasswordConfirmarView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid            = request.data.get('uid', '')
        token          = request.data.get('token', '')
        nueva_password = request.data.get('nueva_password', '')

        if not all([uid, token, nueva_password]):
            return Response({'error': 'Todos los campos son requeridos.'}, status=400)
        if len(nueva_password) < 8:
            return Response({'error': 'La contraseña debe tener al menos 8 caracteres.'}, status=400)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user    = User.objects.get(pk=user_id)
        except (TypeError, ValueError, User.DoesNotExist):
            return Response({'error': 'Enlace inválido.'}, status=400)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'El enlace expiró o ya fue utilizado.'}, status=400)

        user.set_password(nueva_password)
        user.save()
        return Response({'mensaje': 'Contraseña actualizada. Ya podés iniciar sesión.'})
