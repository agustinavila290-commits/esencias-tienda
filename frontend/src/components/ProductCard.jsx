import { Link } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import { useToast } from '../context/ToastContext'

function formatPrecio(precio) {
  return '$' + Number(precio).toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

export default function ProductCard({ producto }) {
  const { agregar, setAbierto } = useCarrito()
  const toast = useToast()

  // `disponibilidad` viene calculada del backend (agotado / reservado_temporalmente
  // / ultimas_unidades / disponible). Si no viene (ej. objetos armados a mano en
  // tests u otros contextos), se deriva del mismo modo que hacía antes esta tarjeta.
  const disponibilidad = producto.disponibilidad || (
    producto.stock_disponible === 0 ? 'agotado'
      : producto.stock_disponible <= 3 ? 'ultimas_unidades'
      : 'disponible'
  )
  const sinStock = disponibilidad === 'agotado' || disponibilidad === 'reservado_temporalmente'
  const pocasUnidades = disponibilidad === 'ultimas_unidades'
  const etiquetaSinStock = disponibilidad === 'reservado_temporalmente' ? 'Reservado' : 'Agotado'
  const href = producto.slug ? `/productos/${producto.slug}` : `/producto/${producto.id}`
  // En grillas conviene la miniatura (más liviana); si no vino, se cae a la
  // imagen completa antes que no mostrar nada.
  const imagenGrilla = producto.imagen_thumbnail_url || producto.imagen_url

  const handleAgregar = () => {
    if (sinStock) return
    agregar(producto)
    toast({
      message: `${producto.nombre} agregado al carrito`,
      type: 'success',
      action: { label: 'Ver carrito', onClick: () => setAbierto(true) },
    })
  }

  return (
    <div className={`group flex flex-col bg-surface rounded-card overflow-hidden shadow-soft hover:shadow-elevated border border-border-soft transition-all duration-250 hover:-translate-y-0.5 ${sinStock ? 'opacity-70' : ''}`}>

      {/* Imagen */}
      <Link to={href} className="block relative aspect-[4/5] overflow-hidden bg-background-secondary">
        {imagenGrilla ? (
          <>
            <img
              src={imagenGrilla}
              alt={producto.nombre}
              width={400}
              height={500}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-background-secondary p-8">
            <img src="/iconos/svg/06_sahumerio.svg" alt="" className="w-full h-full object-contain opacity-20" />
          </div>
        )}

        {producto.categoria_nombre && (
          <span className="absolute top-2 left-2 badge bg-surface-elevated/90 backdrop-blur-sm text-text-secondary shadow-soft">
            {producto.categoria_nombre}
          </span>
        )}

        {sinStock ? (
          <span className="absolute top-2 right-2 badge bg-text-primary/80 text-white">
            {etiquetaSinStock}
          </span>
        ) : pocasUnidades ? (
          <span className="absolute top-2 right-2 badge-warning shadow-soft">
            ¡Últimas!
          </span>
        ) : null}
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link to={href}>
          <h3 className="font-medium text-text-primary text-sm leading-snug hover:text-brand-primary-700 transition-colors line-clamp-2">
            {producto.nombre}
          </h3>
        </Link>

        <p className="text-brand-primary-700 font-bold text-base mt-auto">
          {formatPrecio(producto.precio)}
        </p>

        <button
          onClick={handleAgregar}
          disabled={sinStock}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-250 min-h-[44px] active:scale-95
            ${sinStock ? 'bg-background-secondary text-text-secondary cursor-not-allowed' : 'bg-brand-primary-600 hover:bg-brand-primary-700 text-white'}`}
        >
          {sinStock ? etiquetaSinStock : '+ Agregar'}
        </button>
      </div>
    </div>
  )
}
