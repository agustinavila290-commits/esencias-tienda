import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { INSTAGRAM_URL, WHATSAPP_NUMBER } from '../config'
import { useCarrito } from '../context/CarritoContext'
import { useUsuario } from '../context/UsuarioContext'
import Carrito from './Carrito'
import BarraCarrito from './BarraCarrito'
import BotonesFlotantes from './BotonesFlotantes'

const NAV_LINKS = [
  { to: '/',              label: 'Catálogo'  },
  { to: '/sobre-nosotros', label: 'Nosotros'  },
  { to: '/envios',         label: 'Envíos'    },
  { to: '/contacto',       label: 'Contacto'  },
]

function Footer() {
  return (
    <footer className="bg-tierra-900 text-tierra-300 pt-12 pb-28 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <img src="/logo.jpg" alt="Logo" className="w-20 h-20 object-cover rounded-full mx-auto mb-3 shadow-lg border-2 border-tierra-700" />
        <p className="font-display text-2xl font-bold text-white mb-1">Esencias de la naturaleza</p>
        <p className="text-tierra-400 text-sm mb-6">Sahumerios artesanales para tu hogar y bienestar</p>

        {(INSTAGRAM_URL || WHATSAPP_NUMBER !== '549XXXXXXXXXX') && (
          <div className="flex items-center justify-center gap-6 text-sm mb-8 border-t border-tierra-800 pt-6">
            {INSTAGRAM_URL && (
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                Instagram
              </a>
            )}
            {WHATSAPP_NUMBER !== '549XXXXXXXXXX' && (
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-tierra-500 mb-4">
          <Link to="/sobre-nosotros" className="hover:text-tierra-300 transition-colors">Sobre nosotros</Link>
          <Link to="/como-comprar"   className="hover:text-tierra-300 transition-colors">Cómo comprar</Link>
          <Link to="/envios"         className="hover:text-tierra-300 transition-colors">Envíos y pagos</Link>
          <Link to="/preguntas-frecuentes" className="hover:text-tierra-300 transition-colors">Preguntas frecuentes</Link>
          <Link to="/contacto"       className="hover:text-tierra-300 transition-colors">Contacto</Link>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-tierra-600 mb-4">
          <Link to="/terminos"   className="hover:text-tierra-400 transition-colors">Términos y condiciones</Link>
          <Link to="/privacidad" className="hover:text-tierra-400 transition-colors">Política de privacidad</Link>
        </div>
        <p className="text-tierra-600 text-xs">© {new Date().getFullYear()} Esencias de la naturaleza · Hecho con amor en Argentina</p>
      </div>
    </footer>
  )
}

export default function Layout({ children }) {
  const { totalItems, setAbierto } = useCarrito()
  const { usuario, logout }        = useUsuario()
  const [menuAbierto, setMenuAbierto]   = useState(false)
  const [userMenuAbierto, setUserMenu]  = useState(false)
  const location = useLocation()

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  const navLinkClass = (to) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive(to)
        ? 'bg-tierra-100 text-tierra-700'
        : 'text-gray-600 hover:bg-tierra-50 hover:text-tierra-700'
    }`

  const mobileNavLinkClass = (to) =>
    `block py-3 px-3 rounded-xl text-sm font-medium transition-colors ${
      isActive(to)
        ? 'bg-tierra-100 text-tierra-700'
        : 'text-gray-700 hover:bg-tierra-50 hover:text-tierra-700'
    }`

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/96 backdrop-blur-md border-b border-tierra-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <img
              src="/logo.jpg"
              alt="Esencias de la naturaleza"
              className="w-11 h-11 object-cover rounded-full flex-shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-sm"
            />
            <div className="hidden xs:flex flex-col leading-none">
              <span className="font-display text-base font-bold text-tierra-800 leading-none">Esencias</span>
              <span className="text-[10px] text-tierra-500 tracking-widest uppercase mt-0.5">de la naturaleza</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-0.5 flex-1" aria-label="Navegación principal">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className={navLinkClass(to)}>{label}</Link>
            ))}
          </nav>

          {/* Right side: Instagram + User + Cart + Hamburger */}
          <div className="flex items-center gap-1 ml-auto">
            {INSTAGRAM_URL && (
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="p-2 rounded-full hover:bg-tierra-50 transition-colors"
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
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-tierra-50 transition-colors text-tierra-700"
                  aria-label="Mi cuenta"
                >
                  <div className="w-7 h-7 rounded-full bg-tierra-200 flex items-center justify-center text-xs font-bold text-tierra-800">
                    {usuario.nombre?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium max-w-[80px] truncate">{usuario.nombre}</span>
                </button>
                {userMenuAbierto && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-tierra-100 py-1 z-50">
                    <p className="px-3 py-2 text-xs text-tierra-500 border-b border-tierra-50 truncate">{usuario.email}</p>
                    <button
                      onClick={() => { logout(); setUserMenu(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl transition-colors"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/ingresar"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium text-tierra-700 hover:bg-tierra-50 transition-colors"
              >
                <img src="/iconos/svg/09_usuario.svg" alt="" className="w-4 h-4" />
                Ingresar
              </Link>
            )}

            <button
              onClick={() => setAbierto(true)}
              className="relative p-2 rounded-full hover:bg-tierra-50 transition-colors"
              aria-label={`Carrito (${totalItems} producto${totalItems !== 1 ? 's' : ''})`}
            >
              <img src="/iconos/svg/07_carrito.svg" alt="" className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-tierra-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuAbierto(v => !v)}
              className="sm:hidden p-2 rounded-full hover:bg-tierra-50 transition-colors text-tierra-700"
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

        {/* Mobile dropdown menu */}
        {menuAbierto && (
          <nav
            className="sm:hidden border-t border-tierra-100 bg-white px-4 py-3 flex flex-col gap-1"
            aria-label="Menú móvil"
          >
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuAbierto(false)}
                className={mobileNavLinkClass(to)}
              >
                {label}
              </Link>
            ))}
            {usuario ? (
              <button
                onClick={() => { logout(); setMenuAbierto(false) }}
                className="block w-full text-left py-3 px-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Cerrar sesión ({usuario.nombre})
              </button>
            ) : (
              <Link
                to="/ingresar"
                onClick={() => setMenuAbierto(false)}
                className="block py-3 px-3 rounded-xl text-sm font-medium text-tierra-700 hover:bg-tierra-50 transition-colors"
              >
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
