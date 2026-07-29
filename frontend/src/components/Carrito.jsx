import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import { useToast } from '../context/ToastContext'
import { pedidosService, productosService } from '../services/api'
import { WHATSAPP_NUMBER } from '../config'
import { validarCliente } from '../utils/validarCliente'
import ReservaCountdown from './ReservaCountdown'
import QuantitySelector from './QuantitySelector'

function formatPrecio(n) {
  return '$' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

function formatHora(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const AVISO_ESTILO = {
  no_disponible: 'text-error',
  agotado:       'text-error',
  ajustada:      'text-warning',
  precio:        'text-warning',
}

function CarritoIcono({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.1 17 7 17h11v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0023.45 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>
  )
}

function CartItem({ item, aviso, onQuitar, onCambiarCantidad, onCerrar }) {
  const href = item.slug ? `/productos/${item.slug}` : `/producto/${item.id}`
  const bloqueado = aviso?.tipo === 'agotado' || aviso?.tipo === 'no_disponible'

  return (
    <li className="border-b border-border-soft py-4 last:border-0">
      <div className="flex gap-3">
        <Link to={href} onClick={onCerrar} className="flex-shrink-0" tabIndex={-1} aria-hidden="true">
          {item.imagen_url ? (
            <img src={item.imagen_url} alt="" className="w-20 h-20 object-cover rounded-xl border border-border-soft" />
          ) : (
            <div className="w-20 h-20 bg-brand-primary-50 rounded-xl flex items-center justify-center text-2xl">🌿</div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link to={href} onClick={onCerrar} className="block hover:text-brand-primary-700 transition-colors">
            <p className="font-semibold text-sm text-text-primary line-clamp-2 leading-snug">{item.nombre}</p>
          </Link>
          {item.categoria_nombre && (
            <p className="text-text-secondary text-xs mt-0.5">{item.categoria_nombre}</p>
          )}

          <div className="flex items-end justify-between gap-2 mt-2.5 flex-wrap">
            <QuantitySelector
              size="sm"
              cantidad={item.cantidad}
              max={item.stock_disponible}
              nombreProducto={item.nombre}
              onCambiar={(n) => onCambiarCantidad(item.id, n)}
            />
            <p className="text-brand-primary-700 font-bold text-sm">{formatPrecio(item.precio * item.cantidad)}</p>
          </div>

          {item.cantidad >= item.stock_disponible && !bloqueado && (
            <p className="text-warning text-xs mt-1.5">Solo quedan {item.stock_disponible} unidades disponibles.</p>
          )}
          {aviso && (
            <p className={`text-xs mt-1.5 font-medium ${AVISO_ESTILO[aviso.tipo] || 'text-text-secondary'}`}>
              {aviso.mensaje}
            </p>
          )}

          <button
            onClick={() => onQuitar(item)}
            className="text-xs font-semibold text-error hover:underline mt-2 min-h-[32px] -ml-0.5 px-0.5"
          >
            Eliminar
          </button>
        </div>
      </div>
    </li>
  )
}

function CartEmptyState({ onCerrar }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-14">
      <svg viewBox="0 0 24 24" className="w-16 h-16 stroke-brand-primary-300 mb-4" fill="none" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h2l2.4 12.2a1.6 1.6 0 001.6 1.3h8.4a1.6 1.6 0 001.6-1.3L21.5 9H7" />
        <circle cx="10" cy="21" r="1.1" />
        <circle cx="17.5" cy="21" r="1.1" />
      </svg>
      <p className="font-display font-semibold text-text-primary text-lg">Tu carrito está vacío</p>
      <p className="text-text-secondary text-sm mt-1.5 max-w-[26ch]">
        Descubrí sahumerios y esencias para transformar tus espacios.
      </p>
      <Link to="/" onClick={onCerrar} className="btn-primary inline-flex mt-6 px-8">
        Explorar productos
      </Link>
    </div>
  )
}

export default function Carrito() {
  const {
    items, abierto, setAbierto, cambiarCantidad, quitar, restaurar,
    actualizarDatosProducto, vaciar, totalPrecio,
  } = useCarrito()
  const toast = useToast()

  const [clienteNombre, setClienteNombre]       = useState('')
  const [clienteEmail, setClienteEmail]         = useState('')
  const [clienteTel, setClienteTel]             = useState('')
  const [clienteDireccion, setClienteDireccion] = useState('')
  const [cargando, setCargando]                 = useState(false)
  const [cargandoMP, setCargandoMP]             = useState(false)
  const [error, setError]                       = useState('')
  const [pedidoCreado, setPedidoCreado]         = useState(null)
  // Paso 2 del resumen: elegir el medio de pago. Recién ahí se muestran los
  // botones que de verdad crean la reserva — "Continuar con la compra" solo
  // valida los datos y los revela, no hace ninguna llamada al backend.
  const [mostrarPago, setMostrarPago]           = useState(false)

  const [avisos, setAvisos]           = useState({})
  const [revalidando, setRevalidando] = useState(false)
  const [anuncio, setAnuncio]         = useState('')

  // Animación de entrada/salida: se mantiene montado un instante extra al
  // cerrar para que la transición de salida llegue a verse.
  const [montado, setMontado] = useState(false)
  const [visible, setVisible] = useState(false)
  const dialogRef = useRef(null)
  const closeBtnRef = useRef(null)
  const disparadorRef = useRef(null)

  useEffect(() => {
    if (abierto) {
      disparadorRef.current = document.activeElement
      setMontado(true)
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
      return () => cancelAnimationFrame(frame)
    }
    setVisible(false)
    const t = setTimeout(() => setMontado(false), 320)
    return () => clearTimeout(t)
  }, [abierto])

  useEffect(() => {
    if (visible) closeBtnRef.current?.focus()
  }, [visible])

  useEffect(() => {
    if (montado) return
    // El disparador puede haber desaparecido (ej. el botón "Ver carrito" de
    // un toast que ya se auto-cerró) — en ese caso se cae al botón del
    // carrito en el header, que siempre está presente, antes que perder el
    // foco silenciosamente.
    const disparador = disparadorRef.current
    const destino = (disparador instanceof HTMLElement && document.body.contains(disparador))
      ? disparador
      : document.querySelector('[aria-label^="Abrir carrito"]')
    destino?.focus()
    disparadorRef.current = null
  }, [montado])

  useEffect(() => {
    if (!montado) return undefined
    document.body.style.overflow = 'hidden'
    const onKeyDown = e => {
      if (e.key === 'Escape') { setAbierto(false); return }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusables = dialogRef.current.querySelectorAll('a,button:not(:disabled),input,select,textarea,[tabindex]:not([tabindex="-1"])')
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [montado, setAbierto])

  // Revalidación contra el backend al abrir: no crea ninguna reserva, solo
  // refresca precio/stock reales y avisa si algo cambió. No confiamos en el
  // precio/stock guardados en localStorage como fuente de verdad.
  useEffect(() => {
    if (!abierto || pedidoCreado || items.length === 0) { setAvisos({}); return undefined }
    let cancelado = false
    setRevalidando(true)
    Promise.allSettled(items.map(i => productosService.get(i.id)))
      .then(resultados => {
        if (cancelado) return
        const nuevosAvisos = {}
        resultados.forEach((r, idx) => {
          const item = items[idx]
          if (r.status === 'rejected') {
            nuevosAvisos[item.id] = { tipo: 'no_disponible', mensaje: 'Este producto ya no está disponible. Eliminalo para continuar.' }
            return
          }
          const data = r.value.data
          const precioAnterior = item.precio
          const precioNuevo = parseFloat(data.precio)
          actualizarDatosProducto(item.id, { precio: precioNuevo, stock_disponible: data.stock_disponible })
          if (data.stock_disponible === 0) {
            nuevosAvisos[item.id] = { tipo: 'agotado', mensaje: 'Este producto se agotó. Eliminalo para continuar.' }
          } else if (item.cantidad > data.stock_disponible) {
            nuevosAvisos[item.id] = { tipo: 'ajustada', mensaje: `Solo quedan ${data.stock_disponible} unidades disponibles. Ajustamos la cantidad.` }
          } else if (Math.abs(precioNuevo - precioAnterior) > 0.009) {
            nuevosAvisos[item.id] = { tipo: 'precio', mensaje: `El precio cambió de ${formatPrecio(precioAnterior)} a ${formatPrecio(precioNuevo)}.` }
          }
        })
        setAvisos(nuevosAvisos)
        if (Object.keys(nuevosAvisos).length > 0) setAnuncio('Actualizamos el total de tu carrito.')
      })
      .finally(() => { if (!cancelado) setRevalidando(false) })
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  if (!montado) return null

  const resetCliente = () => {
    setClienteNombre('')
    setClienteEmail('')
    setClienteTel('')
    setClienteDireccion('')
    setError('')
  }

  const cerrar = () => setAbierto(false)

  const cerrarTodo = () => {
    setPedidoCreado(null)
    setMostrarPago(false)
    setAbierto(false)
  }

  const handleQuitar = (item) => {
    const indice = items.findIndex(i => i.id === item.id)
    quitar(item.id)
    setAvisos(prev => {
      const next = { ...prev }
      delete next[item.id]
      return next
    })
    setAnuncio(`${item.nombre} eliminado del carrito`)
    toast({
      message: 'Producto eliminado del carrito',
      type: 'info',
      action: { label: 'Deshacer', onClick: () => restaurar(item, indice) },
    })
  }

  const handleCambiarCantidad = (id, cantidad) => cambiarCantidad(id, cantidad)

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

  const hayBloqueos = Object.values(avisos).some(a => a.tipo === 'agotado' || a.tipo === 'no_disponible')
  const accionesDeshabilitadas = items.length === 0 || hayBloqueos || cargando || cargandoMP || revalidando

  // "Continuar con la compra" no crea nada todavía — solo valida los datos
  // opcionales y revela los medios de pago reales (Mercado Pago/WhatsApp),
  // que son los que efectivamente generan la reserva en el backend.
  const handleContinuar = () => {
    if (accionesDeshabilitadas) return
    if (!validar()) return
    setMostrarPago(true)
  }

  const handleFinalizar = async () => {
    if (accionesDeshabilitadas) return
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
      setMostrarPago(false)
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
    if (accionesDeshabilitadas) return
    if (!validar()) return
    setError('')
    setCargandoMP(true)
    try {
      const res = await crearReserva()
      const prefRes = await pedidosService.crearPreferencia(res.data.id)
      vaciar()
      resetCliente()
      window.location.href = prefRes.data.init_point
    } catch (err) {
      const detalle = err.response?.data?.detalle
      setError(Array.isArray(detalle) ? detalle.join('\n') : (err.response?.data?.error || 'Error al conectar con Mercado Pago. Intentá de nuevo.'))
    } finally {
      setCargandoMP(false)
    }
  }

  const whatsappConfigurado = WHATSAPP_NUMBER && WHATSAPP_NUMBER !== '549XXXXXXXXXX'
  const cantidadTotal = items.reduce((a, i) => a + i.cantidad, 0)

  return (
    <>
      <div
        onClick={cerrar}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-text-primary/50 backdrop-blur-sm transition-opacity motion-reduce:transition-none duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={`fixed inset-0 lg:inset-y-0 lg:left-auto lg:right-0 z-50 w-full lg:w-[460px] lg:max-w-[92vw] bg-surface-elevated shadow-elevated flex flex-col
          transition-transform motion-reduce:transition-none duration-300 ease-out
          ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Aria-live silencioso para avisos (deshacer, revalidación, etc.) */}
        <p className="sr-only" role="status" aria-live="polite">{anuncio}</p>

        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CarritoIcono className="w-5 h-5 fill-brand-primary-600 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display font-semibold text-text-primary text-lg leading-tight">Tu carrito</h2>
              {items.length > 0 && (
                <p className="text-text-secondary text-xs">{cantidadTotal} producto{cantidadTotal !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <button
            ref={closeBtnRef}
            onClick={cerrarTodo}
            aria-label="Cerrar carrito"
            className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full hover:bg-background-secondary text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg viewBox="0 0 20 20" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
            </svg>
          </button>
        </div>

        {pedidoCreado ? (
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
            <div className="text-center">
              <p className="text-4xl mb-2">✅</p>
              <h3 className="font-display font-semibold text-text-primary text-lg">¡Reserva creada!</h3>
              <p className="text-text-secondary text-sm mt-1">
                Código: <span className="font-mono font-bold text-brand-primary-700">{pedidoCreado.codigo}</span>
              </p>
            </div>

            <ReservaCountdown expiresAt={pedidoCreado.expires_at} estado={pedidoCreado.estado} />

            <p className="text-sm text-text-secondary text-center">
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
            <button onClick={cerrarTodo} className="w-full py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
              Seguir comprando
            </button>
          </div>
        ) : items.length === 0 ? (
          <CartEmptyState onCerrar={cerrar} />
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5 min-h-0">
              {items.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  aviso={avisos[item.id]}
                  onQuitar={handleQuitar}
                  onCambiarCantidad={handleCambiarCantidad}
                  onCerrar={cerrar}
                />
              ))}
            </ul>

            {/* Resumen fijo */}
            <div
              className="px-5 pt-4 border-t border-border-soft shadow-[0_-4px_12px_-6px_rgba(41,45,41,0.12)] flex-shrink-0 space-y-3"
              style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex justify-between items-baseline">
                <span className="text-text-secondary text-sm font-medium">Subtotal</span>
                <span className="text-brand-primary-700 font-bold text-2xl tabular-nums">{formatPrecio(totalPrecio)}</span>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                El stock se reserva durante 1 hora cuando confirmás el pedido.
              </p>

              {/* Datos del cliente */}
              <div className="space-y-2">
                <input type="text" placeholder="Tu nombre (opcional)" aria-label="Tu nombre (opcional)" value={clienteNombre}
                  onChange={e => setClienteNombre(e.target.value)} className="input-field text-sm" />
                <input type="email" placeholder="Email (opcional)" aria-label="Email (opcional)" value={clienteEmail}
                  onChange={e => setClienteEmail(e.target.value)} className="input-field text-sm" />
                <input type="tel" placeholder="Teléfono (opcional)" aria-label="Teléfono (opcional)" value={clienteTel}
                  onChange={e => setClienteTel(e.target.value)} className="input-field text-sm" />
                <input type="text" placeholder="Dirección de envío (opcional)" aria-label="Dirección de envío (opcional)" value={clienteDireccion}
                  onChange={e => setClienteDireccion(e.target.value)} className="input-field text-sm" />
              </div>

              {error && (
                <div role="alert" className="bg-error-bg border border-error/30 rounded-xl p-3 text-error text-sm whitespace-pre-line">
                  {error}
                </div>
              )}
              {hayBloqueos && !error && (
                <div role="alert" className="bg-error-bg border border-error/30 rounded-xl p-3 text-error text-sm">
                  Resolvé los productos marcados arriba para poder continuar.
                </div>
              )}

              {!mostrarPago ? (
                <>
                  <button
                    onClick={handleContinuar}
                    disabled={accionesDeshabilitadas}
                    className="btn-primary w-full min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar con la compra
                  </button>
                  <button onClick={cerrar} className="w-full py-2 text-sm font-medium text-text-secondary hover:text-brand-primary-700 transition-colors">
                    Seguir comprando
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setMostrarPago(false)}
                    className="text-xs font-medium text-text-secondary hover:text-brand-primary-700 flex items-center gap-1"
                  >
                    ← Editar datos
                  </button>
                  <p className="text-sm font-semibold text-text-primary">¿Cómo querés pagar?</p>

                  <button onClick={handlePagarMP} disabled={accionesDeshabilitadas} className="btn-mp w-full">
                    {cargandoMP ? <span className="text-sm">Procesando...</span> : (
                      <>
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                          <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                        </svg>
                        Pagar con Mercado Pago
                      </>
                    )}
                  </button>

                  {whatsappConfigurado && (
                    <button onClick={handleFinalizar} disabled={accionesDeshabilitadas} className="btn-whatsapp w-full">
                      {cargando ? <span className="text-sm">Procesando...</span> : (
                        <>
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Coordinar por WhatsApp
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
