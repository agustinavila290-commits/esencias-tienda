import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { productosService, pedidosService, categoriasService } from '../services/api'
import { TIENDA_NOMBRE } from '../config'
import Seo from '../components/Seo'

function formatPrecio(n) {
  return '$' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

function formatHora(iso) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

// ── Modal categoría ────────────────────────────────────────────────────────────
function ModalCategoria({ categoria, onCerrar, onGuardado }) {
  const toast = useToast()
  const [form, setForm] = useState({
    nombre: categoria?.nombre || '',
    icono:  categoria?.icono  || '',
    descripcion: categoria?.descripcion || '',
    orden:  categoria?.orden  ?? 0,
    activo: categoria?.activo ?? true,
  })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKeyDown = e => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCerrar])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nombre.trim()) return setError('El nombre es obligatorio.')
    setError('')
    setCargando(true)
    try {
      if (categoria?.id) {
        await categoriasService.update(categoria.id, form)
        toast({ message: 'Categoría actualizada' })
      } else {
        await categoriasService.create(form)
        toast({ message: 'Categoría creada' })
      }
      onGuardado()
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Error al guardar.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="modal-categoria-titulo" className="bg-surface w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 id="modal-categoria-titulo" className="font-sans font-bold text-text-primary">{categoria?.id ? 'Editar categoría' : 'Nueva categoría'}</h3>
          <button onClick={onCerrar} aria-label="Cerrar" className="text-text-secondary hover:text-text-primary text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="categoria-nombre" className="block text-sm font-medium text-text-primary mb-1">Nombre *</label>
            <input id="categoria-nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className="input-field" required placeholder="ej. Sahumerios" />
          </div>
          <div>
            <label htmlFor="categoria-icono" className="block text-sm font-medium text-text-primary mb-1">Ícono (emoji)</label>
            <input id="categoria-icono" value={form.icono} onChange={e => setForm(f => ({ ...f, icono: e.target.value }))}
              className="input-field" placeholder="ej. 🌿" maxLength={4} />
          </div>
          <div>
            <label htmlFor="categoria-descripcion" className="block text-sm font-medium text-text-primary mb-1">Descripción</label>
            <textarea id="categoria-descripcion" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              className="input-field resize-none" rows={2} placeholder="Se muestra en la página pública de la categoría" />
          </div>
          <div>
            <label htmlFor="categoria-orden" className="block text-sm font-medium text-text-primary mb-1">Orden de aparición</label>
            <input id="categoria-orden" type="number" min="0" value={form.orden}
              onChange={e => setForm(f => ({ ...f, orden: parseInt(e.target.value) || 0 }))}
              className="input-field" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.activo}
              onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
              className="w-5 h-5 accent-brand-primary-600" />
            <span className="text-sm font-medium text-text-primary">Activa (visible en tienda)</span>
          </label>
          {error && <p className="text-error text-sm bg-error-bg p-3 rounded-xl">{error}</p>}
          <button type="submit" disabled={cargando} className="btn-primary w-full">
            {cargando ? 'Guardando...' : 'Guardar categoría'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Modal producto ─────────────────────────────────────────────────────────────
function ModalProducto({ producto, categorias, onCerrar, onGuardado }) {
  const toast = useToast()
  const [form, setForm] = useState({
    nombre:      producto?.nombre      || '',
    descripcion: producto?.descripcion || '',
    precio:      producto?.precio      || '',
    stock:       producto?.stock       ?? 0,
    activo:      producto?.activo      ?? true,
    categoria:   producto?.categoria   ?? '',
  })
  const [imagen, setImagen] = useState(null)
  const [preview, setPreview] = useState(producto?.imagen_url || '')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    const onKeyDown = e => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCerrar])

  const handleImagen = e => {
    const file = e.target.files[0]
    if (!file) return
    setImagen(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nombre.trim()) return setError('El nombre es obligatorio.')
    if (!form.precio || Number(form.precio) <= 0) return setError('El precio debe ser mayor a 0.')
    if (Number(form.stock) < 0) return setError('El stock no puede ser negativo.')
    setError('')
    setCargando(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (imagen) fd.append('imagen', imagen)

      if (producto?.id) {
        await productosService.update(producto.id, fd)
        toast({ message: 'Producto actualizado' })
      } else {
        await productosService.create(fd)
        toast({ message: 'Producto creado' })
      }
      onGuardado()
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Error al guardar.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="modal-producto-titulo" className="bg-surface w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[95vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 id="modal-producto-titulo" className="font-sans font-bold text-text-primary">{producto?.id ? 'Editar producto' : 'Nuevo producto'}</h3>
          <button onClick={onCerrar} aria-label="Cerrar" className="text-text-secondary hover:text-text-primary text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Imagen */}
          <div>
            <label id="producto-imagen-label" className="block text-sm font-medium text-text-primary mb-2">Imagen</label>
            <div
              onClick={() => fileRef.current.click()}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current.click() } }}
              role="button" tabIndex={0} aria-labelledby="producto-imagen-label"
              className="aspect-video bg-brand-primary-50 border-2 border-dashed border-brand-primary-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-brand-primary-100 transition-colors overflow-hidden"
            >
              {preview ? (
                <img src={preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-brand-primary-400">
                  <p className="text-3xl">📷</p>
                  <p className="text-sm mt-1">Tocá para subir foto</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImagen} className="hidden" aria-label="Subir imagen del producto" />
          </div>

          <div>
            <label htmlFor="producto-nombre" className="block text-sm font-medium text-text-primary mb-1">Nombre *</label>
            <input id="producto-nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className="input-field" required />
          </div>
          <div>
            <label htmlFor="producto-descripcion" className="block text-sm font-medium text-text-primary mb-1">Descripción</label>
            <textarea id="producto-descripcion" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              className="input-field resize-none" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="producto-precio" className="block text-sm font-medium text-text-primary mb-1">Precio * ($)</label>
              <input id="producto-precio" type="number" step="0.01" min="0.01" value={form.precio}
                onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                className="input-field" required />
            </div>
            <div>
              <label htmlFor="producto-stock" className="block text-sm font-medium text-text-primary mb-1">Stock real</label>
              <input id="producto-stock" type="number" min="0" value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <div>
            <label htmlFor="producto-categoria" className="block text-sm font-medium text-text-primary mb-1">Categoría</label>
            <select id="producto-categoria" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value || '' }))}
              className="input-field">
              <option value="">Sin categoría</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.icono ? `${c.icono} ` : ''}{c.nombre}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.activo}
              onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
              className="w-5 h-5 accent-brand-primary-600" />
            <span className="text-sm font-medium text-text-primary">Producto activo (visible en tienda)</span>
          </label>

          {error && <p className="text-error text-sm bg-error-bg p-3 rounded-xl">{error}</p>}
          <button type="submit" disabled={cargando} className="btn-primary w-full">
            {cargando ? 'Guardando...' : 'Guardar producto'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function Admin() {
  const { logout } = useAuth()
  const navigate   = useNavigate()
  const toast      = useToast()

  const [tab, setTab]                       = useState('pedidos')
  const [productos, setProductos]           = useState([])
  const [pedidos, setPedidos]               = useState([])
  const [categorias, setCategorias]         = useState([])
  const [filtroEstado, setFiltroEstado]     = useState('')
  const [modalProducto, setModalProducto]   = useState(null)
  const [modalCategoria, setModalCategoria] = useState(null)
  const [cargando, setCargando]             = useState(false)

  const cargarProductos = () => {
    setCargando(true)
    Promise.all([productosService.adminList(), categoriasService.adminList()])
      .then(([resProd, resCat]) => { setProductos(resProd.data); setCategorias(resCat.data) })
      .finally(() => setCargando(false))
  }

  const cargarPedidos = () => {
    setCargando(true)
    pedidosService.adminList()
      .then(r => setPedidos(r.data))
      .finally(() => setCargando(false))
  }

  const cargarCategorias = () => {
    setCargando(true)
    categoriasService.adminList()
      .then(r => setCategorias(r.data))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    if (tab === 'productos')       cargarProductos()
    else if (tab === 'pedidos')    cargarPedidos()
    else                           cargarCategorias()
  }, [tab])

  const handleLogout = () => { logout(); navigate('/login') }

  const handleConfirmar = async id => {
    if (!confirm('¿Confirmar pedido y descontar stock?')) return
    try { await pedidosService.confirmar(id); toast({ message: 'Pedido confirmado ✓' }); cargarPedidos() }
    catch (e) { toast({ message: e.response?.data?.error || 'Error', type: 'error' }) }
  }

  const handleCancelar = async id => {
    if (!confirm('¿Cancelar este pedido?')) return
    try { await pedidosService.cancelar(id); toast({ message: 'Pedido cancelado', type: 'warning' }); cargarPedidos() }
    catch (e) { toast({ message: e.response?.data?.error || 'Error', type: 'error' }) }
  }

  const handleMarcarEnviado = async id => {
    if (!confirm('¿Marcar como enviado?')) return
    try { await pedidosService.marcarEnviado(id); toast({ message: '🚚 Pedido marcado como enviado' }); cargarPedidos() }
    catch (e) { toast({ message: e.response?.data?.error || 'Error', type: 'error' }) }
  }

  const handleMarcarEntregado = async id => {
    if (!confirm('¿Marcar como entregado?')) return
    try { await pedidosService.marcarEntregado(id); toast({ message: '✓ Pedido entregado' }); cargarPedidos() }
    catch (e) { toast({ message: e.response?.data?.error || 'Error', type: 'error' }) }
  }

  const handleEliminarProducto = async id => {
    if (!confirm('¿Eliminar este producto? No se puede deshacer.')) return
    await productosService.delete(id)
    toast({ message: 'Producto eliminado', type: 'warning' })
    cargarProductos()
  }

  const handleEliminarCategoria = async id => {
    if (!confirm('¿Eliminar esta categoría? Los productos quedarán sin categoría.')) return
    await categoriasService.delete(id)
    toast({ message: 'Categoría eliminada', type: 'warning' })
    cargarCategorias()
  }

  const ESTADO_COLORES = {
    pendiente:  'bg-warning-bg text-warning',
    confirmado: 'bg-brand-primary-100 text-brand-primary-700',
    enviado:    'bg-brand-secondary-100 text-brand-secondary-800',
    entregado:  'bg-success-bg text-success',
    cancelado:  'bg-background-secondary text-text-secondary',
    vencido:    'bg-error-bg text-error',
  }

  const estadoBadge = p => (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_COLORES[p.estado] || ''}`}>
      {p.estado}
      {p.vigente && p.minutos_restantes != null && ` · ${p.minutos_restantes}min`}
    </span>
  )

  const pedidosFiltrados = filtroEstado ? pedidos.filter(p => p.estado === filtroEstado) : pedidos

  const tabLabel = t => t === 'pedidos' ? '📦 Pedidos' : t === 'productos' ? '🌿 Productos' : '🏷️ Categorías'

  return (
    <div className="min-h-screen bg-brand-primary-50">
      <Seo title="Administración" path="/admin" noindex />
      {/* Header */}
      <header className="bg-surface border-b border-brand-primary-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Logo" className="w-8 h-8 object-cover rounded-full" />
            <span className="font-semibold text-brand-primary-800 text-sm">Admin · {TIENDA_NOMBRE}</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noopener" className="text-sm text-brand-primary-600 hover:text-brand-primary-800">Ver tienda ↗</a>
            <button onClick={handleLogout} className="text-sm text-text-secondary hover:text-error transition-colors">Salir</button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-5 pb-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
          {['pedidos', 'productos', 'categorias'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                tab === t ? 'bg-brand-primary-600 text-white' : 'bg-surface text-text-secondary border border-border-soft hover:bg-background-secondary'
              }`}
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>

        {/* ── PEDIDOS ── */}
        {tab === 'pedidos' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                className="input-field text-sm flex-1 max-w-[180px]">
                <option value="">Todos los estados</option>
                {['pendiente','confirmado','enviado','entregado','cancelado','vencido'].map(e => (
                  <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
                ))}
              </select>
              <button onClick={cargarPedidos} className="text-sm text-brand-primary-600 hover:text-brand-primary-800 flex-shrink-0">↻ Actualizar</button>
            </div>

            {cargando ? (
              <div className="text-center py-10 text-brand-primary-400">Cargando...</div>
            ) : pedidosFiltrados.length === 0 ? (
              <div className="text-center py-10 text-text-secondary">
                No hay pedidos{filtroEstado ? ` con estado "${filtroEstado}"` : ''}.
              </div>
            ) : (
              pedidosFiltrados.map(p => (
                <div key={p.id} className="card p-4 space-y-3">
                  {/* Header del pedido */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-text-primary">{p.codigo}</span>
                        {estadoBadge(p)}
                        <span className="text-xs text-text-secondary">
                          {p.metodo_pago === 'mercadopago' ? '💳 MP' : '💬 WA'}
                        </span>
                      </div>
                      {p.cliente_nombre    && <p className="text-sm text-text-secondary mt-0.5">👤 {p.cliente_nombre}</p>}
                      {p.cliente_email     && <p className="text-xs text-text-secondary">📧 {p.cliente_email}</p>}
                      {p.cliente_telefono  && <p className="text-xs text-text-secondary">📱 {p.cliente_telefono}</p>}
                      {p.cliente_direccion && <p className="text-xs text-text-secondary">📍 {p.cliente_direccion}</p>}
                      <p className="text-xs text-text-secondary mt-0.5">{formatHora(p.created_at)}</p>
                    </div>
                    <span className="font-bold text-brand-primary-700 text-lg flex-shrink-0">{formatPrecio(p.total)}</span>
                  </div>

                  {/* Ítems */}
                  <ul className="text-sm text-text-secondary space-y-0.5 border-t border-border-soft pt-2">
                    {p.items?.map(i => (
                      <li key={i.id}>{i.producto_nombre} x{i.cantidad} — {formatPrecio(i.subtotal)}</li>
                    ))}
                  </ul>

                  {/* Historial de estados */}
                  {p.historial?.length > 0 && (
                    <div className="text-xs text-text-secondary border-t border-border-soft pt-2 space-y-0.5">
                      {p.historial.map(h => (
                        <p key={h.id}>
                          <span className="font-semibold capitalize">{h.estado}</span>
                          {' — '}{formatHora(h.created_at)}
                          {h.nota ? ` · ${h.nota}` : ''}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Acciones según estado */}
                  {p.estado === 'pendiente' && (
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleConfirmar(p.id)}
                        className="flex-1 bg-success hover:brightness-110 text-white font-semibold py-2 rounded-xl text-sm transition-colors">
                        ✓ Confirmar
                      </button>
                      <button onClick={() => handleCancelar(p.id)}
                        className="flex-1 bg-background-secondary hover:bg-border-soft text-text-primary font-semibold py-2 rounded-xl text-sm transition-colors">
                        ✕ Cancelar
                      </button>
                    </div>
                  )}
                  {p.estado === 'confirmado' && (
                    <button onClick={() => handleMarcarEnviado(p.id)}
                      className="w-full bg-brand-secondary-600 hover:bg-brand-secondary-700 text-white font-semibold py-2 rounded-xl text-sm transition-colors">
                      🚚 Marcar como enviado
                    </button>
                  )}
                  {p.estado === 'enviado' && (
                    <button onClick={() => handleMarcarEntregado(p.id)}
                      className="w-full bg-success hover:brightness-110 text-white font-semibold py-2 rounded-xl text-sm transition-colors">
                      ✓ Marcar como entregado
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── PRODUCTOS ── */}
        {tab === 'productos' && (
          <div className="space-y-3 pb-6">
            <div className="flex items-center justify-between">
              <h2 className="font-sans font-bold text-text-primary">Productos ({productos.length})</h2>
              <button onClick={() => setModalProducto({})} className="btn-primary text-sm py-2 px-4">+ Nuevo</button>
            </div>
            {cargando ? (
              <div className="text-center py-10 text-brand-primary-400">Cargando...</div>
            ) : (
              productos.map(p => (
                <div key={p.id} className={`card p-4 flex items-center gap-3 ${!p.activo ? 'opacity-50' : ''}`}>
                  {(p.imagen_thumbnail_url || p.imagen_url) ? (
                    <img src={p.imagen_thumbnail_url || p.imagen_url} alt={p.nombre} width={56} height={56} loading="lazy" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-brand-primary-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">🌿</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-text-primary truncate">{p.nombre}</p>
                      {!p.activo && <span className="text-xs text-text-secondary bg-background-secondary px-2 py-0.5 rounded-full">Inactivo</span>}
                      {p.categoria_nombre && (
                        <span className="text-xs text-brand-primary-600 bg-brand-primary-50 px-2 py-0.5 rounded-full">{p.categoria_nombre}</span>
                      )}
                    </div>
                    <p className="text-brand-primary-700 font-bold">{formatPrecio(p.precio)}</p>
                    <p className="text-xs text-text-secondary">
                      Stock real: {p.stock} · Libre: {p.stock_disponible}
                      {p.stock !== p.stock_disponible && (
                        <span className="text-warning ml-1">({p.stock - p.stock_disponible} reservado)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => setModalProducto(p)}
                      className="text-xs bg-brand-primary-50 hover:bg-brand-primary-100 text-brand-primary-700 px-3 py-1.5 rounded-lg transition-colors">
                      Editar
                    </button>
                    <button onClick={() => handleEliminarProducto(p.id)}
                      className="text-xs bg-error-bg hover:bg-error-bg text-error px-3 py-1.5 rounded-lg transition-colors">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── CATEGORÍAS ── */}
        {tab === 'categorias' && (
          <div className="space-y-3 pb-6">
            <div className="flex items-center justify-between">
              <h2 className="font-sans font-bold text-text-primary">Categorías ({categorias.length})</h2>
              <button onClick={() => setModalCategoria({})} className="btn-primary text-sm py-2 px-4">+ Nueva</button>
            </div>
            {cargando ? (
              <div className="text-center py-10 text-brand-primary-400">Cargando...</div>
            ) : categorias.length === 0 ? (
              <div className="text-center py-10 text-text-secondary">
                <p className="text-4xl mb-3">🏷️</p>
                <p>No hay categorías todavía.</p>
                <p className="text-sm mt-1">Creá una para organizar tus productos.</p>
              </div>
            ) : (
              categorias.map(c => (
                <div key={c.id} className="card p-4 flex items-center gap-3">
                  <span className="text-3xl flex-shrink-0 w-10 text-center">{c.icono || '🏷️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary">{c.nombre}</p>
                    <p className="text-xs text-text-secondary">slug: {c.slug} · orden: {c.orden}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    c.activo ? 'bg-success-bg text-success' : 'bg-background-secondary text-text-secondary'
                  }`}>
                    {c.activo ? 'Activa' : 'Inactiva'}
                  </span>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => setModalCategoria(c)}
                      className="text-xs bg-brand-primary-50 hover:bg-brand-primary-100 text-brand-primary-700 px-3 py-1.5 rounded-lg transition-colors">
                      Editar
                    </button>
                    <button onClick={() => handleEliminarCategoria(c.id)}
                      className="text-xs bg-error-bg hover:bg-error-bg text-error px-3 py-1.5 rounded-lg transition-colors">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalProducto !== null && (
        <ModalProducto
          producto={modalProducto?.id ? modalProducto : null}
          categorias={categorias}
          onCerrar={() => setModalProducto(null)}
          onGuardado={() => { setModalProducto(null); cargarProductos() }}
        />
      )}
      {modalCategoria !== null && (
        <ModalCategoria
          categoria={modalCategoria?.id ? modalCategoria : null}
          onCerrar={() => setModalCategoria(null)}
          onGuardado={() => { setModalCategoria(null); cargarCategorias() }}
        />
      )}
    </div>
  )
}
