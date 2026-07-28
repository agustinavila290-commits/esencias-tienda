import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { productosService } from '../services/api'
import { useCarrito } from '../context/CarritoContext'
import { useToast } from '../context/ToastContext'
import { WHATSAPP_NUMBER, TIENDA_NOMBRE, SITE_URL } from '../config'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'

const DISPONIBILIDAD_SCHEMA = {
  disponible: 'https://schema.org/InStock',
  ultimas_unidades: 'https://schema.org/LimitedAvailability',
  reservado_temporalmente: 'https://schema.org/OutOfStock',
  agotado: 'https://schema.org/OutOfStock',
}

function formatPrecio(n) {
  return '$' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

const ESTADO_TEXTO = {
  agotado: { texto: 'Sin stock disponible', color: 'text-red-500', punto: 'bg-red-400' },
  reservado_temporalmente: { texto: 'Reservado por otro carrito en este momento', color: 'text-amber-600', punto: 'bg-amber-400' },
  ultimas_unidades: { texto: null, color: 'text-amber-600', punto: 'bg-amber-400' }, // texto se arma con la cantidad
  disponible: { texto: 'Disponible', color: 'text-naturaleza-600', punto: 'bg-naturaleza-500' },
}

export default function ProductoDetalle() {
  const { slug } = useParams()
  const [producto, setProducto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const { agregar, setAbierto } = useCarrito()
  const toast = useToast()

  useEffect(() => {
    setCargando(true)
    setNotFound(false)
    setCantidad(1)
    productosService.getBySlug(slug)
      .then(r => setProducto(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setCargando(false))
  }, [slug])

  if (cargando) return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="h-4 w-32 bg-gray-200 rounded-full animate-pulse mb-6" />
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
        <div className="p-5 space-y-3">
          <div className="h-7 bg-gray-200 rounded-full animate-pulse w-3/4" />
          <div className="h-8 bg-gray-200 rounded-full animate-pulse w-1/3" />
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse mt-4" />
        </div>
      </div>
    </div>
  )

  if (notFound || !producto) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-4">😕</p>
      <p className="text-gray-600">Producto no encontrado.</p>
      <Link to="/" className="btn-primary mt-4 inline-flex">← Volver al catálogo</Link>
    </div>
  )

  const disponibilidad = producto.disponibilidad
  const sinStock = disponibilidad === 'agotado' || disponibilidad === 'reservado_temporalmente'
  const estadoInfo = ESTADO_TEXTO[disponibilidad] || ESTADO_TEXTO.disponible
  const textoEstado = disponibilidad === 'ultimas_unidades'
    ? `¡Últimas ${producto.stock_disponible} unidades!`
    : estadoInfo.texto
  const maxCantidad = Math.max(1, producto.stock_disponible)

  const handleAgregar = () => {
    if (sinStock) return
    agregar(producto, cantidad)
    toast({ message: `${producto.nombre} agregado al carrito`, type: 'success' })
  }

  const handleComprar = () => {
    if (sinStock) return
    agregar(producto, cantidad)
    setAbierto(true)
  }

  const handleConsultarWhatsapp = () => {
    const msg = `Hola! Te consulto por "${producto.nombre}" (${formatPrecio(producto.precio)})`
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const path = `/productos/${producto.slug}`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: producto.nombre,
      description: producto.descripcion || undefined,
      image: producto.imagen_url ? [producto.imagen_url] : undefined,
      url: `${SITE_URL}${path}`,
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}${path}`,
        priceCurrency: 'ARS',
        price: producto.precio,
        availability: DISPONIBILIDAD_SCHEMA[disponibilidad] || 'https://schema.org/InStock',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
        ...(producto.categoria_slug ? [{
          '@type': 'ListItem', position: 2, name: producto.categoria_nombre,
          item: `${SITE_URL}/categoria/${producto.categoria_slug}`,
        }] : []),
        {
          '@type': 'ListItem', position: producto.categoria_slug ? 3 : 2,
          name: producto.nombre, item: `${SITE_URL}${path}`,
        },
      ],
    },
  ]

  return (
    <div className="pb-8">
      <Seo
        title={producto.nombre}
        description={producto.descripcion || `${producto.nombre} — ${formatPrecio(producto.precio)}. ${TIENDA_NOMBRE}.`}
        path={path}
        image={producto.imagen_url || '/logo.jpg'}
        type="product"
        jsonLd={jsonLd}
      />
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-2">
        <Link to="/" className="text-tierra-600 hover:text-tierra-800 text-sm flex items-center gap-1.5 transition-colors">
          <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current flex-shrink-0">
            <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
          </svg>
          Volver al catálogo
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-tierra-100">
          <div className="relative aspect-[4/3] bg-tierra-50 overflow-hidden">
            {producto.imagen_url ? (
              <img src={producto.imagen_url} alt={producto.nombre} width={800} height={600} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl text-tierra-200">🌿</div>
            )}

            {sinStock && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="bg-white text-gray-800 font-bold px-6 py-2 rounded-full text-sm">
                  {disponibilidad === 'reservado_temporalmente' ? 'Reservado' : 'Sin stock'}
                </span>
              </div>
            )}
            {disponibilidad === 'ultimas_unidades' && (
              <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                {textoEstado}
              </span>
            )}
            {producto.categoria_nombre && (
              <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-tierra-700 text-xs font-bold px-3 py-1 rounded-full shadow">
                {producto.categoria_nombre}
              </span>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-800 leading-snug">{producto.nombre}</h1>
              <p className="text-3xl font-bold text-tierra-700 mt-2">{formatPrecio(producto.precio)}</p>
            </div>

            {producto.descripcion && (
              <p className="text-gray-600 leading-relaxed text-sm">{producto.descripcion}</p>
            )}

            <div className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${estadoInfo.punto}`} />
              <span className={`font-medium ${estadoInfo.color}`}>{textoEstado}</span>
            </div>

            {!sinStock && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 font-medium">Cantidad</span>
                <div className="flex items-center gap-1.5 bg-tierra-50 rounded-xl border border-gray-200 px-1 py-0.5">
                  <button
                    onClick={() => setCantidad(c => Math.max(1, c - 1))}
                    aria-label="Restar una unidad"
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-tierra-700 font-bold text-lg leading-none transition-colors"
                  >−</button>
                  <span className="w-6 text-center font-bold text-sm text-gray-800" aria-label={`Cantidad: ${cantidad}`}>{cantidad}</span>
                  <button
                    onClick={() => setCantidad(c => Math.min(maxCantidad, c + 1))}
                    disabled={cantidad >= maxCantidad}
                    aria-label="Sumar una unidad"
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-tierra-700 font-bold text-lg leading-none transition-colors disabled:opacity-30"
                  >+</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAgregar}
                disabled={sinStock}
                className={`py-3.5 rounded-xl font-semibold text-sm transition-colors ${
                  sinStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-tierra-50 text-tierra-700 hover:bg-tierra-100 border border-tierra-200'
                }`}
              >
                {sinStock ? 'Sin stock' : '+ Agregar al carrito'}
              </button>
              <button
                onClick={handleComprar}
                disabled={sinStock}
                className={`py-3.5 rounded-xl font-semibold text-sm transition-colors ${
                  sinStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-tierra-700 hover:bg-tierra-800 text-white'
                }`}
              >
                Comprar ahora
              </button>
            </div>

            <button
              onClick={handleConsultarWhatsapp}
              className="btn-whatsapp w-full"
            >
              💬 Consultar por WhatsApp
            </button>

            <p className="text-xs text-gray-400 text-center">
              Pagás por WhatsApp o Mercado Pago. Ver{' '}
              <Link to="/envios" className="underline hover:text-tierra-600">medios de pago y envíos</Link>.
            </p>
          </div>
        </div>
      </div>

      {producto.relacionados?.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mt-10">
          <h2 className="font-display text-xl font-bold text-gray-800 mb-4">También te puede interesar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {producto.relacionados.map((p, i) => (
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
