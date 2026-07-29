import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { INSTAGRAM_URL, WHATSAPP_NUMBER, TIENDA_NOMBRE } from '../config'
import { useCarrito } from '../context/CarritoContext'
import { useUsuario } from '../context/UsuarioContext'
import Carrito from './Carrito'
import BarraCarrito from './BarraCarrito'
import BotonesFlotantes from './BotonesFlotantes'

const NAV_LINKS = [
  { to: '/',                    label: 'Catálogo'   },
  { to: '/sobre-nosotros',      label: 'Nosotros'   },
  { to: '/como-comprar',        label: 'Cómo comprar' },
  { to: '/preguntas-frecuentes', label: 'Preguntas frecuentes' },
  { to: '/contacto',            label: 'Contacto'   },
]

// Solo afirmaciones verdaderas y ya cumplidas por el negocio — no editar sin
// confirmar que el dato sigue siendo cierto (ver sección 10 del brief de marca).
const TOP_BAR_ITEMS = ['Compra segura', 'Stock actualizado', 'Atención personalizada']

function TopBar() {
  return (
    <div className="bg-brand-primary-900 text-brand-primary-100 text-xs">
      <p className="max-w-site mx-auto px-4 h-8 flex items-center justify-center gap-2 truncate whitespace-nowrap tracking-wide">
        {TOP_BAR_ITEMS.join(' · ')}
      </p>
    </div>
  )
}

