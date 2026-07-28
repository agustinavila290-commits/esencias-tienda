from django.urls import path
from . import views

urlpatterns = [
    # Público
    path('pedidos/crear/',                          views.crear_pedido,           name='pedido-crear'),
    path('pedidos/<int:pk>/crear-preferencia/',     views.crear_preferencia_mp,   name='pedido-crear-preferencia'),
    path('pedidos/mp-webhook/',                     views.mp_webhook,             name='pedido-mp-webhook'),
    path('pedidos/<str:codigo>/seguimiento/',        views.pedido_seguimiento,     name='pedido-seguimiento'),

    # Admin
    path('admin/pedidos/',                          views.admin_pedidos_list,     name='admin-pedidos-list'),
    path('admin/pedidos/<int:pk>/confirmar/',        views.admin_confirmar_pedido, name='admin-pedido-confirmar'),
    path('admin/pedidos/<int:pk>/cancelar/',         views.admin_cancelar_pedido,  name='admin-pedido-cancelar'),
    path('admin/pedidos/<int:pk>/enviado/',          views.admin_marcar_enviado,   name='admin-pedido-enviado'),
    path('admin/pedidos/<int:pk>/entregado/',        views.admin_marcar_entregado, name='admin-pedido-entregado'),
]
