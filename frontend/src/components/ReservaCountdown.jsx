import { useEffect, useRef, useState } from 'react'

function calcularSegundosRestantes(expiresAt) {
  if (!expiresAt) return 0
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.floor(diffMs / 1000))
}

function formatDuracion(segundos) {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatHora(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/**
 * Contador de vencimiento de una reserva de pedido. El instante de
 * vencimiento (`expiresAt`) viene siempre del backend — acá solo se usa el
 * reloj del navegador para actualizar la cuenta regresiva visualmente; el
 * momento real en que expira nunca se calcula sumando tiempo en el cliente.
 *
 * Cuando el contador llega a 0, avisa una única vez vía `onExpirar` (pensado
 * para que quien lo use vuelva a consultar el pedido al backend en vez de
 * confiar en que el estado local siga siendo correcto).
 */
export default function ReservaCountdown({ expiresAt, estado, onExpirar }) {
  const [segundosRestantes, setSegundosRestantes] = useState(() => calcularSegundosRestantes(expiresAt))
  const avisadoRef = useRef(false)

  useEffect(() => {
    avisadoRef.current = false
    setSegundosRestantes(calcularSegundosRestantes(expiresAt))

    if (estado !== 'pendiente' || !expiresAt) return undefined

    const id = setInterval(() => {
      const restante = calcularSegundosRestantes(expiresAt)
      setSegundosRestantes(restante)
      if (restante <= 0 && !avisadoRef.current) {
        avisadoRef.current = true
        onExpirar?.()
      }
    }, 1000)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, estado])

  if (estado !== 'pendiente') return null

  const vencida = segundosRestantes <= 0
  const porVencer = !vencida && segundosRestantes <= 5 * 60

  return (
    <div
      role="status"
      className={`rounded-xl p-3 text-sm font-medium flex items-start gap-2 ${
        vencida ? 'bg-error-bg text-error' : porVencer ? 'bg-warning-bg text-warning' : 'bg-brand-primary-50 text-brand-primary-700'
      }`}
    >
      <span className="flex-shrink-0">{vencida ? '⏰' : '⏱'}</span>
      {vencida ? (
        <span>La reserva de este pedido venció y el stock ya fue liberado. Si todavía te interesa, escribinos por WhatsApp.</span>
      ) : (
        <span>
          Reserva válida por <strong>{formatDuracion(segundosRestantes)}</strong> más
          {' '}(vence a las {formatHora(expiresAt)} hs){porVencer && ' · ¡quedan pocos minutos!'}
        </span>
      )}
    </div>
  )
}
