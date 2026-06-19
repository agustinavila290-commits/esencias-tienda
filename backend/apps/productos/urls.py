from django.urls import path
from . import views

urlpatterns = [
    # Públicos
    path('categorias/', views.categorias_list, name='categorias-list'),
    path('productos/', views.productos_list, name='productos-list'),
    path('productos/<int:pk>/', views.producto_detail, name='producto-detail'),

    # Admin — categorías
    path('admin/categorias/', views.admin_categorias_list, name='admin-categorias-list'),
    path('admin/categorias/<int:pk>/', views.admin_categoria_detail, name='admin-categoria-detail'),

    # Admin — productos
    path('admin/productos/', views.admin_productos_list, name='admin-productos-list'),
    path('admin/productos/<int:pk>/', views.admin_producto_detail, name='admin-producto-detail'),
]
