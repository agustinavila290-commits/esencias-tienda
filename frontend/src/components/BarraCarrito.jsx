import { useCarrito } from '../context/CarritoContext'

function formatPrecio(n) {
  return '$' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

export default function BarraCarrito() {
  const { totalItems, totalPrecio, setAbierto } = useCarrito()

  if (totalItems === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3">
      <button
        onClick={() => setAbierto(true)}
        className="w-full flex items-center gap-3 bg-gradient-to-r from-brand-primary-700 to-brand-primary-600 hover:from-brand-primary-800 hover:to-brand-primary-700 active:from-brand-primary-900 active:to-brand-primary-800 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-elevated transition-all duration-250 active:scale-[0.99]"
      >
        <span className="bg-white/20 rounded-xl px-2.5 py-0.5 text-sm font-bold min-w-[28px] text-center">
          {totalItems}
        </span>
        <span className="flex-1 text-left text-base">Ver carrito</span>
        <span className="font-bold text-base">{formatPrecio(totalPrecio)}</span>
        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current opacity-70 flex-shrink-0">
          <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/>
        </svg>
      </button>
    </div>
  )
}
