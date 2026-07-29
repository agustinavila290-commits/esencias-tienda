import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TIENDA_NOMBRE } from '../config'
import Seo from '../components/Seo'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await login(form.username, form.password)
      navigate('/admin')
    } catch {
      setError('Usuario o contraseña incorrectos.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-primary-50 flex items-center justify-center px-4">
      <Seo title="Ingresar" path="/login" noindex />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🌿</span>
          <h1 className="font-sans text-2xl font-bold text-brand-primary-800 mt-3">{TIENDA_NOMBRE}</h1>
          <p className="text-text-secondary text-sm mt-1">Panel de administración</p>
        </div>

        <div className="card p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Usuario</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="input-field"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input-field"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-error text-sm bg-error-bg p-3 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={cargando} className="btn-primary w-full">
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
