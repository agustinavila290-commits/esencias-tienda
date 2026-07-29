import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { productosService } from '../services/api'
import { useCarrito } from '../context/CarritoContext'
import { useToast } from '../context/ToastContext'
import { WHATSAPP_NUMBER, TIENDA_NOMBRE, SITE_URL } from '../config'
import ProductCard from '../components/ProductCard'
import QuantitySelector from '../components/QuantitySelector'
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
  agotado: { texto: 'Sin stock disponible', color: 'text-error', punto: 'bg-error' },
  reservado_temporalmente: { texto: 'Reservado por otro carrito en este momento', color: 'text-warning', punto: 'bg-warning' },
  ultimas_unidades: { texto: null, color: 'text-warning', punto: 'bg-warning' }, // texto se arma con la cantidad
  disponible: { texto: 'Disponible', color: 'text-success', punto: 'bg-success' },
}

export default function ProductoDetalle() {
  const { slug } = useParams()
  const [producto, setProducto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const { agregar, setAbierto } = useCarrito()
  const toast = useToast()
  // Guarda simple contra doble clic: agregar()/handleComprar() son síncronos,
  // así que un doble clic real (sin esperar respuesta de red) podría sumar
  // la cantidad dos veces antes de que React vuelva a renderizar.
  const bloqueadoRef = useRef(false)
  const conGuardia = (fn) => () => {
    if (bloqueadoRef.current) return
    bloqueadoRef.current = true
    fn()
    setTimeout(() => { bloqueadoRef.current = false }, 400)
  }

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
    <div className="max-w-site mx-auto px-4 sm:px-8 py-6">
      <div className="h-4 w-32 bg-background-secondary rounded-full animate-pulse mb-6" />
      <div className="grid sm:grid-cols-2 gap-8">
        <div className="aspect-[4/5] bg-background-secondary rounded-card animate-pulse" />
        <div className="space-y-3">
          <div className="h-7 bg-background-secondary rounded-full animate-pulse w-3/4" />
          <div className="h-8 bg-background-secondary rounded-full animate-pulse w-1/3" />
          <div className="h-12 bg-background-secondary rounded-xl animate-pulse mt-4" />
        </div>
      </div>
    </div>
  )

  if (notFound || !producto) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-4">😕</p>
      <p className="text-text-secondary">Producto no encontrado.</p>
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
  const whatsappConfigurado = WHATSAPP_NUMBER && WHATSAPP_NUMBER !== '549XXXXXXXXXX'

  const handleAgregar = conGuardia(() => {
    if (sinStock) return
    agregar(producto, cantidad)
    toast({
      message: `${producto.nombre} agregado al carrito`,
      type: 'success',
      action: { label: 'Ver carrito', onClick: () => setAbierto(true) },
    })
  })

  const handleComprar = conGuardia(() => {
    if (sinStock) return
    agregar(producto, cantidad)
    setAbierto(true)
  })

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
      <div className="max-w-site mx-auto px-4 sm:px-8 pt-4 pb-2">
        <nav aria-label="Breadcrumbs" className="text-sm text-text-secondary flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-brand-primary-700 transition-colors">Inicio</Link>
          {producto.categoria_slug && (
            <>
              <span aria-hidden="true">/</span>
              <Link to={`/categoria/${producto.categoria_slug}`} className="hover:text-brand-primary-700 transition-colors">
                {producto.categoria_nombre}
              </Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span className="text-text-primary font-medium truncate">{producto.nombre}</span>
        </nav>
      </div>

      <div className="max-w-site mx-auto px-4 sm:px-8 grid sm:grid-cols-2 gap-8">
        {/* Imagen */}
        <div className="relative aspect-[4/5] bg-background-secondary rounded-card overflow-hidden shadow-soft border border-border-soft sm:sticky sm:top-24 self-start">
          {producto.imagen_url ? (
            <img src={producto.imagen_url} alt={producto.nombre} width={800} height={1000} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl text-brand-primary-200">🌿</div>
          )}

          {sinStock && (
            <div className="absolute inset-0 bg-text-primary/30 flex items-center justify-center">
              <span className="bg-surface-elevated text-text-primary font-bold px-6 py-2 rounded-full text-sm">
                {disponibilidad === 'reservado_temporalmente' ? 'Reservado' : 'Sin stock'}
              </span>
            </div>
          )}
          {disponibilidad === 'ultimas_unidades' && (
            <span className="absolute top-3 right-3 badge-warning shadow-soft">
              {textoEstado}
            </span>
          )}
          {producto.categoria_nombre && (
            <span className="absolute top-3 left-3 badge bg-surface-elevated/90 backdrop-blur-sm text-text-secondary shadow-soft">
              {producto.categoria_nombre}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4 pb-8">
          <div>
            <h1 className="font-display text-h1 font-semibold text-text-primary leading-snug">{producto.nombre}</h1>
            <p className="text-3xl font-bold text-brand-primary-700 mt-2">{formatPrecio(producto.precio)}</p>
          </div>

          {producto.descripcion && (
            <p className="text-text-secondary leading-relaxed text-sm">{producto.descripcion}</p>
          )}

          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${estadoInfo.punto}`} />
            <span className={`font-medium ${estadoInfo.color}`}>{textoEstado}</span>
          </div>

          {!sinStock && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary font-medium">Cantidad</span>
              <QuantitySelector
                cantidad={cantidad}
                max={maxCantidad}
                nombreProducto={producto.nombre}
                onCambiar={setCantidad}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAgregar}
              disabled={sinStock}
              className={`py-3.5 rounded-xl font-semibold text-sm transition-colors duration-250 min-h-[44px] ${
                sinStock ? 'bg-background-secondary text-text-secondary cursor-not-allowed' : 'bg-brand-primary-700 hover:bg-brand-primary-800 text-white'
              }`}
            >
              {sinStock ? 'Sin stock' : '+ Agregar al carrito'}
            </button>
            <button
              onClick={handleComprar}
              disabled={sinStock}
              className={`py-3.5 rounded-xl font-semibold text-sm transition-colors duration-250 min-h-[44px] ${
                sinStock ? 'bg-background-secondary text-text-secondary cursor-not-allowed' : 'bg-brand-primary-50 text-brand-primary-700 hover:bg-brand-primary-100 border border-brand-primary-200'
              }`}
            >
              Comprar ahora
            </button>
          </div>

          {whatsappConfigurado && (
            <button
              onClick={handleConsultarWhatsapp}
              className="btn-whatsapp w-full"
            >
              💬 Consultar por WhatsApp
            </button>
          )}

          <p className="text-xs text-text-secondary text-center">
            Reservamos tu stock por 1 hora al confirmar el pedido. Pagás por WhatsApp o Mercado Pago — ver{' '}
            <Link to="/envios" className="underline hover:text-brand-primary-700">medios de pago y envíos</Link>.
          </p>
        </div>
      </div>

      {producto.relacionados?.length > 0 && (
        <div className="max-w-site mx-auto px-4 sm:px-8 mt-10">
          <h2 className="font-display text-h2 font-semibold text-text-primary mb-4">También te puede interesar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
