import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { CarritoProvider }  from './context/CarritoContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { UsuarioProvider } from './context/UsuarioContext'
import { ToastProvider }   from './context/ToastContext'
import Layout        from './components/Layout'
import Catalogo      from './pages/Catalogo'
import Producto      from './pages/Producto'
import ProductoDetalle from './pages/ProductoDetalle'
import CategoriaPagina from './pages/CategoriaPagina'
import PedidoSeguimiento from './pages/PedidoSeguimiento'
import Login         from './pages/Login'
import SobreNosotros from './pages/SobreNosotros'
import Envios        from './pages/Envios'
import Contacto      from './pages/Contacto'
import PreguntasFrecuentes from './pages/PreguntasFrecuentes'
import ComoComprar   from './pages/ComoComprar'
import Terminos      from './pages/Terminos'
import Privacidad    from './pages/Privacidad'
import PagoExitoso   from './pages/PagoExitoso'
import PagoCancelado from './pages/PagoCancelado'
import PagoPendiente from './pages/PagoPendiente'
import LoginUsuario  from './pages/LoginUsuario'
import Registro      from './pages/Registro'
import { RecuperarPassword, RecuperarPasswordConfirmar } from './pages/RecuperarPassword'

// El panel admin es pesado (CRUD + modales) y solo lo usa el staff — se separa
// en su propio chunk para no engordar el bundle público del catálogo.
const Admin = lazy(() => import('./pages/Admin'))

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  // Mientras se verifica la sesión (ej. el refresh silencioso vía la cookie
  // HttpOnly al recargar la página) no hay que redirigir todavía — antes se
  // mandaba a /login de entrada aunque la cookie fuera válida, porque el
  // chequeo async ni siquiera había terminado.
  if (loading) return <CargandoAdmin />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function CargandoAdmin() {
  return <div className="min-h-screen flex items-center justify-center text-brand-primary-400">Cargando panel...</div>
}

export default function App() {
  return (
    <HelmetProvider>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <UsuarioProvider>
            <CarritoProvider>
              <ToastProvider>
                <Routes>
                  {/* Admin (panel interno) */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <Suspense fallback={<CargandoAdmin />}>
                        <Admin />
                      </Suspense>
                    </ProtectedRoute>
                  } />

                  {/* Auth pública */}
                  <Route path="/ingresar"            element={<LoginUsuario />} />
                  <Route path="/registro"            element={<Registro />} />
                  <Route path="/recuperar-password"  element={<RecuperarPassword />} />
                  <Route path="/recuperar-password/:uid/:token" element={<RecuperarPasswordConfirmar />} />

                  {/* Tienda pública */}
                  <Route path="/"              element={<Layout><Catalogo /></Layout>} />
                  {/* URL canónica nueva por slug (ej. /productos/sahumerio-palo-santo) */}
                  <Route path="/productos/:slug" element={<Layout><ProductoDetalle /></Layout>} />
                  {/* Legado por id — se mantiene para no romper enlaces existentes */}
                  <Route path="/producto/:id"  element={<Layout><Producto /></Layout>} />
                  <Route path="/categoria/:slug" element={<Layout><CategoriaPagina /></Layout>} />
                  <Route path="/pedido/:codigo" element={<Layout><PedidoSeguimiento /></Layout>} />
                  <Route path="/sobre-nosotros" element={<Layout><SobreNosotros /></Layout>} />
                  <Route path="/envios"         element={<Layout><Envios /></Layout>} />
                  <Route path="/contacto"       element={<Layout><Contacto /></Layout>} />
                  <Route path="/preguntas-frecuentes" element={<Layout><PreguntasFrecuentes /></Layout>} />
                  <Route path="/como-comprar"   element={<Layout><ComoComprar /></Layout>} />
                  <Route path="/terminos"       element={<Layout><Terminos /></Layout>} />
                  <Route path="/privacidad"     element={<Layout><Privacidad /></Layout>} />
                  <Route path="/pago-exitoso"   element={<PagoExitoso />} />
                  <Route path="/pago-cancelado" element={<PagoCancelado />} />
                  <Route path="/pago-pendiente" element={<PagoPendiente />} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ToastProvider>
            </CarritoProvider>
          </UsuarioProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
    </HelmetProvider>
  )
}
