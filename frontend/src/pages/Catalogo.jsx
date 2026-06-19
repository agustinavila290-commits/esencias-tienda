import { useState, useEffect, useMemo } from 'react'
import { productosService, categoriasService } from '../services/api'
import ProductCard from '../components/ProductCard'
import { filtrarProductos } from '../utils/filtrarProductos'

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="aspect-square bg-gray-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-3.5 bg-gray-200 rounded-full animate-pulse w-2/3" />
        <div className="h-5 bg-gray-200 rounded-full animate-pulse w-1/2 mt-2" />
        <div className="h-10 bg-gray-200 rounded-xl animate-pulse mt-1" />
      </div>
    </div>
  )
}

export default function Catalogo() {
  const [productos, setProductos]   = useState([])
  const [categorias, setCategorias] = useState([])
  const [tabActivo, setTabActivo]   = useState('todos')
  const [busqueda, setBusqueda]     = useState('')
  const [orden, setOrden]           = useState('nombre')
  const [cargando, setCargando]     = useState(true)
  const [error, setError]           = useState('')

  useEffect(() => {
    document.title = 'Catálogo — Esencias de la naturaleza'
  }, [])

  useEffect(() => {
    Promise.all([productosService.list(), categoriasService.list()])
      .then(([resProd, resCat]) => {
        setProductos(resProd.data)
        setCategorias(resCat.data)
      })
      .catch(() => setError('No se pudo cargar el catálogo. Intentá de nuevo.'))
      .finally(() => setCargando(false))
  }, [])

  const productosFiltrados = useMemo(
    () => filtrarProductos(productos, { tabActivo, busqueda, orden }),
    [productos, tabActivo, busqueda, orden]
  )

  if (error) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-4">😕</p>
      <p className="text-gray-600">{error}</p>
      <button onClick={() => window.location.reload()} className="btn-primary mt-4">
        Reintentar
      </button>
    </div>
  )

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-tierra-900 via-tierra-800 to-tierra-600 text-white">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-naturaleza-800/20 blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative max-w-4xl mx-auto px-6 py-12 sm:py-18 flex items-center gap-8">
          <img
            src="/logo.jpg"
            alt="Esencias de la naturaleza"
            className="hidden sm:block w-32 h-32 object-cover rounded-full flex-shrink-0 border-4 border-white/20 shadow-2xl"
          />
          <div>
            <p className="text-tierra-300 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
              Tienda online
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-white">
              Esencias<br />
              <span className="text-tierra-300">de la naturaleza</span>
            </h1>
            <p className="mt-4 text-tierra-200/80 text-base max-w-xs leading-relaxed">
              Sahumerios artesanales elaborados con ingredientes naturales.
            </p>
            <div className="mt-6 flex items-center gap-2 text-tierra-400 text-sm">
              <span className="inline-block animate-bounce">↓</span>
              <span>Ver productos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Catálogo */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs de categorías */}
        {!cargando && categorias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-4 px-4">
            <button
              onClick={() => setTabActivo('todos')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                tabActivo === 'todos'
                  ? 'bg-tierra-700 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-tierra-300 hover:text-tierra-700'
              }`}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setTabActivo(cat.slug)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  tabActivo === cat.slug
                    ? 'bg-tierra-700 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-tierra-300 hover:text-tierra-700'
                }`}
              >
                {cat.icono ? `${cat.icono} ` : ''}{cat.nombre}
              </button>
            ))}
          </div>
        )}

        {/* Búsqueda y orden */}
        {!cargando && productos.length > 0 && (
          <div className="flex gap-2 mb-5">
            <div className="relative flex-1">
              <svg viewBox="0 0 20 20" className="w-4 h-4 fill-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
              </svg>
              <input
                type="search"
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-tierra-400 focus:ring-1 focus:ring-tierra-400 bg-white"
              />
            </div>
            <select
              value={orden}
              onChange={e => setOrden(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 bg-white focus:outline-none focus:border-tierra-400 flex-shrink-0"
            >
              <option value="nombre">A–Z</option>
              <option value="precio_asc">Menor precio</option>
              <option value="precio_desc">Mayor precio</option>
              <option value="nuevos">Más nuevos</option>
            </select>
          </div>
        )}

        {/* Conteo */}
        {!cargando && productos.length > 0 && (
          <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-wide">
            {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
            {busqueda && ` para "${busqueda}"`}
          </p>
        )}

        {/* Grilla */}
        {cargando ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🌿</p>
            <p className="text-gray-500">Próximamente habrá productos disponibles.</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>{busqueda ? `No hay resultados para "${busqueda}".` : 'No hay productos en esta categoría.'}</p>
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="text-sm text-tierra-600 mt-2 hover:underline">
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {productosFiltrados.map((p, i) => (
              <div
                key={p.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
              >
                <ProductCard producto={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
