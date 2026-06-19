import axios from 'axios'
import { API_URL } from '../config'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token')
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export const productosService = {
  list: ()       => api.get('/productos/'),
  get:  (id)     => api.get(`/productos/${id}/`),
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
  adminList:        (params)      => api.get('/admin/pedidos/', { params }),
  confirmar:        (id)          => api.post(`/admin/pedidos/${id}/confirmar/`),
  cancelar:         (id)          => api.post(`/admin/pedidos/${id}/cancelar/`),
  marcarEnviado:    (id, nota='') => api.post(`/admin/pedidos/${id}/enviado/`,   { nota }),
  marcarEntregado:  (id, nota='') => api.post(`/admin/pedidos/${id}/entregado/`, { nota }),
}

export const authService = {
  login:   (creds) => api.post('/auth/login/', creds),
  refresh: (token) => api.post('/auth/refresh/', { refresh: token }),
  me:      ()      => api.get('/auth/me/'),
}

export default api
