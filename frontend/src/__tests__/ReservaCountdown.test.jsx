import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import ReservaCountdown from '../components/ReservaCountdown'

describe('ReservaCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('no muestra nada si el pedido no está pendiente', () => {
    const { container } = render(
      <ReservaCountdown expiresAt="2026-01-01T13:00:00Z" estado="confirmado" />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra el tiempo restante cuando está pendiente', () => {
    render(<ReservaCountdown expiresAt="2026-01-01T12:30:00Z" estado="pendiente" />)
    expect(screen.getByText(/30:00/)).toBeInTheDocument()
  })

  it('avisa cuando faltan pocos minutos', () => {
    render(<ReservaCountdown expiresAt="2026-01-01T12:03:00Z" estado="pendiente" />)
    expect(screen.getByText(/quedan pocos minutos/)).toBeInTheDocument()
  })

  it('muestra mensaje de vencida cuando expires_at ya pasó', () => {
    render(<ReservaCountdown expiresAt="2026-01-01T11:00:00Z" estado="pendiente" />)
    expect(screen.getByText(/venció/)).toBeInTheDocument()
  })

  it('llama a onExpirar una sola vez al llegar a cero', () => {
    const onExpirar = vi.fn()
    render(<ReservaCountdown expiresAt="2026-01-01T12:00:02Z" estado="pendiente" onExpirar={onExpirar} />)

    act(() => { vi.advanceTimersByTime(1000) })
    expect(onExpirar).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(2000) })
    expect(onExpirar).toHaveBeenCalledTimes(1)

    act(() => { vi.advanceTimersByTime(3000) })
    expect(onExpirar).toHaveBeenCalledTimes(1)
  })

  it('cuenta regresiva baja con el tiempo', () => {
    render(<ReservaCountdown expiresAt="2026-01-01T12:00:10Z" estado="pendiente" />)
    expect(screen.getByText(/0:10/)).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByText(/0:05/)).toBeInTheDocument()
  })
})
