import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

// Beneficios reales del negocio — ver barra superior (Layout.jsx) y lógica
// de reserva/seguimiento ya implementada. No agregar ninguno que no esté
// efectivamente cumplido.
const BENEFICIOS = [
  {
    titulo: 'Stock actualizado',
    texto: 'La disponibilidad que ves es la real, calculada al momento.',
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a4 4 0 018 0v2" />
      </svg>
    ),
  },
  {
    titulo: 'Compra segura',
    texto: 'Reservamos tu stock por una hora mientras coordinás el pago.',
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    titulo: 'Atención personalizada',
    texto: 'Coordinamos tu pedido por WhatsApp, de persona a persona.',
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M21 11.5a8.5 8.5 0 01-12.3 7.6L3 20l1.1-5.4A8.5 8.5 0 1121 11.5z" />
      </svg>
    ),
  },
  {
    titulo: 'Seguimiento del pedido',
    texto: 'Cada pedido tiene un código y una página para ver su estado.',
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" />
      </svg>
    ),
  },
]

// Fondos alternados para las tarjetas de categoría — no hay campo de imagen
// en el modelo Categoria (ver serializers.py), así que se resuelve con la
// paleta de marca en vez de simular una foto que no existe.
const FONDOS_CATEGORIA = [
  'from-brand-primary-700 to-brand-primary-900',
  'from-accent-600 to-accent-800',
  'from-brand-secondary-600 to-brand-secondary-800',
]

