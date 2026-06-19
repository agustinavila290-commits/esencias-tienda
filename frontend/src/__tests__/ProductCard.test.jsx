import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { CarritoProvider } from '../context/CarritoContext'
import { ToastProvider } from '../context/ToastContext'

const PROD = {
  id: 1,
  nombre: 'Sahumerio Rosa',
  precio: 1500,
  stock_disponible: 5,
  imagen_url: null,
  categoria_nombre: 'Sahumerios',
}

const AGOTADO = { ...PROD, stock_disponible: 0 }
const POCAS   = { ...PROD, stock_disponible: 2 }

function wrap(producto) {
  return render(
    <MemoryRouter>
      <CarritoProvider>
        <ToastProvider>
          <ProductCard producto={producto} />
        </ToastProvider>
      </CarritoProvider>
    </MemoryRouter>
  )
}

describe('ProductCard', () => {
  it('muestra el nombre del producto', () => {
    wrap(PROD)
    expect(screen.getByText('Sahumerio Rosa')).toBeInTheDocument()
  })

  it('muestra el precio formateado', () => {
    wrap(PROD)
    expect(screen.getByText(/1[.,]500/)).toBeInTheDocument()
  })

  it('muestra el badge de categoria', () => {
    wrap(PROD)
    expect(screen.getByText('Sahumerios')).toBeInTheDocument()
  })

  it('el boton agregar esta habilitado cuando hay stock', () => {
    wrap(PROD)
    const btn = screen.getByRole('button', { name: /agregar/i })
    expect(btn).not.toBeDisabled()
  })

  it('muestra "Agotado" y deshabilita el boton cuando sin stock', () => {
    wrap(AGOTADO)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    // Hay dos textos "Agotado" (badge + botón), al menos uno existe
    expect(screen.getAllByText('Agotado').length).toBeGreaterThan(0)
  })

  it('muestra badge "¡Últimas!" cuando stock <= 3', () => {
    wrap(POCAS)
    expect(screen.getByText('¡Últimas!')).toBeInTheDocument()
  })

  it('no muestra badge "¡Últimas!" cuando hay suficiente stock', () => {
    wrap(PROD)
    expect(screen.queryByText('¡Últimas!')).not.toBeInTheDocument()
  })

  it('no muestra imagen cuando imagen_url es null (muestra fallback)', () => {
    wrap(PROD)
    expect(screen.queryByRole('img', { name: 'Sahumerio Rosa' })).not.toBeInTheDocument()
  })

  it('muestra imagen cuando imagen_url tiene valor', () => {
    wrap({ ...PROD, imagen_url: 'http://example.com/rosa.jpg' })
    const img = screen.getByRole('img', { name: 'Sahumerio Rosa' })
    expect(img).toHaveAttribute('src', 'http://example.com/rosa.jpg')
  })

  it('agregar producto llama agregar en el contexto (totalItems sube)', async () => {
    const user = userEvent.setup()
    // Render con una función de test para verificar el contexto
    let totalItems = 0
    const { CarritoProvider: CP, useCarrito } = await import('../context/CarritoContext')

    function Inspector() {
      const { totalItems: t } = useCarrito()
      totalItems = t
      return null
    }

    render(
      <MemoryRouter>
        <CarritoProvider>
          <ToastProvider>
            <ProductCard producto={PROD} />
            <Inspector />
          </ToastProvider>
        </CarritoProvider>
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /agregar/i }))
    expect(totalItems).toBe(1)
  })
})
