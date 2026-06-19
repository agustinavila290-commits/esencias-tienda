import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { usuariosService } from '../services/api'
import { useToast } from '../context/ToastContext'

export function RecuperarPassword() {
  const [email,    setEmail]    = useState('')
  const [enviado,  setEnviado]  = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => { document.title = 'Recuperar contraseña — Esencias de la naturaleza' }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await usuariosService.recuperarPassword(email)
      setEnviado(true)
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-xl font-bold text-amber-900 mb-2">Revisá tu email</h1>
          <p className="text-amber-700 text-sm mb-6">
            Si el email <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
          </p>
          <Link to="/ingresar" className="text-amber-600 underline text-sm hover:text-amber-800">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-amber-900 text-center mb-2">Recuperar contraseña</h1>
        <p className="text-amber-700 text-sm text-center mb-6">
          Ingresá tu email y te enviamos un enlace para crear una nueva contraseña.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="tu@email.com"
            />
          </div>
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {cargando ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <p className="text-center text-xs text-amber-400 mt-6">
          <Link to="/ingresar" className="hover:underline">← Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  )
}

export function RecuperarPasswordConfirmar() {
  const { uid, token } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [form, setForm]       = useState({ nueva_password: '', confirmar: '' })
  const [error, setError]     = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => { document.title = 'Nueva contraseña — Esencias de la naturaleza' }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.nueva_password !== form.confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.nueva_password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setCargando(true)
    try {
      await usuariosService.confirmarPassword({ uid, token, nueva_password: form.nueva_password })
      toast({ message: 'Contraseña actualizada. Ya podés iniciar sesión.', type: 'success' })
      navigate('/ingresar', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'El enlace expiró o es inválido. Solicitá uno nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-amber-900 text-center mb-2">Nueva contraseña</h1>
        <p className="text-amber-700 text-sm text-center mb-6">Elegí una contraseña de al menos 8 caracteres.</p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {['nueva_password', 'confirmar'].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-amber-800 mb-1">
                {field === 'nueva_password' ? 'Nueva contraseña' : 'Repetir contraseña'}
              </label>
              <input
                type="password"
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                required
                className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {cargando ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
