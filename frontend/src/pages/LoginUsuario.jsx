import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useUsuario } from '../context/UsuarioContext'
import { useToast } from '../context/ToastContext'
import GoogleLoginButton from '../components/GoogleLoginButton'

export default function LoginUsuario() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [cargando, setCargando] = useState(false)

  const { login, loginGoogle, estaLogueado } = useUsuario()
  const { toast } = useToast()
  const navigate  = useNavigate()
  const location  = useLocation()
  const destino   = location.state?.from || '/'

  useEffect(() => {
    document.title = 'Iniciar sesión — Esencias de la naturaleza'
  }, [])

  useEffect(() => {
    if (estaLogueado) navigate(destino, { replace: true })
  }, [estaLogueado])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await login(email, password)
      toast({ message: '¡Bienvenido de nuevo!', type: 'success' })
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Email o contraseña incorrectos.')
    } finally {
      setCargando(false)
    }
  }

  const handleGoogle = async (credential) => {
    setError('')
    try {
      await loginGoogle(credential)
      toast({ message: '¡Bienvenido!', type: 'success' })
      navigate(destino, { replace: true })
    } catch {
      setError('No se pudo iniciar sesión con Google. Intentá de nuevo.')
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        <div className="text-center mb-6">
          <Link to="/">
            <img src="/logo.jpg" alt="Logo" className="w-16 h-16 rounded-full object-cover mx-auto mb-3 shadow" />
          </Link>
          <h1 className="text-2xl font-bold text-amber-900">Iniciar sesión</h1>
          <p className="text-amber-700 text-sm mt-1">
            ¿No tenés cuenta?{' '}
            <Link to="/registro" className="underline font-medium hover:text-amber-900">
              Registrate gratis
            </Link>
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
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

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-amber-800">Contraseña</label>
              <Link to="/recuperar-password" className="text-xs text-amber-600 hover:underline">
                ¿Olvidaste la contraseña?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Tu contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 mt-2"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-amber-100" />
          </div>
          <div className="relative flex justify-center text-xs text-amber-500 uppercase">
            <span className="bg-white px-3">o continuá con</span>
          </div>
        </div>

        <GoogleLoginButton
          onSuccess={handleGoogle}
          onError={() => setError('No se pudo conectar con Google.')}
        />

        <p className="text-center text-xs text-amber-400 mt-6">
          <Link to="/" className="hover:underline">← Volver a la tienda</Link>
        </p>
      </div>
    </div>
  )
}
