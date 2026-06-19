import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { productosService } from '../services/api'
import { useCarrito } from '../context/CarritoContext'
import ProductCard from '../components/ProductCard'

function formatPrecio(n) {
  return '$' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

export default function Producto() {
  const { id } = useParams()
  const [producto, setProducto] = useState(null)
  const [relacionados, setRelacionados] = useState([])
  const [cargando, setCargando] = useState(true)
  const { agregar, setAbierto } = useCarrito()

  useEffect(() => {
    if (producto) {
      document.title = `${producto.nombre} — Esencias de la naturaleza`
    }
  }, [producto])

  useEffect(() => {
    setCargando(true)
    productosService.get(id)
      .then(r => {
        setProducto(r.data)
        return productosService.list()
      })
      .then(r => {
        const idNum = parseInt(id)
        const otros = r.data.filter(p => p.id !== idNum && p.activo !== false)
        const shuffled = [...otros].sort(() => Math.random() - 0.5).slice(0, 3)
        setRelacionados(shuffled)
      })
      .catch(() => setProducto(null))
      .finally(() => setCargando(false))
  }, [id])

  const handleAgregar = () => {
    if (producto) {
      agregar(producto)
      setAbierto(true)
    }
  }

  if (cargando) return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="h-4 w-32 bg-gray-200 rounded-full animate-pulse mb-6" />
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
        <div className="p-5 space-y-3">
          <div className="h-7 bg-gray-200 rounded-full animate-pulse w-3/4" />
          <div className="h-8 bg-gray-200 rounded-full animate-pulse w-1/3" />
          <div className="h-4 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-4 bg-gray-200 rounded-full animate-pulse w-5/6" />
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse mt-4" />
        </div>
      </div>
    </div>
  )

  if (!producto) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-4">😕</p>
      <p className="text-gray-600">Producto no encontrado.</p>
      <Link to="/" className="btn-primary mt-4 inline-flex">← Volver al catálogo</Link>
    </div>
  )

  const agotado = producto.stock_disponible === 0
  const pocasUnidades = !agotado && producto.stock_disponible <= 3

  return (
    <div className="pb-8">
      {/* Breadcrumb */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-2">
        <Link to="/" className="text-tierra-600 hover:text-tierra-800 text-sm flex items-center gap-1.5 transition-colors">
          <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current flex-shrink-0">
            <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
          </svg>
          Volver al catálogo
        </Link>
      </div>

      {/* Tarjeta principal */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-tierra-100">

          {/* Imagen full */}
          <div className="relative aspect-[4/3] bg-tierra-50 overflow-hidden">
            {producto.imagen_url ? (
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl text-tierra-200">
                🌿
              </div>
            )}

            {/* Overlay badges */}
            {agotado && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="bg-white text-gray-800 font-bold px-6 py-2 rounded-full text-sm">Sin stock</span>
              </div>
            )}
            {pocasUnidades && (
              <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                ¡Solo quedan {producto.stock_disponible}!
              </span>
            )}
            {producto.categoria_nombre && (
              <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-tierra-700 text-xs font-bold px-3 py-1 rounded-full shadow">
                {producto.categoria_nombre}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="p-5 space-y-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-800 leading-snug">{producto.nombre}</h1>
              <p className="text-3xl font-bold text-tierra-700 mt-2">
                {formatPrecio(producto.precio)}
              </p>
            </div>

            {producto.descripcion && (
              <p className="text-gray-600 leading-relaxed text-sm">{producto.descripcion}</p>
            )}

            {/* Stock indicator */}
            <div className="flex items-center gap-2 text-sm">
              {agotado ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-red-500 font-medium">Sin stock disponible</span>
                </>
              ) : pocasUnidades ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="text-amber-600 font-medium">¡Últimas {producto.stock_disponible} unidades!</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-naturaleza-500 flex-shrink-0" />
                  <span className="text-naturaleza-600 font-medium">Disponible</span>
                </>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={handleAgregar}
              disabled={agotado}
              className={`w-full ${agotado ? 'bg-gray-100 text-gray-400 cursor-not-allowed py-4 rounded-xl font-semibold' : 'btn-primary'}`}
            >
              {agotado ? 'Sin stock' : '🛒 Agregar al carrito'}
            </button>
          </div>
        </div>
      </div>

      {/* Productos relacionados */}
      {relacionados.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mt-10">
          <h2 className="font-display text-xl font-bold text-gray-800 mb-4">También te puede interesar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {relacionados.map((p, i) => (
              <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <ProductCard producto={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
