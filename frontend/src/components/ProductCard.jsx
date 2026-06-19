import { Link } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import { useToast } from '../context/ToastContext'

function formatPrecio(precio) {
  return '$' + Number(precio).toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

export default function ProductCard({ producto }) {
  const { agregar } = useCarrito()
  const toast = useToast()
  const agotado = producto.stock_disponible === 0
  const pocasUnidades = !agotado && producto.stock_disponible <= 3

  const handleAgregar = () => {
    if (agotado) return
    agregar(producto)
    toast({ message: `${producto.nombre} agregado al carrito`, type: 'success' })
  }

  return (
    <div className={`group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${agotado ? 'opacity-60' : ''}`}>

      {/* Imagen */}
      <Link to={`/producto/${producto.id}`} className="block relative aspect-square overflow-hidden bg-tierra-50">
        {producto.imagen_url ? (
          <>
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-tierra-200">
            🌿
          </div>
        )}

        {producto.categoria_nombre && (
          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-tierra-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            {producto.categoria_nombre}
          </span>
        )}

        {agotado ? (
          <span className="absolute top-2 right-2 bg-gray-800/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Agotado
          </span>
        ) : pocasUnidades ? (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            ¡Últimas!
          </span>
        ) : null}
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link to={`/producto/${producto.id}`}>
          <h3 className="font-medium text-gray-800 text-sm leading-snug hover:text-tierra-700 transition-colors line-clamp-2">
            {producto.nombre}
          </h3>
        </Link>

        <p className="text-tierra-700 font-bold text-base mt-auto">
          {formatPrecio(producto.precio)}
        </p>

        <button
          onClick={handleAgregar}
          disabled={agotado}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[44px] active:scale-95
            ${agotado ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-tierra-600 hover:bg-tierra-700 text-white'}`}
        >
          {agotado ? 'Agotado' : '+ Agregar'}
        </button>
      </div>
    </div>
  )
}
