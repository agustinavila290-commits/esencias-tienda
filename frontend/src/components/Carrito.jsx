import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import { useToast } from '../context/ToastContext'
import { pedidosService } from '../services/api'
import { WHATSAPP_NUMBER } from '../config'
import { validarCliente } from '../utils/validarCliente'
import ReservaCountdown from './ReservaCountdown'

function formatPrecio(n) {
  return '$' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

function formatHora(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function Carrito() {
  const { items, abierto, setAbierto, cambiarCantidad, quitar, vaciar, totalPrecio } = useCarrito()
  const toast = useToast()
  const [clienteNombre, setClienteNombre]       = useState('')
  const [clienteEmail, setClienteEmail]         = useState('')
  const [clienteTel, setClienteTel]             = useState('')
  const [clienteDireccion, setClienteDireccion] = useState('')
  const [cargando, setCargando]                 = useState(false)
  const [cargandoMP, setCargandoMP]             = useState(false)
  const [error, setError]                       = useState('')
  const [pedidoCreado, setPedidoCreado]         = useState(null)

  useEffect(() => {
    if (!abierto) return undefined
    const onKeyDown = e => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [abierto, setAbierto])

  if (!abierto) return null

  const resetCliente = () => {
    setClienteNombre('')
    setClienteEmail('')
    setClienteTel('')
    setClienteDireccion('')
    setError('')
  }

  const cerrarTodo = () => {
    setPedidoCreado(null)
    setAbierto(false)
  }

  const validar = () => {
    const { valido, error: msg } = validarCliente({ email: clienteEmail, telefono: clienteTel })
    if (!valido) setError(msg)
    return valido
  }

  const crearReserva = async () => {
    return pedidosService.crear({
      line_items:        items.map(i => ({ producto_id: i.id, cantidad: i.cantidad })),
      cliente_nombre:    clienteNombre.trim(),
      cliente_email:     clienteEmail.trim(),
      cliente_telefono:  clienteTel.trim(),
      cliente_direccion: clienteDireccion.trim(),
    })
  }

  const handleFinalizar = async () => {
    if (items.length === 0) return
    if (!validar()) return
    setError('')
    setCargando(true)
    try {
      const res = await crearReserva()
      const pedido = res.data
      const { codigo, expires_at, total } = pedido
      const lineas = items.map(i => `• ${i.nombre} x${i.cantidad} — ${formatPrecio(i.precio * i.cantidad)}`)
      const msg = [
        `Hola! Quiero hacer el siguiente pedido 🌿`,
        '',
        ...lineas,
        '',
        `Total: ${formatPrecio(total)}`,
        '',
        `Código de reserva: ${codigo}`,
        `Reservado hasta las ${formatHora(expires_at)} hs.`,
        '',
        `Quedo a la espera de la confirmación, gracias!`,
      ].join('\n')

      vaciar()
      resetCliente()
      // Mantenemos el panel abierto mostrando la confirmación + el contador de
      // la reserva en vez de cerrar todo de golpe, para que quede claro qué
      // pasó y hasta cuándo vale la reserva (ver ReservaCountdown más abajo).
      setPedidoCreado(pedido)
      toast({ message: '¡Reserva creada! Abriendo WhatsApp...', type: 'success' })
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
    } catch (err) {
      const detalle = err.response?.data?.detalle
      setError(Array.isArray(detalle) ? detalle.join('\n') : (err.response?.data?.error || 'Error al procesar el pedido. Intentá de nuevo.'))
    } finally {
      setCargando(false)
    }
  }

  const handlePagarMP = async () => {
    if (items.length === 0) return
    if (!validar()) return
    setError('')
    setCargandoMP(true)
    try {
      const res = await crearReserva()
      const prefRes = await pedidosService.crearPreferencia(res.data.id)
      vaciar()
      setAbierto(false)
      resetCliente()
      window.location.href = prefRes.data.init_point
    } catch (err) {
      const detalle = err.response?.data?.detalle
      setError(Array.isArray(detalle) ? detalle.join('\n') : (err.response?.data?.error || 'Error al conectar con Mercado Pago. Intentá de nuevo.'))
    } finally {
      setCargandoMP(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setAbierto(false)} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-tierra-600">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.1 17 7 17h11v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0023.45 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            <h2 className="font-bold text-gray-800 text-lg">Tu carrito</h2>
            {items.length > 0 && (
              <span className="bg-tierra-100 text-tierra-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {items.reduce((a, i) => a + i.cantidad, 0)}
              </span>
            )}
          </div>
          <button onClick={cerrarTodo} aria-label="Cerrar carrito" className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <svg viewBox="0 0 20 20" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
            </svg>
          </button>
        </div>

        {pedidoCreado ? (
          /* Confirmación de la reserva recién creada, con contador de vencimiento */
          <div className="px-5 py-6 space-y-4 overflow-y-auto">
            <div className="text-center">
              <p className="text-4xl mb-2">✅</p>
              <h3 className="font-bold text-gray-800 text-lg">¡Reserva creada!</h3>
              <p className="text-gray-500 text-sm mt-1">
                Código: <span className="font-mono font-bold text-tierra-700">{pedidoCreado.codigo}</span>
              </p>
            </div>

            <ReservaCountdown expiresAt={pedidoCreado.expires_at} estado={pedidoCreado.estado} />

            <p className="text-sm text-gray-500 text-center">
              Ya te abrimos WhatsApp para coordinar. Si se cerró, podés escribirnos
              de nuevo con el código de arriba, o seguir el estado del pedido acá:
            </p>

            <Link
              to={`/pedido/${pedidoCreado.codigo}?token=${pedidoCreado.tracking_token}`}
              onClick={cerrarTodo}
              className="btn-primary w-full block text-center"
            >
              Ver seguimiento del pedido
            </Link>
            <button onClick={cerrarTodo} className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Seguir comprando
            </button>
          </div>
        ) : (
        <>
        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-0">
          {items.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <svg viewBox="0 0 24 24" className="w-14 h-14 fill-gray-200 mx-auto mb-3">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.1 17 7 17h11v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0023.45 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
              <p className="font-medium">El carrito está vacío</p>
              <p className="text-sm mt-1">Agregá productos desde el catálogo</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-tierra-50 rounded-2xl p-3">
                {item.imagen_url ? (
                  <img src={item.imagen_url} alt={item.nombre} className="w-16 h-16 object-cover rounded-xl flex-shrink-0 border border-tierra-100" />
                ) : (
                  <div className="w-16 h-16 bg-tierra-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🌿</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{item.nombre}</p>
                  <p className="text-tierra-500 text-xs mt-0.5">{formatPrecio(item.precio)} c/u</p>
                  {item.cantidad > 1 && (
                    <p className="text-tierra-700 font-bold text-sm">{formatPrecio(item.precio * item.cantidad)}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button onClick={() => quitar(item.id)} className="text-gray-300 hover:text-red-400 transition-colors" aria-label="Eliminar">
                    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
                      <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                    </svg>
                  </button>
                  <div className="flex items-center gap-1.5 bg-white rounded-xl border border-gray-200 px-1 py-0.5">
                    <button onClick={() => cambiarCantidad(item.id, item.cantidad - 1)} aria-label={`Restar una unidad de ${item.nombre}`} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-tierra-700 font-bold text-lg leading-none transition-colors">−</button>
                    <span className="w-5 text-center font-bold text-sm text-gray-800" aria-label={`Cantidad: ${item.cantidad}`}>{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.id, Math.min(item.cantidad + 1, item.stock_disponible))} disabled={item.cantidad >= item.stock_disponible} aria-label={`Sumar una unidad de ${item.nombre}`} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-tierra-700 font-bold text-lg leading-none transition-colors disabled:opacity-30">+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer checkout */}
        {items.length > 0 && (
          <div className="px-4 pt-3 pb-5 border-t border-gray-100 space-y-2.5 flex-shrink-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-500 text-sm font-medium">Total del pedido</span>
              <span className="text-tierra-700 font-bold text-2xl">{formatPrecio(totalPrecio)}</span>
            </div>

            {/* Datos del cliente */}
            <input type="text" placeholder="Tu nombre (opcional)" aria-label="Tu nombre (opcional)" value={clienteNombre}
              onChange={e => setClienteNombre(e.target.value)} className="input-field text-sm" />
            <input type="email" placeholder="Email (opcional)" aria-label="Email (opcional)" value={clienteEmail}
              onChange={e => setClienteEmail(e.target.value)} className="input-field text-sm" />
            <input type="tel" placeholder="Teléfono (opcional)" aria-label="Teléfono (opcional)" value={clienteTel}
              onChange={e => setClienteTel(e.target.value)} className="input-field text-sm" />
            <input type="text" placeholder="Dirección de envío (opcional)" aria-label="Dirección de envío (opcional)" value={clienteDireccion}
              onChange={e => setClienteDireccion(e.target.value)} className="input-field text-sm" />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm whitespace-pre-line">
                {error}
              </div>
            )}

            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Al confirmar reservamos tu pedido y tu stock por <strong>1 hora</strong>.
              Si en ese tiempo no se coordina el pago, la reserva vence automáticamente
              y el stock vuelve a estar disponible para otros clientes.
            </p>

            <button onClick={handlePagarMP} disabled={cargandoMP || cargando} className="btn-mp w-full">
              {cargandoMP ? <span className="text-sm">Procesando...</span> : (
                <>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                  </svg>
                  Pagar con Mercado Pago
                </>
              )}
            </button>

            <button onClick={handleFinalizar} disabled={cargando || cargandoMP} className="btn-whatsapp w-full">
              {cargando ? <span className="text-sm">Procesando...</span> : (
                <>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Coordinar por WhatsApp
                </>
              )}
            </button>
          </div>
        )}
        </>
        )}
      </div>
    </>
  )
}