function Footer() {
  return (
    <footer className="bg-brand-primary-900 text-brand-primary-200">
      <div className="max-w-site mx-auto px-4 sm:px-8 py-14 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-10 pb-28 sm:pb-14">
        {/* Marca */}
        <div className="col-span-2 sm:col-span-1">
          <Link to="/" className="flex items-center gap-2.5 mb-3">
            <img src="/logo.jpg" alt={TIENDA_NOMBRE} className="w-11 h-11 object-cover rounded-full shadow-soft border-2 border-brand-primary-700" />
            <span className="font-display text-lg font-semibold text-white leading-tight">{TIENDA_NOMBRE}</span>
          </Link>
          <p className="text-sm text-brand-primary-300 leading-relaxed">Sahumerios artesanales para tu hogar y bienestar.</p>

          {(INSTAGRAM_URL || WHATSAPP_NUMBER !== '549XXXXXXXXXX') && (
            <div className="flex items-center gap-4 text-sm mt-4">
              {INSTAGRAM_URL && (
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
                  aria-label="Instagram" className="hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              )}
              {WHATSAPP_NUMBER !== '549XXXXXXXXXX' && (
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
                  aria-label="WhatsApp" className="hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Comprar */}
        <div>
          <p className="font-display text-base font-semibold text-white mb-3">Comprar</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white transition-colors">Productos</Link></li>
          </ul>
        </div>

        {/* Ayuda */}
        <div>
          <p className="font-display text-base font-semibold text-white mb-3">Ayuda</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/como-comprar" className="hover:text-white transition-colors">Cómo comprar</Link></li>
            <li><Link to="/preguntas-frecuentes" className="hover:text-white transition-colors">Preguntas frecuentes</Link></li>
            <li><Link to="/contacto" className="hover:text-white transition-colors">Contacto</Link></li>
          </ul>
        </div>

        {/* Información */}
        <div>
          <p className="font-display text-base font-semibold text-white mb-3">Información</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/sobre-nosotros" className="hover:text-white transition-colors">Sobre nosotros</Link></li>
            <li><Link to="/envios" className="hover:text-white transition-colors">Envíos y pagos</Link></li>
            <li><Link to="/terminos" className="hover:text-white transition-colors">Términos y condiciones</Link></li>
            <li><Link to="/privacidad" className="hover:text-white transition-colors">Política de privacidad</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-brand-primary-800">
        <p className="max-w-site mx-auto px-4 py-4 text-xs text-brand-primary-400 text-center">
          © {new Date().getFullYear()} {TIENDA_NOMBRE} · Hecho con amor en Argentina
        </p>
      </div>
    </footer>
  )
}

export default function Layout({ children }) {
  const { totalItems, setAbierto } = useCarrito()
  const { usuario, logout }        = useUsuario()
  const [menuAbierto, setMenuAbierto]     = useState(false)
  const [userMenuAbierto, setUserMenu]    = useState(false)
  const [buscadorAbierto, setBuscadorAbierto] = useState(false)
  const [busqueda, setBusqueda]           = useState('')
  const [scrolled, setScrolled]           = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const menuRef = useRef(null)

  const isHome = location.pathname === '/'
  // En el inicio el header se integra con el hero (fondo oscuro) hasta que
  // el usuario hace scroll; en el resto de las páginas siempre es sólido.
  // Con el menú móvil abierto forzamos el estado sólido: es más simple y
  // predecible que mantener la superposición transparente con contenido
  // encima (el dropdown necesita una superficie sólida para leerse bien).
  const headerTransparente = isHome && !scrolled && !menuAbierto

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cierra menú/buscador al cambiar de ruta.
  useEffect(() => {
    setMenuAbierto(false)
    setBuscadorAbierto(false)
  }, [location.pathname])

  // Menú móvil: Escape para cerrar, scroll bloqueado, foco al primer enlace.
  useEffect(() => {
    if (!menuAbierto) return undefined
    document.body.style.overflow = 'hidden'
    const onKeyDown = e => {
      if (e.key === 'Escape') { setMenuAbierto(false); return }
      if (e.key !== 'Tab' || !menuRef.current) return
      const focusables = menuRef.current.querySelectorAll('a, button')
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    menuRef.current?.querySelector('a, button')?.focus()
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuAbierto])

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  const navLinkClass = (to) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-250 ${
      isActive(to)
        ? headerTransparente ? 'bg-white/15 text-white' : 'bg-brand-primary-100 text-brand-primary-700'
        : headerTransparente
          ? 'text-white/85 hover:bg-white/10 hover:text-white'
          : 'text-text-secondary hover:bg-background-secondary hover:text-brand-primary-700'
    }`

  const mobileNavLinkClass = (to) =>
    `block py-3 px-3 rounded-xl text-sm font-medium transition-colors ${
      isActive(to)
        ? 'bg-brand-primary-100 text-brand-primary-700'
        : 'text-text-primary hover:bg-background-secondary'
    }`

  const iconBtnClass = headerTransparente
    ? 'p-2 rounded-full hover:bg-white/10 transition-colors text-white'
    : 'p-2 rounded-full hover:bg-background-secondary transition-colors text-text-primary'

  const buscar = (e) => {
    e.preventDefault()
    const q = busqueda.trim()
    navigate(q ? `/?search=${encodeURIComponent(q)}` : '/')
    setBuscadorAbierto(false)
    setBusqueda('')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      {/* Header — en el inicio se superpone al hero de verdad (margen negativo
          que "jala" a <main> por debajo del propio header) en vez de solo
          quedar transparente en su lugar del flujo normal, que dejaría ver
          el fondo de la página y no el hero. */}
      <header
        className={`sticky top-0 z-30 transition-colors duration-250 ${headerTransparente ? '-mb-16' : ''} ${
          headerTransparente
            ? 'bg-transparent'
            : 'bg-surface-elevated/95 backdrop-blur-md border-b border-border-soft shadow-soft'
        }`}
      >
        <div className="max-w-site mx-auto px-4 sm:px-8 h-16 flex items-center gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <img
              src="/logo.jpg"
              alt={TIENDA_NOMBRE}
              className="w-11 h-11 object-cover rounded-full flex-shrink-0 group-hover:scale-105 transition-transform duration-250 shadow-soft"
            />
            <div className="hidden xs:flex flex-col leading-none">
              <span className={`font-display text-base font-semibold leading-none ${headerTransparente ? 'text-white' : 'text-text-primary'}`}>
                Esencias
              </span>
              <span className={`text-[10px] tracking-widest uppercase mt-0.5 ${headerTransparente ? 'text-white/70' : 'text-text-secondary'}`}>
                de la naturaleza
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 ml-4" aria-label="Navegación principal">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className={navLinkClass(to)} aria-current={isActive(to) ? 'page' : undefined}>{label}</Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Buscador */}
            <div className="relative">
              <button
                onClick={() => setBuscadorAbierto(v => !v)}
                className={iconBtnClass}
                aria-label="Buscar productos"
                aria-expanded={buscadorAbierto}
              >
                <svg viewBox="0 0 20 20" className="w-5 h-5 fill-current" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                </svg>
              </button>
              {buscadorAbierto && (
                <form
                  onSubmit={buscar}
                  className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-surface-elevated rounded-xl shadow-elevated border border-border-soft p-2 flex items-center gap-1.5 z-50"
                  role="search"
                >
                  <input
                    autoFocus
                    type="search"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar productos..."
                    aria-label="Buscar productos"
                    className="flex-1 min-w-0 px-2.5 py-2 text-sm rounded-lg border border-border-soft focus:outline-none focus:ring-2 focus:ring-brand-primary-400"
                  />
                  <button type="submit" className="p-2 rounded-lg bg-brand-primary-600 hover:bg-brand-primary-700 text-white transition-colors" aria-label="Buscar">
                    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                    </svg>
                  </button>
                </form>
              )}
            </div>

            {INSTAGRAM_URL && (
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className={`hidden sm:inline-flex ${iconBtnClass}`}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ fill: 'url(#ig-grad-header)' }}>
                  <defs>
                    <linearGradient id="ig-grad-header" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%"   stopColor="#f09433" />
                      <stop offset="25%"  stopColor="#e6683c" />
                      <stop offset="50%"  stopColor="#dc2743" />
                      <stop offset="75%"  stopColor="#cc2366" />
                      <stop offset="100%" stopColor="#bc1888" />
                    </linearGradient>
                  </defs>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}

            {/* Cuenta de usuario */}
            {usuario ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenu(v => !v)}
                  className={`hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-colors ${headerTransparente ? 'hover:bg-white/10 text-white' : 'hover:bg-background-secondary text-text-primary'}`}
                  aria-label="Mi cuenta"
                  aria-expanded={userMenuAbierto}
                >
                  <div className="w-7 h-7 rounded-full bg-brand-primary-200 flex items-center justify-center text-xs font-bold text-brand-primary-800">
                    {usuario.nombre?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm font-medium max-w-[80px] truncate">{usuario.nombre}</span>
                </button>
                {userMenuAbierto && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-surface-elevated rounded-xl shadow-elevated border border-border-soft py-1 z-50">
                    <p className="px-3 py-2 text-xs text-text-secondary border-b border-border-soft truncate">{usuario.email}</p>
                    <button
                      onClick={() => { logout(); setUserMenu(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error-bg rounded-b-xl transition-colors"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/ingresar"
                className={`hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${headerTransparente ? 'text-white hover:bg-white/10' : 'text-text-primary hover:bg-background-secondary'}`}
              >
                <img src="/iconos/svg/09_usuario.svg" alt="" className="w-4 h-4" />
                Ingresar
              </Link>
            )}

            <button
              onClick={() => setAbierto(true)}
              className={`relative ${iconBtnClass}`}
              aria-label={`Carrito (${totalItems} producto${totalItems !== 1 ? 's' : ''})`}
            >
              <img src="/iconos/svg/07_carrito.svg" alt="" className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Hamburger — mobile/tablet only */}
            <button
              onClick={() => setMenuAbierto(v => !v)}
              className={`lg:hidden ${iconBtnClass}`}
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuAbierto}
            >
              {menuAbierto ? (
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="6" y1="6" x2="18" y2="18"/>
                  <line x1="18" y1="6" x2="6" y2="18"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="6"  x2="20" y2="6"/>
                  <line x1="4" y1="12" x2="20" y2="12"/>
                  <line x1="4" y1="18" x2="20" y2="18"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {menuAbierto && (
          <nav
            ref={menuRef}
            className="lg:hidden border-t border-border-soft bg-surface-elevated px-4 py-3 flex flex-col gap-1 shadow-elevated"
            aria-label="Menú móvil"
          >
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className={mobileNavLinkClass(to)}>
                {label}
              </Link>
            ))}
            {usuario ? (
              <button
                onClick={() => { logout(); setMenuAbierto(false) }}
                className="block w-full text-left py-3 px-3 rounded-xl text-sm font-medium text-error hover:bg-error-bg transition-colors"
              >
                Cerrar sesión ({usuario.nombre})
              </button>
            ) : (
              <Link to="/ingresar" className="block py-3 px-3 rounded-xl text-sm font-medium text-text-primary hover:bg-background-secondary transition-colors">
                Iniciar sesión
              </Link>
            )}
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      <Footer />

      {/* Overlays y componentes fijos */}
      <BotonesFlotantes />
      <Carrito />
      <BarraCarrito />
    </div>
  )
}
