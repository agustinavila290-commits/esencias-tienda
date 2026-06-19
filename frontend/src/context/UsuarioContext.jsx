import { createContext, useContext, useState, useEffect } from 'react'
import { usuariosService } from '../services/api'

const UsuarioContext = createContext(null)

export function UsuarioProvider({ children }) {
  const [usuario, setUsuario]   = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('usuario_token')
    if (!token) { setCargando(false); return }
    usuariosService.me()
      .then(r => setUsuario(r.data))
      .catch(() => {
        localStorage.removeItem('usuario_token')
        localStorage.removeItem('usuario_refresh')
      })
      .finally(() => setCargando(false))
  }, [])

  const _guardarTokens = (data) => {
    localStorage.setItem('usuario_token',   data.access)
    localStorage.setItem('usuario_refresh', data.refresh)
  }

  const login = async (email, password) => {
    const r = await usuariosService.login({ email, password })
    _guardarTokens(r.data)
    const me = await usuariosService.me()
    setUsuario(me.data)
    return me.data
  }

  const loginGoogle = async (credential) => {
    const r = await usuariosService.loginGoogle(credential)
    _guardarTokens(r.data)
    const me = await usuariosService.me()
    setUsuario(me.data)
    return me.data
  }

  const registro = async (datos) => {
    const r = await usuariosService.registro(datos)
    _guardarTokens(r.data)
    const me = await usuariosService.me()
    setUsuario(me.data)
    return me.data
  }

  const logout = async () => {
    const refresh = localStorage.getItem('usuario_refresh')
    if (refresh) {
      try { await usuariosService.logout({ refresh }) } catch {}
    }
    localStorage.removeItem('usuario_token')
    localStorage.removeItem('usuario_refresh')
    setUsuario(null)
  }

  return (
    <UsuarioContext.Provider value={{ usuario, cargando, estaLogueado: !!usuario, login, loginGoogle, registro, logout }}>
      {children}
    </UsuarioContext.Provider>
  )
}

export function useUsuario() {
  return useContext(UsuarioContext)
}
