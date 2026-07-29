import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

const ICONS = {
  success: (
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current flex-shrink-0">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current flex-shrink-0">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current flex-shrink-0">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current flex-shrink-0">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
    </svg>
  ),
}

const STYLES = {
  success: 'bg-brand-primary-700 text-white',
  error:   'bg-error text-white',
  warning: 'bg-warning text-white',
  info:    'bg-text-primary text-white',
}

function Toast({ t, onDismiss, onPause, onResume }) {
  return (
    <div
      role="status"
      onMouseEnter={() => onPause(t.id)}
      onMouseLeave={() => onResume(t.id)}
      onFocus={() => onPause(t.id)}
      onBlur={() => onResume(t.id)}
      className={`animate-fade-in-up pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium select-none ${STYLES[t.type] || STYLES.info}`}
    >
      {ICONS[t.type] || ICONS.info}
      <span className="flex-1">{t.message}</span>
      {t.action && (
        <button
          onClick={() => { t.action.onClick(); onDismiss(t.id) }}
          className="font-bold underline underline-offset-2 decoration-white/50 hover:decoration-white flex-shrink-0"
        >
          {t.action.label}
        </button>
      )}
      <button onClick={() => onDismiss(t.id)} aria-label="Cerrar notificación" className="flex-shrink-0 opacity-70 hover:opacity-100 p-0.5">
        <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
          <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
        </svg>
      </button>
    </div>
  )
}

function ToastContainer({ toasts, onDismiss, onPause, onResume }) {
  if (toasts.length === 0) return null
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none"
    >
      {toasts.map(t => (
        <Toast key={t.id} t={t} onDismiss={onDismiss} onPause={onPause} onResume={onResume} />
      ))}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({}) // { [id]: { restante, inicio, handle } }

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]?.handle)
    delete timers.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const iniciarTimer = useCallback((id, ms) => {
    const handle = setTimeout(() => dismiss(id), ms)
    timers.current[id] = { restante: ms, inicio: Date.now(), handle }
  }, [dismiss])

  const toast = useCallback(({ message, type = 'success', duration = 3000, action = null }) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, action }])
    iniciarTimer(id, duration)
  }, [iniciarTimer])

  // Al recibir hover/foco se pausa el auto-cierre; al salir, se retoma con
  // el tiempo restante (no se reinicia el conteo completo).
  const pause = useCallback((id) => {
    const t = timers.current[id]
    if (!t) return
    clearTimeout(t.handle)
    t.restante -= Date.now() - t.inicio
  }, [])

  const resume = useCallback((id) => {
    const t = timers.current[id]
    if (!t) return
    t.inicio = Date.now()
    t.handle = setTimeout(() => dismiss(id), Math.max(t.restante, 300))
  }, [dismiss])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} onPause={pause} onResume={resume} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
