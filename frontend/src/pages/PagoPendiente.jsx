import { useSearchParams, Link } from 'react-router-dom'

export default function PagoPendiente() {
  const [params] = useSearchParams()
  const codigo = params.get('pedido') || ''

  return (
    <div className="min-h-screen bg-tierra-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-tierra-100 max-w-sm w-full p-8 text-center space-y-5">
        <div className="text-6xl">⏳</div>
        <h1 className="text-2xl font-bold text-amber-700">Pago pendiente</h1>
        {codigo && (
          <div className="bg-amber-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Código de pedido</p>
            <p className="font-bold text-amber-700 text-lg tracking-wide">{codigo}</p>
          </div>
        )}
        <p className="text-gray-600 text-sm">
          Tu pago está siendo procesado por Mercado Pago. Esto puede demorar unos minutos.
          Te avisaremos por WhatsApp cuando se confirme.
        </p>
        <div className="bg-tierra-50 rounded-xl p-4 text-left text-sm text-tierra-700 space-y-1">
          <p className="font-semibold">¿Qué pasa ahora?</p>
          <p>• Si el pago se aprueba → tu pedido se confirma automáticamente.</p>
          <p>• Si no se aprueba → la reserva vence en 1 hora y el stock se libera.</p>
        </div>
        <Link to="/" className="btn-secondary w-full text-sm">
          Volver a la tienda
        </Link>
      </div>
    </div>
  )
}
