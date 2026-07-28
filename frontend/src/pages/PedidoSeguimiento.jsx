import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { pedidosService } from '../services/api'
import { WHATSAPP_NUMBER } from '../config'
import ReservaCountdown from '../components/ReservaCountdown'
import Seo from '../components/Seo'

function formatPrecio(n) {
  return '$' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

function formatFecha(iso) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const ESTADO_INFO = {
  pendiente:  { label: 'Pendiente de confirmación', color: 'bg-amber-100 text-amber-700' },
  confirmado: { label: 'Confirmado — en preparación', color: 'bg-tierra-100 text-tierra-700' },
  enviado:    { label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
  entregado:  { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  cancelado:  { label: 'Cancelado', color: 'bg-gray-100 text-gray-600' },
  vencido:    { label: 'Reserva vencida', color: 'bg-red-100 text-red-600' },
}

const SIGUIENTE_PASO = {
  pendiente:  'Coordiná el pago por WhatsApp o Mercado Pago antes de que venza la reserva.',
  confirmado: 'Ya confirmamos tu pago. Estamos preparando tu pedido.',
  enviado:    'Tu pedido está en camino.',
  entregado:  '¡Tu pedido ya fue entregado! Gracias por tu compra.',
  cancelado:  'Este pedido fue cancelado. Si fue un error, escribinos por WhatsApp.',
  vencido:    'La reserva venció y el stock fue liberado. Si todavía te interesa, hacé un nuevo pedido o escribinos.',
}

export default function PedidoSeguimiento() {
  const { codigo } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(() => {
    if (!token) {
      setError('Falta el token de seguimiento en el enlace.')
      setCargando(false)
      return
    }
    setCargando(true)
    pedidosService.seguimiento(codigo, token)
      .then(r => { setPedido(r.data); setError('') })
      .catch(err => {
        setError(err.response?.status === 404
          ? 'No encontramos este pedido. Verificá el enlace o el código.'
          : 'No se pudo cargar el pedido. Intentá de nuevo.')
      })
      .finally(() => setCargando(false))
  }, [codigo, token])

  useEffect(() => { cargar() }, [cargar, codigo])

  // Página privada del pedido de un cliente puntual: nunca debe indexarse.
  const seo = <Seo title={`Pedido ${codigo}`} path={`/pedido/${codigo}`} noindex />

  if (cargando) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        {seo}
        <div className="h-6 w-40 bg-gray-200 rounded-full animate-pulse mb-4" />
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error || !pedido) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        {seo}
        <p className="text-5xl mb-4">😕</p>
        <p className="text-gray-600">{error || 'Pedido no encontrado.'}</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">← Volver a la tienda</Link>
      </div>
    )
  }

  const estadoInfo = ESTADO_INFO[pedido.estado] || { label: pedido.estado, color: 'bg-gray-100 text-gray-600' }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-14 space-y-4">
      {seo}
      <div>
        <Link to="/" className="text-tierra-600 hover:text-tierra-800 text-sm">← Volver a la tienda</Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-tierra-100 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-gray-800">Pedido {pedido.codigo}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{formatFecha(pedido.created_at)}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${estadoInfo.color}`}>
            {estadoInfo.label}
          </span>
        </div>

        <ReservaCountdown expiresAt={pedido.expires_at} estado={pedido.estado} onExpirar={cargar} />

        <p className="text-sm text-gray-600 bg-tierra-50 rounded-xl p-3">
          {SIGUIENTE_PASO[pedido.estado] || ''}
        </p>

        {/* Ítems */}
        <div className="border-t border-gray-100 pt-3">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Productos</h2>
          <ul className="space-y-1 text-sm text-gray-600">
            {pedido.items?.map(i => (
              <li key={i.id} className="flex justify-between">
                <span>{i.producto_nombre} × {i.cantidad}</span>
                <span className="font-medium text-gray-800">{formatPrecio(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-gray-100 mt-2 pt-2 font-bold text-gray-800">
            <span>Total</span>
            <span>{formatPrecio(pedido.total)}</span>
          </div>
        </div>

        <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
          Método de pago: {pedido.metodo_pago === 'mercadopago' ? 'Mercado Pago' : 'WhatsApp'}
        </div>

        {/* Historial */}
        {pedido.historial?.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Historial</h2>
            <ul className="space-y-1 text-xs text-gray-400">
              {pedido.historial.map(h => (
                <li key={h.id}>
                  <span className="font-semibold capitalize text-gray-600">{h.estado}</span>
                  {' — '}{formatFecha(h.created_at)}
                  {h.nota ? ` · ${h.nota}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {pedido.estado === 'pendiente' && (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola! Quiero coordinar mi pedido ${pedido.codigo}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="btn-whatsapp w-full block text-center"
          >
            💬 Coordinar por WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
