from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Producto, Categoria
from .serializers import ProductoPublicoSerializer, ProductoAdminSerializer, CategoriaSerializer


# ── Categorías públicas ───────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def categorias_list(request):
    """Lista categorías activas (público)."""
    qs = Categoria.objects.filter(activo=True)
    return Response(CategoriaSerializer(qs, many=True).data)


# ── Productos públicos ────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def productos_list(request):
    """Lista productos activos. Acepta ?categoria=, ?search=, ?orden=."""
    from django.db.models import Q
    qs = Producto.objects.filter(activo=True).select_related('categoria')

    categoria_slug = request.query_params.get('categoria')
    if categoria_slug:
        qs = qs.filter(categoria__slug=categoria_slug)

    search = request.query_params.get('search', '').strip()
    if search:
        qs = qs.filter(Q(nombre__icontains=search) | Q(descripcion__icontains=search))

    orden = request.query_params.get('orden', '')
    if orden == 'precio_asc':
        qs = qs.order_by('precio', 'nombre')
    elif orden == 'precio_desc':
        qs = qs.order_by('-precio', 'nombre')
    elif orden == 'nuevos':
        qs = qs.order_by('-created_at')
    else:
        qs = qs.order_by('nombre')

    serializer = ProductoPublicoSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def producto_detail(request, pk):
    """Detalle de un producto por id (público)."""
    producto = get_object_or_404(Producto, pk=pk, activo=True)
    serializer = ProductoPublicoSerializer(producto, context={'request': request})
    return Response(serializer.data)


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
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    categoria.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Productos admin ───────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def admin_productos_list(request):
    """GET: lista todos los productos. POST: crea uno nuevo."""
    if request.method == 'GET':
        qs = Producto.objects.all().select_related('categoria').order_by('-activo', 'nombre')
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
