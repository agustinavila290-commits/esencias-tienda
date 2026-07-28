from decimal import Decimal, InvalidOperation

from django.core.cache import cache
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Producto, Categoria
from .serializers import ProductoPublicoSerializer, ProductoAdminSerializer, CategoriaSerializer

# Caché simple (proceso local) para la lista pública de categorías: cambia
# muy poco seguido y nunca lleva datos de stock, así que un TTL corto es
# seguro. NO se usa para productos: ahí el stock puede cambiar en segundos
# durante una compra y no debe quedar desactualizado.
CATEGORIAS_CACHE_KEY = 'categorias_publicas_v1'
CATEGORIAS_CACHE_TTL = 60  # segundos


class ProductoPagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = 'page_size'
    max_page_size = 100


def _parse_decimal(valor):
    if valor in (None, ''):
        return None
    try:
        return Decimal(valor)
    except (InvalidOperation, ValueError, TypeError):
        return None


def _filtrar_productos(qs, params):
    """Filtros compartidos por el catálogo público (usado por productos_list
    y, con categoria fija, por las páginas de categoría en el frontend)."""
    categoria_slug = params.get('categoria')
    if categoria_slug:
        qs = qs.filter(categoria__slug=categoria_slug)

    search = params.get('search', '').strip()
    if search:
        qs = qs.filter(
            Q(nombre__icontains=search)
            | Q(descripcion__icontains=search)
            | Q(categoria__nombre__icontains=search)
        )

    disponible = params.get('disponible')
    if disponible is not None:
        quiere_disponibles = disponible.strip().lower() in ('1', 'true', 'si', 'sí')
        if quiere_disponibles:
            qs = qs.filter(stock_disponible_anotado__gt=0)
        else:
            qs = qs.filter(stock_disponible_anotado=0)

    precio_min = _parse_decimal(params.get('precio_min'))
    if precio_min is not None:
        qs = qs.filter(precio__gte=precio_min)

    precio_max = _parse_decimal(params.get('precio_max'))
    if precio_max is not None:
        qs = qs.filter(precio__lte=precio_max)

    orden = params.get('orden', '')
    if orden == 'precio_asc':
        qs = qs.order_by('precio', 'nombre')
    elif orden == 'precio_desc':
        qs = qs.order_by('-precio', 'nombre')
    elif orden == 'nuevos':
        qs = qs.order_by('-created_at')
    else:
        qs = qs.order_by('nombre')

    return qs


# ── Categorías públicas ───────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def categorias_list(request):
    """Lista categorías activas (público). Cacheada brevemente: no lleva stock."""
    data = cache.get(CATEGORIAS_CACHE_KEY)
    if data is None:
        qs = Categoria.objects.filter(activo=True)
        data = CategoriaSerializer(qs, many=True).data
        cache.set(CATEGORIAS_CACHE_KEY, data, CATEGORIAS_CACHE_TTL)
    return Response(data)


# ── Productos públicos ────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def productos_list(request):
    """Lista paginada de productos activos.

    Acepta: ?categoria=<slug> ?search= ?orden=precio_asc|precio_desc|nuevos
    ?disponible=1|0 ?precio_min= ?precio_max= ?page= ?page_size=
    """
    qs = Producto.objects.filter(activo=True).select_related('categoria').con_disponibilidad()
    qs = _filtrar_productos(qs, request.query_params)

    paginator = ProductoPagination()
    page = paginator.paginate_queryset(qs, request)
    serializer = ProductoPublicoSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def producto_detail(request, pk):
    """Detalle de un producto por id (público). Se mantiene por compatibilidad
    con enlaces existentes; la URL canónica nueva es por slug (ver abajo)."""
    producto = get_object_or_404(
        Producto.objects.select_related('categoria').con_disponibilidad(),
        pk=pk, activo=True,
    )
    serializer = ProductoPublicoSerializer(producto, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def producto_por_slug(request, slug):
    """Detalle de un producto por slug (URL pública canónica, ej.
    /productos/sahumerio-palo-santo) + hasta 4 productos relacionados de la
    misma categoría."""
    producto = get_object_or_404(
        Producto.objects.select_related('categoria').con_disponibilidad(),
        slug=slug, activo=True,
    )
    data = ProductoPublicoSerializer(producto, context={'request': request}).data

    if producto.categoria_id:
        relacionados_qs = (
            Producto.objects.filter(activo=True, categoria_id=producto.categoria_id)
            .exclude(pk=producto.pk)
            .select_related('categoria')
            .con_disponibilidad()
            .order_by('nombre')[:4]
        )
        data['relacionados'] = ProductoPublicoSerializer(
            relacionados_qs, many=True, context={'request': request}
        ).data
    else:
        data['relacionados'] = []

    return Response(data)


# ── Categorías admin ──────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_categorias_list(request):
    """GET: lista todas las categorías. POST: crea una."""
    if request.method == 'GET':
        qs = Categoria.objects.all()
        return Response(CategoriaSerializer(qs, many=True).data)
    serializer = CategoriaSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        cache.delete(CATEGORIAS_CACHE_KEY)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_categoria_detail(request, pk):
    """GET / PATCH / DELETE de una categoría."""
    categoria = get_object_or_404(Categoria, pk=pk)
    if request.method == 'GET':
        return Response(CategoriaSerializer(categoria).data)
    if request.method == 'PATCH':
        serializer = CategoriaSerializer(categoria, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            cache.delete(CATEGORIAS_CACHE_KEY)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    categoria.delete()
    cache.delete(CATEGORIAS_CACHE_KEY)
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Productos admin ───────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def admin_productos_list(request):
    """GET: lista todos los productos. POST: crea uno nuevo."""
    if request.method == 'GET':
        qs = (
            Producto.objects.all()
            .select_related('categoria')
            .con_disponibilidad()
            .order_by('-activo', 'nombre')
        )
        serializer = ProductoAdminSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    serializer = ProductoAdminSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def admin_producto_detail(request, pk):
    """GET / PATCH / DELETE de un producto."""
    producto = get_object_or_404(Producto, pk=pk)

    if request.method == 'GET':
        serializer = ProductoAdminSerializer(producto, context={'request': request})
        return Response(serializer.data)

    if request.method == 'PATCH':
        serializer = ProductoAdminSerializer(
            producto, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    producto.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
