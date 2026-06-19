import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CarritoProvider } from './context/CarritoContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import Catalogo from './pages/Catalogo'
import Producto from './pages/Producto'
import Login from './pages/Login'
import Admin from './pages/Admin'
import SobreNosotros from './pages/SobreNosotros'
import Envios from './pages/Envios'
import Contacto from './pages/Contacto'
import PagoExitoso from './pages/PagoExitoso'
import PagoCancelado from './pages/PagoCancelado'
import PagoPendiente from './pages/PagoPendiente'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CarritoProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Layout><Catalogo /></Layout>} />
              <Route path="/producto/:id" element={<Layout><Producto /></Layout>} />
              <Route path="/sobre-nosotros" element={<Layout><SobreNosotros /></Layout>} />
              <Route path="/envios" element={<Layout><Envios /></Layout>} />
              <Route path="/contacto" element={<Layout><Contacto /></Layout>} />
              <Route path="/pago-exitoso"   element={<PagoExitoso />} />
              <Route path="/pago-cancelado" element={<PagoCancelado />} />
              <Route path="/pago-pendiente" element={<PagoPendiente />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </CarritoProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
