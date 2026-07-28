import axios from 'axios'
import { API_URL } from '../config'
import { getAdminToken, setAdminToken } from './adminToken'

// withCredentials: necesario para que el navegador mande/reciba la cookie
// HttpOnly del refresh token del admin (con Path=/api/auth/, así que en la
// práctica solo viaja hacia esos endpoints puntuales, no en cada request).
const api = axios.create({ baseURL: API_URL, withCredentials: true })

api.interceptors.request.use(config => {
  const token = getAdminToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el access token venció (401), se intenta renovar una sola vez usando
// la cookie de refresh (silencioso, sin pedirle nada al usuario) y se
// reintenta la request original. Si el refresh también falla, recién ahí
// se cierra la sesión. Las llamadas a /auth/* quedan afuera para no entrar
// en loop contra sí mismas.
let refreshEnCurso = null

api.interceptors.response.use(
  r => r,
  async err => {
    const { config, response } = err
    const esLlamadaDeAuth = config?.url?.includes('/auth/')

    if (response?.status === 401 && config && !config._retry && !esLlamadaDeAuth) {
      config._retry = true
      try {
        if (!refreshEnCurso) {
          refreshEnCurso = api.post('/auth/refresh/').finally(() => { refreshEnCurso = null })
        }
        const r = await refreshEnCurso
        setAdminToken(r.data.access)
        config.headers.Authorization = `Bearer ${r.data.access}`
        return api(config)
      } catch {
        setAdminToken(null)
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export const productosService = {
  list: (params, config = {}) => api.get('/productos/', { params, ...config }),
  get:  (id)     => api.get(`/productos/${id}/`),
  getBySlug: (slug) => api.get(`/productos/slug/${slug}/`),
  adminList: ()  => api.get('/admin/productos/'),
  create: (data) => api.post('/admin/productos/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.patch(`/admin/productos/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id)   => api.delete(`/admin/productos/${id}/`),
}

export const categoriasService = {
  list: ()           => api.get('/categorias/'),
  adminList: ()      => api.get('/admin/categorias/'),
  create: (data)     => api.post('/admin/categorias/', data),
  update: (id, data) => api.patch(`/admin/categorias/${id}/`, data),
  delete: (id)       => api.delete(`/admin/categorias/${id}/`),
}

export const pedidosService = {
  crear:            (data)        => api.post('/pedidos/crear/', data),
  crearPreferencia: (id)          => api.post(`/pedidos/${id}/crear-preferencia/`),
  seguimiento:      (codigo, token) => api.get(`/pedidos/${codigo}/seguimiento/`, { params: { token } }),
  adminList:        (params)      => api.get('/admin/pedidos/', { params }),
  confirmar:        (id)          => api.post(`/admin/pedidos/${id}/confirmar/`),
  cancelar:         (id)          => api.post(`/admin/pedidos/${id}/cancelar/`),
  marcarEnviado:    (id, nota='') => api.post(`/admin/pedidos/${id}/enviado/`,   { nota }),
  marcarEntregado:  (id, nota='') => api.post(`/admin/pedidos/${id}/entregado/`, { nota }),
}

export const authService = {
  login:   (creds) => api.post('/auth/login/', creds),
  refresh: ()       => api.post('/auth/refresh/'),
  logout:  ()       => api.post('/auth/logout/'),
  me:      ()      => api.get('/auth/me/'),
}

// ── Instancia separada para usuarios públicos (usa usuario_token) ──────────

const apiUsuario = axios.create({ baseURL: API_URL })

apiUsuario.interceptors.request.use(config => {
  const token = localStorage.getItem('usuario_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiUsuario.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('usuario_token')
      localStorage.removeItem('usuario_refresh')
    }
    return Promise.reject(err)
  }
)

export const usuariosService = {
  registro:         (datos)      => apiUsuario.post('/usuarios/registro/', datos),
  login:            (datos)      => apiUsuario.post('/usuarios/login/', datos),
  loginGoogle:      (credential) => apiUsuario.post('/usuarios/google/', { credential }),
  logout:           (datos)      => apiUsuario.post('/usuarios/logout/', datos),
  me:               ()           => apiUsuario.get('/usuarios/me/'),
  recuperarPassword:  (email)    => apiUsuario.post('/usuarios/recuperar-password/', { email }),
  confirmarPassword:  (datos)    => apiUsuario.post('/usuarios/recuperar-password/confirmar/', datos),
}

export default api
