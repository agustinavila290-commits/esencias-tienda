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
        const otros = (r.data.results || []).filter(p => p.id !== idNum && p.activo !== false)
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
      <div className="h-4 w-32 bg-background-secondary rounded-full animate-pulse mb-6" />
      <div className="bg-surface rounded-card overflow-hidden shadow-soft">
        <div className="aspect-[4/3] bg-background-secondary animate-pulse" />
        <div className="p-5 space-y-3">
          <div className="h-7 bg-background-secondary rounded-full animate-pulse w-3/4" />
          <div className="h-8 bg-background-secondary rounded-full animate-pulse w-1/3" />
          <div className="h-4 bg-background-secondary rounded-full animate-pulse" />
          <div className="h-4 bg-background-secondary rounded-full animate-pulse w-5/6" />
          <div className="h-12 bg-background-secondary rounded-xl animate-pulse mt-4" />
        </div>
      </div>
    </div>
  )

  if (!producto) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-4">😕</p>
      <p className="text-text-secondary">Producto no encontrado.</p>
      <Link to="/" className="btn-primary mt-4 inline-flex">← Volver al catálogo</Link>
    </div>
  )

  const agotado = producto.stock_disponible === 0
  const pocasUnidades = !agotado && producto.stock_disponible <= 3

  return (
    <div className="pb-8">
      {/* Breadcrumb */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-2">
        <Link to="/" className="text-brand-primary-700 hover:text-brand-primary-900 text-sm flex items-center gap-1.5 transition-colors">
          <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current flex-shrink-0">
            <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
          </svg>
          Volver al catálogo
        </Link>
      </div>

      {/* Tarjeta principal */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-surface rounded-card overflow-hidden shadow-soft border border-border-soft">

          {/* Imagen full */}
          <div className="relative aspect-[4/3] bg-background-secondary overflow-hidden">
            {producto.imagen_url ? (
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl text-brand-primary-200">
                🌿
              </div>
            )}

            {/* Overlay badges */}
            {agotado && (
              <div className="absolute inset-0 bg-text-primary/30 flex items-center justify-center">
                <span className="bg-surface-elevated text-text-primary font-bold px-6 py-2 rounded-full text-sm">Sin stock</span>
              </div>
            )}
            {pocasUnidades && (
              <span className="absolute top-3 right-3 badge-warning shadow-soft">
                ¡Solo quedan {producto.stock_disponible}!
              </span>
            )}
            {producto.categoria_nombre && (
              <span className="absolute top-3 left-3 badge bg-surface-elevated/90 backdrop-blur-sm text-text-secondary shadow-soft">
                {producto.categoria_nombre}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="p-5 space-y-4">
            <div>
              <h1 className="font-display text-2xl font-semibold text-text-primary leading-snug">{producto.nombre}</h1>
              <p className="text-3xl font-bold text-brand-primary-700 mt-2">
                {formatPrecio(producto.precio)}
              </p>
            </div>

            {producto.descripcion && (
              <p className="text-text-secondary leading-relaxed text-sm">{producto.descripcion}</p>
            )}

            {/* Stock indicator */}
            <div className="flex items-center gap-2 text-sm">
              {agotado ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-error flex-shrink-0" />
                  <span className="text-error font-medium">Sin stock disponible</span>
                </>
              ) : pocasUnidades ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
                  <span className="text-warning font-medium">¡Últimas {producto.stock_disponible} unidades!</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                  <span className="text-success font-medium">Disponible</span>
                </>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={handleAgregar}
              disabled={agotado}
              className={`w-full ${agotado ? 'bg-background-secondary text-text-secondary cursor-not-allowed py-4 rounded-xl font-semibold' : 'btn-primary'}`}
            >
              {agotado ? 'Sin stock' : '🛒 Agregar al carrito'}
            </button>
          </div>
        </div>
      </div>

      {/* Productos relacionados */}
      {relacionados.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mt-10">
          <h2 className="font-display text-xl font-semibold text-text-primary mb-4">También te puede interesar</h2>
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
