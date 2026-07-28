import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { authService } from '../services/api'
import { setAdminToken } from '../services/adminToken'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // El refresh token rota en cada uso (y el viejo queda blacklisteado), así
  // que esta llamada NO es segura de disparar dos veces en paralelo — cosa
  // que React.StrictMode hace a propósito en desarrollo (monta el efecto dos
  // veces) para detectar justamente este tipo de efectos no idempotentes.
  // El ref evita que la segunda invocación reintente con un token ya usado.
  const refrescoIniciado = useRef(false)

  useEffect(() => {
    if (refrescoIniciado.current) return
    refrescoIniciado.current = true

    // No hay token en localStorage para leer: el access vive solo en memoria
    // y se perdió al recargar la página. Lo único persistente es la cookie
    // HttpOnly de refresh, así que intentamos renovar en silencio; si no hay
    // cookie válida, simplemente no hay sesión (comportamiento normal, no un error).
    authService.refresh()
      .then(r => {
        setAdminToken(r.data.access)
        return authService.me()
      })
      .then(me => setUser(me.data))
      .catch(() => setAdminToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    const r = await authService.login({ username, password })
    setAdminToken(r.data.access)
    const me = await authService.me()
    setUser(me.data)
    return me.data
  }

  const logout = () => {
    authService.logout().catch(() => {})
    setAdminToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
