import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { productosService, categoriasService } from '../services/api'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { SITE_URL, TIENDA_NOMBRE } from '../config'

const JSON_LD_ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: TIENDA_NOMBRE,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.jpg`,
  description: 'Sahumerios artesanales elaborados con ingredientes naturales.',
}

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
  const [searchParams, setSearchParams] = useSearchParams()

  const tabActivo   = searchParams.get('categoria') || 'todos'
  const orden       = searchParams.get('orden') || 'nombre'
  const disponible  = searchParams.get('disponible') || ''
  const precioMin   = searchParams.get('precio_min') || ''
  const precioMax   = searchParams.get('precio_max') || ''
  const busquedaUrl = searchParams.get('search') || ''

  // Input de búsqueda con estado propio + debounce, para no pegarle a la API
  // en cada tecla — pero el valor final igual queda reflejado en la URL.
  const [busquedaInput, setBusquedaInput] = useState(busquedaUrl)

  const [categorias, setCategorias]   = useState([])
  const [productos, setProductos]     = useState([])
  const [count, setCount]             = useState(0)
  const [nextUrl, setNextUrl]         = useState(null)
  const [cargando, setCargando]       = useState(true)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    categoriasService.list().then(r => setCategorias(r.data)).catch(() => {})
  }, [])

  const actualizarParam = (clave, valor) => {
    const next = new URLSearchParams(searchParams)
    if (valor) next.set(clave, valor)
    else next.delete(clave)
    setSearchParams(next, { replace: true })
  }

  // Sincroniza el input de búsqueda -> URL con debounce de 400ms.
  useEffect(() => {
    const id = setTimeout(() => {
      if (busquedaInput !== busquedaUrl) actualizarParam('search', busquedaInput)
    }, 400)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaInput])

  // Si el usuario cambia de filtro antes de que responda el pedido anterior,
  // se cancela ese pedido obsoleto en vez de dejar que "gane" una respuesta
  // vieja que pise el resultado del filtro actual.
  useEffect(() => {
    const controller = new AbortController()
    setCargando(true)
    setError('')
    productosService.list({
      categoria: tabActivo === 'todos' ? undefined : tabActivo,
      search: busquedaUrl || undefined,
      orden,
      disponible: disponible || undefined,
      precio_min: precioMin || undefined,
      precio_max: precioMax || undefined,
    }, { signal: controller.signal })
      .then(r => {
        setProductos(r.data.results)
        setCount(r.data.count)
        setNextUrl(r.data.next)
      })
      .catch(err => {
        if (err.code === 'ERR_CANCELED') return
        setError('No se pudo cargar el catálogo. Intentá de nuevo.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false)
      })

    return () => controller.abort()
  }, [tabActivo, busquedaUrl, orden, disponible, precioMin, precioMax])

  const cargarMas = () => {
    if (!nextUrl) return
    setCargandoMas(true)
    api.get(nextUrl)
      .then(r => {
        setProductos(prev => [...prev, ...r.data.results])
        setNextUrl(r.data.next)
      })
      .finally(() => setCargandoMas(false))
  }

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
      <Seo
        title="Catálogo"
        description="Sahumerios artesanales elaborados con ingredientes naturales. Pedí por WhatsApp o pagá online con Mercado Pago."
        path="/"
        jsonLd={JSON_LD_ORGANIZATION}
      />
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
              Sahumerios artesanales elaborados con ingredientes naturales. Pedís
              por WhatsApp o pagás online con Mercado Pago.
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
        {categorias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-4 px-4">
            <button
              onClick={() => actualizarParam('categoria', '')}
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
                onClick={() => actualizarParam('categoria', cat.slug)}
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
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="relative flex-1 min-w-[160px]">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4 fill-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              type="search"
              placeholder="Buscar productos..."
              aria-label="Buscar productos"
              value={busquedaInput}
              onChange={e => setBusquedaInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-tierra-400 focus:ring-1 focus:ring-tierra-400 bg-white"
            />
          </div>
          <select
            value={orden}
            aria-label="Ordenar por"
            onChange={e => actualizarParam('orden', e.target.value === 'nombre' ? '' : e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 bg-white focus:outline-none focus:border-tierra-400 flex-shrink-0"
          >
            <option value="nombre">A–Z</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
            <option value="nuevos">Más nuevos</option>
          </select>
        </div>

        {/* Filtros: disponibilidad + rango de precio */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={disponible === '1'}
              onChange={e => actualizarParam('disponible', e.target.checked ? '1' : '')}
              className="accent-tierra-600"
            />
            Solo disponibles
          </label>
          <input
            type="number" min="0" placeholder="Precio mín." aria-label="Precio mínimo"
            value={precioMin}
            onChange={e => actualizarParam('precio_min', e.target.value)}
            className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-tierra-400"
          />
          <input
            type="number" min="0" placeholder="Precio máx." aria-label="Precio máximo"
            value={precioMax}
            onChange={e => actualizarParam('precio_max', e.target.value)}
            className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-tierra-400"
          />
          <span className="text-xs text-gray-400 ml-auto font-medium uppercase tracking-wide whitespace-nowrap">
            {count} producto{count !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grilla */}
        {cargando ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>{busquedaUrl ? `No hay resultados para "${busquedaUrl}".` : 'No hay productos con estos filtros.'}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {productos.map((p, i) => (
                <div
                  key={p.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
                >
                  <ProductCard producto={p} />
                </div>
              ))}
            </div>

            {nextUrl && (
              <div className="text-center mt-6">
                <button onClick={cargarMas} disabled={cargandoMas} className="btn-primary px-8">
                  {cargandoMas ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
