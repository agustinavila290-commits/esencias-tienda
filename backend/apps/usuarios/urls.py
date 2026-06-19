from django.urls import path
from .views import (
    RegistroView, LoginView, LogoutView, GoogleAuthView,
    MeView, RecuperarPasswordView, RecuperarPasswordConfirmarView,
)

urlpatterns = [
    path('registro/',                      RegistroView.as_view(),                  name='usuario-registro'),
    path('login/',                         LoginView.as_view(),                     name='usuario-login'),
    path('logout/',                        LogoutView.as_view(),                    name='usuario-logout'),
    path('google/',                        GoogleAuthView.as_view(),                name='usuario-google'),
    path('me/',                            MeView.as_view(),                        name='usuario-me'),
    path('recuperar-password/',            RecuperarPasswordView.as_view(),         name='usuario-recuperar-password'),
    path('recuperar-password/confirmar/',  RecuperarPasswordConfirmarView.as_view(), name='usuario-recuperar-confirmar'),
]
