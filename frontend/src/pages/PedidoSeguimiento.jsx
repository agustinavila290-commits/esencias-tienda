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
  pendiente:  { label: 'Pendiente de confirmación', color: 'bg-warning-bg text-warning' },
  confirmado: { label: 'Confirmado — en preparación', color: 'bg-brand-primary-100 text-brand-primary-700' },
  enviado:    { label: 'Enviado', color: 'bg-brand-secondary-100 text-brand-secondary-800' },
  entregado:  { label: 'Entregado', color: 'bg-success-bg text-success' },
  cancelado:  { label: 'Cancelado', color: 'bg-background-secondary text-text-secondary' },
  vencido:    { label: 'Reserva vencida', color: 'bg-error-bg text-error' },
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
        <div className="h-6 w-40 bg-background-secondary rounded-full animate-pulse mb-4" />
        <div className="h-32 bg-background-secondary rounded-card animate-pulse" />
      </div>
    )
  }

  if (error || !pedido) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        {seo}
        <p className="text-5xl mb-4">😕</p>
        <p className="text-text-secondary">{error || 'Pedido no encontrado.'}</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">← Volver a la tienda</Link>
      </div>
    )
  }

  const estadoInfo = ESTADO_INFO[pedido.estado] || { label: pedido.estado, color: 'bg-background-secondary text-text-secondary' }
  const whatsappConfigurado = WHATSAPP_NUMBER && WHATSAPP_NUMBER !== '549XXXXXXXXXX'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-14 space-y-4">
      {seo}
      <div>
        <Link to="/" className="text-brand-primary-700 hover:text-brand-primary-900 text-sm">← Volver a la tienda</Link>
      </div>

      <div className="bg-surface rounded-card shadow-soft border border-border-soft p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-h3 font-semibold text-text-primary">Pedido {pedido.codigo}</h1>
            <p className="text-xs text-text-secondary mt-0.5">{formatFecha(pedido.created_at)}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${estadoInfo.color}`}>
            {estadoInfo.label}
          </span>
        </div>

        <ReservaCountdown expiresAt={pedido.expires_at} estado={pedido.estado} onExpirar={cargar} />

        <p className="text-sm text-text-secondary bg-background-secondary rounded-xl p-3">
          {SIGUIENTE_PASO[pedido.estado] || ''}
        </p>

        {/* Ítems */}
        <div className="border-t border-border-soft pt-3">
          <h2 className="text-sm font-semibold text-text-primary mb-2">Productos</h2>
          <ul className="space-y-1 text-sm text-text-secondary">
            {pedido.items?.map(i => (
              <li key={i.id} className="flex justify-between">
                <span>{i.producto_nombre} × {i.cantidad}</span>
                <span className="font-medium text-text-primary">{formatPrecio(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border-soft mt-2 pt-2 font-bold text-text-primary">
            <span>Total</span>
            <span>{formatPrecio(pedido.total)}</span>
          </div>
        </div>

        <div className="text-xs text-text-secondary border-t border-border-soft pt-3">
          Método de pago: {pedido.metodo_pago === 'mercadopago' ? 'Mercado Pago' : 'WhatsApp'}
        </div>

        {/* Historial — línea de tiempo con los estados reales del pedido */}
        {pedido.historial?.length > 0 && (
          <div className="border-t border-border-soft pt-3">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Historial</h2>
            <ul className="space-y-4">
              {pedido.historial.map((h, i) => (
                <li key={h.id} className="relative pl-5">
                  {i < pedido.historial.length - 1 && (
                    <span className="absolute left-[3px] top-3 bottom-[-16px] w-px bg-border-soft" aria-hidden="true" />
                  )}
                  <span className="absolute left-0 top-1 w-2 h-2 rounded-full bg-brand-primary-600" aria-hidden="true" />
                  <span className="font-semibold capitalize text-text-primary text-sm">{h.estado}</span>
                  <p className="text-xs text-text-secondary">
                    {formatFecha(h.created_at)}{h.nota ? ` · ${h.nota}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pedido.estado === 'pendiente' && whatsappConfigurado && (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola! Quiero coordinar mi pedido ${pedido.codigo}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="btn-whatsapp w-full block text-center"
          >
            💬 Coordinar por WhatsApp
          </a>
        )}

        {(pedido.estado === 'vencido' || pedido.estado === 'cancelado') && (
          <Link to="/" className="btn-secondary w-full block text-center">
            ← Volver al catálogo
          </Link>
        )}
      </div>
    </div>
  )
}
