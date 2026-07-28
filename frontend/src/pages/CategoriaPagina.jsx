import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import api, { productosService, categoriasService } from '../services/api'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { TIENDA_NOMBRE, SITE_URL } from '../config'

export default function CategoriaPagina() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const [categoria, setCategoria] = useState(null)
  const [productos, setProductos] = useState([])
  const [count, setCount] = useState(0)
  const [nextUrl, setNextUrl] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const orden = searchParams.get('orden') || 'nombre'
  const disponible = searchParams.get('disponible') || ''

  const actualizarParam = (clave, valor) => {
    const next = new URLSearchParams(searchParams)
    if (valor) next.set(clave, valor)
    else next.delete(clave)
    setSearchParams(next, { replace: true })
  }

  const cargar = useCallback(() => {
    setCargando(true)
    setNotFound(false)
    Promise.all([
      categoriasService.list(),
      productosService.list({ categoria: slug, orden, disponible: disponible || undefined }),
    ])
      .then(([resCat, resProd]) => {
        const cat = resCat.data.find(c => c.slug === slug)
        if (!cat) {
          setNotFound(true)
          return
        }
        setCategoria(cat)
        setProductos(resProd.data.results)
        setCount(resProd.data.count)
        setNextUrl(resProd.data.next)
      })
      .catch(() => setNotFound(true))
      .finally(() => setCargando(false))
  }, [slug, orden, disponible])

  useEffect(() => { cargar() }, [cargar])

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

  if (cargando) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded-full animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-gray-600">No encontramos esta categoría.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">← Volver al catálogo</Link>
      </div>
    )
  }

  const path = `/categoria/${categoria.slug}`
  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: categoria.nombre, item: `${SITE_URL}${path}` },
    ],
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-14">
      <Seo
        title={categoria.nombre}
        description={categoria.descripcion || `${categoria.nombre} — ${TIENDA_NOMBRE}`}
        path={path}
        jsonLd={jsonLdBreadcrumb}
      />
      <Link to="/" className="text-tierra-600 hover:text-tierra-800 text-sm">← Todas las categorías</Link>

      <div className="mt-3 mb-5">
        <h1 className="font-display text-3xl font-bold text-tierra-800">
          {categoria.icono ? `${categoria.icono} ` : ''}{categoria.nombre}
        </h1>
        {categoria.descripcion && (
          <p className="text-gray-500 text-sm mt-1 max-w-xl">{categoria.descripcion}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={orden}
          aria-label="Ordenar por"
          onChange={e => actualizarParam('orden', e.target.value === 'nombre' ? '' : e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-tierra-400"
        >
          <option value="nombre">A–Z</option>
          <option value="precio_asc">Menor precio</option>
          <option value="precio_desc">Mayor precio</option>
          <option value="nuevos">Más nuevos</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2 cursor-pointer">
          <input
            type="checkbox"
            checked={disponible === '1'}
            onChange={e => actualizarParam('disponible', e.target.checked ? '1' : '')}
            className="accent-tierra-600"
          />
          Solo disponibles
        </label>

        <span className="text-xs text-gray-400 ml-auto font-medium uppercase tracking-wide">
          {count} producto{count !== 1 ? 's' : ''}
        </span>
      </div>

      {productos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🌿</p>
          <p>No hay productos en esta categoría por ahora.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {productos.map(p => <ProductCard key={p.id} producto={p} />)}
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
  )
}
