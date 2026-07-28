import { Link } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import { useToast } from '../context/ToastContext'

function formatPrecio(precio) {
  return '$' + Number(precio).toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

export default function ProductCard({ producto }) {
  const { agregar } = useCarrito()
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
    toast({ message: `${producto.nombre} agregado al carrito`, type: 'success' })
  }

  return (
    <div className={`group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${sinStock ? 'opacity-60' : ''}`}>

      {/* Imagen */}
      <Link to={href} className="block relative aspect-square overflow-hidden bg-tierra-50">
        {imagenGrilla ? (
          <>
            <img
              src={imagenGrilla}
              alt={producto.nombre}
              width={400}
              height={400}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-tierra-50 p-8">
            <img src="/iconos/svg/06_sahumerio.svg" alt="" className="w-full h-full object-contain opacity-20" />
          </div>
        )}

        {producto.categoria_nombre && (
          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-tierra-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            {producto.categoria_nombre}
          </span>
        )}

        {sinStock ? (
          <span className="absolute top-2 right-2 bg-gray-800/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {etiquetaSinStock}
          </span>
        ) : pocasUnidades ? (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            ¡Últimas!
          </span>
        ) : null}
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link to={href}>
          <h3 className="font-medium text-gray-800 text-sm leading-snug hover:text-tierra-700 transition-colors line-clamp-2">
            {producto.nombre}
          </h3>
        </Link>

        <p className="text-tierra-700 font-bold text-base mt-auto">
          {formatPrecio(producto.precio)}
        </p>

        <button
          onClick={handleAgregar}
          disabled={sinStock}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[44px] active:scale-95
            ${sinStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-tierra-600 hover:bg-tierra-700 text-white'}`}
        >
          {sinStock ? etiquetaSinStock : '+ Agregar'}
        </button>
      </div>
    </div>
  )
}