function ProductSkeleton() {
  return (
    <div className="bg-surface rounded-card overflow-hidden shadow-soft flex flex-col">
      <div className="aspect-square bg-background-secondary animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-background-secondary rounded-full animate-pulse" />
        <div className="h-3.5 bg-background-secondary rounded-full animate-pulse w-2/3" />
        <div className="h-5 bg-background-secondary rounded-full animate-pulse w-1/2 mt-2" />
        <div className="h-10 bg-background-secondary rounded-xl animate-pulse mt-1" />
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
      <p className="text-text-secondary">No pudimos cargar esta sección.</p>
      <p className="text-text-secondary text-sm mt-1">Intentá nuevamente.</p>
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
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-primary-900 via-brand-primary-800 to-brand-primary-600 text-white">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-accent-800/20 blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative max-w-site mx-auto px-4 sm:px-8 py-16 sm:py-24 flex items-center gap-10">
          <img
            src="/logo.jpg"
            alt={TIENDA_NOMBRE}
            className="hidden sm:block w-36 h-36 object-cover rounded-full flex-shrink-0 border-4 border-white/20 shadow-elevated"
          />
          <div className="max-w-xl">
            <p className="text-brand-primary-200 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
              Tienda online
            </p>
            <h1 className="font-display text-hero font-semibold leading-tight text-white">
              Aromas que transforman<br className="hidden sm:block" /> tus espacios
            </h1>
            <p className="mt-5 text-brand-primary-100 text-base sm:text-lg max-w-md leading-relaxed">
              Sahumerios y esencias artesanales elaborados con ingredientes naturales,
              para acompañar momentos de calma, energía y bienestar en tu hogar.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#productos" className="btn-primary bg-white text-brand-primary-800 hover:bg-brand-primary-50 active:bg-brand-primary-100">
                Explorar productos
              </a>
              {categorias.length > 0 && (
                <a href="#categorias" className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-xl font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors duration-250">
                  Ver categorías
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Beneficios */}
      <div className="max-w-site mx-auto px-4 sm:px-8 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
        {BENEFICIOS.map(b => (
          <div key={b.titulo} className="flex flex-col items-start gap-2">
            <span className="w-11 h-11 rounded-full bg-brand-primary-100 text-brand-primary-700 flex items-center justify-center flex-shrink-0">
              {b.icono}
            </span>
            <p className="font-semibold text-text-primary text-sm">{b.titulo}</p>
            <p className="text-text-secondary text-xs leading-relaxed">{b.texto}</p>
          </div>
        ))}
      </div>

      {/* Categorías destacadas */}
      {categorias.length > 0 && (
        <div id="categorias" className="max-w-site mx-auto px-4 sm:px-8 pb-12 scroll-mt-20">
          <div className="flex items-end justify-between mb-5">
            <h2 className="font-display text-h2 font-semibold text-text-primary">Categorías</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categorias.map((cat, i) => (
              <Link
                key={cat.slug}
                to={`/categoria/${cat.slug}`}
                className={`group relative overflow-hidden rounded-card shadow-soft hover:shadow-elevated transition-all duration-250 aspect-[4/3] flex flex-col justify-end p-4 text-white bg-gradient-to-br ${FONDOS_CATEGORIA[i % FONDOS_CATEGORIA.length]} ${i === 0 ? 'col-span-2 row-span-2 aspect-square sm:aspect-[4/3]' : ''}`}
              >
                {cat.icono && (
                  <span className="absolute top-4 right-4 text-3xl opacity-80" aria-hidden="true">{cat.icono}</span>
                )}
                <span className="font-display text-lg font-semibold group-hover:translate-x-0.5 transition-transform duration-250">
                  {cat.nombre}
                </span>
                {cat.descripcion && (
                  <span className="text-xs text-white/80 mt-1 line-clamp-2">{cat.descripcion}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Banner editorial */}
      <div className="bg-background-secondary">
        <div className="max-w-site mx-auto px-4 sm:px-8 py-14 grid sm:grid-cols-2 gap-8 items-center">
          <div className="order-2 sm:order-1">
            <p className="text-accent-700 text-xs font-semibold tracking-[0.2em] uppercase mb-3">Hecho a mano</p>
            <h2 className="font-display text-h2 font-semibold text-text-primary leading-tight">
              Elaborados con cuidado, pensados para tu bienestar
            </h2>
            <p className="mt-4 text-text-secondary leading-relaxed max-w-md">
              Cada producto se prepara de forma artesanal con ingredientes naturales,
              cuidando cada detalle desde la elaboración hasta que llega a tu casa.
            </p>
            <Link to="/sobre-nosotros" className="btn-secondary inline-flex mt-6">
              Conocer más
            </Link>
          </div>
          <div className="order-1 sm:order-2 aspect-[4/3] rounded-card bg-gradient-to-br from-brand-secondary-200 to-brand-secondary-400 flex items-center justify-center overflow-hidden shadow-soft">
            <img src="/logo.jpg" alt="" className="w-28 h-28 object-cover rounded-full shadow-elevated border-4 border-white/50" />
          </div>
        </div>
      </div>

      {/* Catálogo */}
      <div id="productos" className="max-w-site mx-auto px-4 sm:px-8 py-10 scroll-mt-16">
        <h2 className="font-display text-h2 font-semibold text-text-primary mb-5">Nuestros productos</h2>
        {/* Tabs de categorías */}
        {categorias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-4 px-4">
            <button
              onClick={() => actualizarParam('categoria', '')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-250 whitespace-nowrap ${
                tabActivo === 'todos'
                  ? 'bg-brand-primary-700 text-white shadow-soft'
                  : 'bg-surface text-text-secondary border border-border-soft hover:border-brand-primary-300 hover:text-brand-primary-700'
              }`}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button
                key={cat.slug}
                onClick={() => actualizarParam('categoria', cat.slug)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-250 whitespace-nowrap ${
                  tabActivo === cat.slug
                    ? 'bg-brand-primary-700 text-white shadow-soft'
                    : 'bg-surface text-text-secondary border border-border-soft hover:border-brand-primary-300 hover:text-brand-primary-700'
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
            <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4 fill-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              type="search"
              placeholder="Buscar productos..."
              aria-label="Buscar productos"
              value={busquedaInput}
              onChange={e => setBusquedaInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-border-soft rounded-xl text-sm focus:outline-none focus:border-brand-primary-400 focus:ring-1 focus:ring-brand-primary-400 bg-surface"
            />
          </div>
          <select
            value={orden}
            aria-label="Ordenar por"
            onChange={e => actualizarParam('orden', e.target.value === 'nombre' ? '' : e.target.value)}
            className="border border-border-soft rounded-xl px-3 py-2.5 text-sm text-text-secondary bg-surface focus:outline-none focus:border-brand-primary-400 flex-shrink-0"
          >
            <option value="nombre">A–Z</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
            <option value="nuevos">Más nuevos</option>
          </select>
        </div>

        {/* Filtros: disponibilidad + rango de precio */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <label className="flex items-center gap-2 text-sm text-text-secondary bg-surface border border-border-soft rounded-xl px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={disponible === '1'}
              onChange={e => actualizarParam('disponible', e.target.checked ? '1' : '')}
              className="accent-brand-primary-600"
            />
            Solo disponibles
          </label>
          <input
            type="number" min="0" placeholder="Precio mín." aria-label="Precio mínimo"
            value={precioMin}
            onChange={e => actualizarParam('precio_min', e.target.value)}
            className="w-28 border border-border-soft rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-primary-400"
          />
          <input
            type="number" min="0" placeholder="Precio máx." aria-label="Precio máximo"
            value={precioMax}
            onChange={e => actualizarParam('precio_max', e.target.value)}
            className="w-28 border border-border-soft rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-primary-400"
          />
          <span className="text-xs text-text-secondary ml-auto font-medium uppercase tracking-wide whitespace-nowrap">
            {count} producto{count !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grilla */}
        {cargando ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium text-text-primary">No encontramos productos con esos filtros.</p>
            <p className="text-sm mt-1">Probá cambiando la búsqueda o eliminando algún filtro.</p>
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
