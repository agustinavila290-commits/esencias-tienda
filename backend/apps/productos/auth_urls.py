from django.urls import path
from .auth_views import me_view, AdminLoginView, AdminRefreshView, AdminLogoutView

urlpatterns = [
    path('login/', AdminLoginView.as_view(), name='admin-login'),
    path('refresh/', AdminRefreshView.as_view(), name='admin-refresh'),
    path('logout/', AdminLogoutView.as_view(), name='admin-logout'),
    path('me/', me_view, name='auth-me'),
]
