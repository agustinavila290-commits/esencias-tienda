import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) { setLoading(false); return }
    authService.me()
      .then(r => setUser(r.data))
      .catch(() => localStorage.removeItem('admin_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    const r = await authService.login({ username, password })
    localStorage.setItem('admin_token', r.data.access)
    localStorage.setItem('admin_refresh', r.data.refresh)
    const me = await authService.me()
    setUser(me.data)
    return me.data
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh')
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
