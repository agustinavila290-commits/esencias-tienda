import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUsuario } from '../context/UsuarioContext'
import { useToast } from '../context/ToastContext'
import GoogleLoginButton from '../components/GoogleLoginButton'

export default function Registro() {
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '', password_confirmar: '',
  })
  const [error,    setError]    = useState('')
  const [cargando, setCargando] = useState(false)

  const { registro, loginGoogle, estaLogueado } = useUsuario()
  const { toast } = useToast()
  const navigate  = useNavigate()

  useEffect(() => {
    document.title = 'Crear cuenta — Esencias de la naturaleza'
  }, [])

  useEffect(() => {
    if (estaLogueado) navigate('/', { replace: true })
  }, [estaLogueado])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.password_confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setCargando(true)
    try {
      await registro(form)
      toast({ message: '¡Cuenta creada! Bienvenido/a 🌿', type: 'success' })
      navigate('/', { replace: true })
    } catch (err) {
      const data = err.response?.data
      if (data?.email)              setError(data.email[0])
      else if (data?.password)      setError(data.password[0])
      else if (data?.non_field_errors) setError(data.non_field_errors[0])
      else if (data?.error)         setError(data.error)
      else                          setError('No se pudo crear la cuenta. Intentá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const handleGoogle = async (credential) => {
    setError('')
    try {
      await loginGoogle(credential)
      toast({ message: '¡Cuenta creada! Bienvenido/a 🌿', type: 'success' })
      navigate('/', { replace: true })
    } catch {
      setError('No se pudo registrar con Google. Intentá de nuevo.')
    }
  }

  const input = (field, type, placeholder, autoComplete) => (
    <input
      type={type}
      value={form[field]}
      onChange={set(field)}
      required
      autoComplete={autoComplete}
      placeholder={placeholder}
      className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
    />
  )

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        <div className="text-center mb-6">
          <Link to="/">
            <img src="/logo.jpg" alt="Logo" className="w-16 h-16 rounded-full object-cover mx-auto mb-3 shadow" />
          </Link>
          <h1 className="text-2xl font-bold text-amber-900">Crear cuenta</h1>
          <p className="text-amber-700 text-sm mt-1">
            ¿Ya tenés cuenta?{' '}
            <Link to="/ingresar" className="underline font-medium hover:text-amber-900">Iniciá sesión</Link>
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">Nombre</label>
              {input('nombre', 'text', 'María', 'given-name')}
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">Apellido</label>
              {input('apellido', 'text', 'García', 'family-name')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">Email</label>
            {input('email', 'email', 'tu@email.com', 'email')}
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">Contraseña</label>
            {input('password', 'password', 'Mínimo 8 caracteres', 'new-password')}
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">Repetir contraseña</label>
            {input('password_confirmar', 'password', 'Repetí tu contraseña', 'new-password')}
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 mt-2"
          >
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-amber-100" />
          </div>
          <div className="relative flex justify-center text-xs text-amber-500 uppercase">
            <span className="bg-white px-3">o registrate con</span>
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
