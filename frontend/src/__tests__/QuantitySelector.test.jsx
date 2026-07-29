import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuantitySelector from '../components/QuantitySelector'

describe('QuantitySelector', () => {
  it('muestra la cantidad actual', () => {
    render(<QuantitySelector cantidad={2} max={5} nombreProducto="Rosa" onCambiar={() => {}} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('llama onCambiar con cantidad+1 al aumentar', async () => {
    const user = userEvent.setup()
    const onCambiar = vi.fn()
    render(<QuantitySelector cantidad={2} max={5} nombreProducto="Rosa" onCambiar={onCambiar} />)
    await user.click(screen.getByLabelText('Aumentar cantidad de Rosa'))
    expect(onCambiar).toHaveBeenCalledWith(3)
  })

  it('llama onCambiar con cantidad-1 al disminuir', async () => {
    const user = userEvent.setup()
    const onCambiar = vi.fn()
    render(<QuantitySelector cantidad={2} max={5} nombreProducto="Rosa" onCambiar={onCambiar} />)
    await user.click(screen.getByLabelText('Disminuir cantidad de Rosa'))
    expect(onCambiar).toHaveBeenCalledWith(1)
  })

  it('deshabilita disminuir en el mínimo (1)', () => {
    render(<QuantitySelector cantidad={1} max={5} nombreProducto="Rosa" onCambiar={() => {}} />)
    expect(screen.getByLabelText('Disminuir cantidad de Rosa')).toBeDisabled()
  })

  it('deshabilita aumentar al llegar al máximo', () => {
    render(<QuantitySelector cantidad={5} max={5} nombreProducto="Rosa" onCambiar={() => {}} />)
    expect(screen.getByLabelText('Aumentar cantidad de Rosa')).toBeDisabled()
  })
})
