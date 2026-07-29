import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Carrito from '../components/Carrito'
import { CarritoProvider, useCarrito } from '../context/CarritoContext'
import { ToastProvider } from '../context/ToastContext'
import { productosService } from '../services/api'

vi.mock('../services/api', () => ({
  productosService: { get: vi.fn() },
  pedidosService: { crear: vi.fn(), crearPreferencia: vi.fn() },
}))

const ITEM_A = { id: 1, nombre: 'Sahumerio de Rosa', slug: 'sahumerio-de-rosa', precio: 1500, stock_disponible: 5, imagen_url: null, categoria_nombre: 'Sahumerios', cantidad: 1 }
const ITEM_B = { id: 2, nombre: 'Incienso de Mirra', slug: 'incienso-de-mirra', precio: 2000, stock_disponible: 3, imagen_url: null, categoria_nombre: 'Inciensos', cantidad: 2 }

// Abre el carrito automáticamente al montar — evita repetir el mismo botón
// "Abrir carrito" en cada test, ya cubierto en Layout.
function AutoAbrir() {
  const { setAbierto } = useCarrito()
  useEffect(() => { setAbierto(true) }, [setAbierto])
  return null
}

function wrap({ items = [], mockGet } = {}) {
  if (items.length > 0) {
    localStorage.setItem('carrito', JSON.stringify({ v: 1, items }))
  }
  // El mock se configura ANTES del render: la revalidación dispara la
  // llamada real apenas se monta, así que configurarlo después llegaría tarde.
  if (mockGet) {
    productosService.get.mockImplementation(mockGet)
  } else {
    productosService.get.mockImplementation((id) => {
      const item = items.find(i => i.id === id)
      return Promise.resolve({ data: { ...item, precio: item.precio, stock_disponible: item.stock_disponible, disponibilidad: 'disponible' } })
    })
  }
  return render(
    <MemoryRouter>
      <CarritoProvider>
        <ToastProvider>
          <Carrito />
          <AutoAbrir />
        </ToastProvider>
      </CarritoProvider>
    </MemoryRouter>
  )
}

describe('Carrito', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('muestra el estado vacío cuando no hay items', async () => {
    wrap({ items: [] })
    expect(await screen.findByText('Tu carrito está vacío')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explorar productos' })).toBeInTheDocument()
  })

  it('es un dialog accesible con aria-modal', async () => {
    wrap({ items: [] })
    const dialog = await screen.findByRole('dialog', { name: 'Carrito de compras' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('muestra los productos del carrito con nombre, categoría y precio', async () => {
    wrap({ items: [ITEM_A] })
    expect(await screen.findByText('Sahumerio de Rosa')).toBeInTheDocument()
    expect(screen.getByText('Sahumerios')).toBeInTheDocument()
    // Con un solo item, el precio de línea y el subtotal coinciden ($1.500
    // aparece dos veces: en la tarjeta del producto y en el resumen).
    expect(screen.getAllByText('$1.500').length).toBe(2)
  })

  it('muestra el subtotal correcto con varios productos', async () => {
    wrap({ items: [ITEM_A, ITEM_B] })
    await screen.findByText('Sahumerio de Rosa')
    // 1500*1 + 2000*2 = 5500
    expect(screen.getByText('$5.500')).toBeInTheDocument()
  })

  it('aumentar cantidad actualiza el subtotal de esa línea', async () => {
    const user = userEvent.setup()
    wrap({ items: [ITEM_A] })
    await screen.findByText('Sahumerio de Rosa')
    await user.click(screen.getByLabelText('Aumentar cantidad de Sahumerio de Rosa'))
    await waitFor(() => expect(screen.getAllByText('$3.000').length).toBe(2))
  })

  it('el selector de cantidad no baja de 1 (el botón de restar se deshabilita)', async () => {
    wrap({ items: [ITEM_A] })
    await screen.findByText('Sahumerio de Rosa')
    expect(screen.getByLabelText('Disminuir cantidad de Sahumerio de Rosa')).toBeDisabled()
  })

  it('el selector de cantidad se deshabilita al llegar al stock máximo', async () => {
    wrap({ items: [{ ...ITEM_A, cantidad: 5, stock_disponible: 5 }] })
    await screen.findByText('Sahumerio de Rosa')
    expect(screen.getByLabelText('Aumentar cantidad de Sahumerio de Rosa')).toBeDisabled()
    expect(screen.getByText(/Solo quedan 5 unidades disponibles/)).toBeInTheDocument()
  })

  it('eliminar quita el producto y muestra un toast con Deshacer', async () => {
    const user = userEvent.setup()
    wrap({ items: [ITEM_A] })
    await screen.findByText('Sahumerio de Rosa')
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(screen.queryByText('Sahumerio de Rosa')).not.toBeInTheDocument())
    expect(screen.getByText('Producto eliminado del carrito')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deshacer' })).toBeInTheDocument()
  })

  it('Deshacer restaura el producto eliminado', async () => {
    const user = userEvent.setup()
    wrap({ items: [ITEM_A] })
    await screen.findByText('Sahumerio de Rosa')
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(screen.queryByText('Sahumerio de Rosa')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Deshacer' }))
    await waitFor(() => expect(screen.getByText('Sahumerio de Rosa')).toBeInTheDocument())
  })

  it('revalida contra el backend al abrir y avisa si el precio cambió', async () => {
    wrap({
      items: [ITEM_A],
      mockGet: () => Promise.resolve({ data: { ...ITEM_A, precio: 1800, stock_disponible: 5, disponibilidad: 'disponible' } }),
    })
    await screen.findByText('Sahumerio de Rosa')
    await waitFor(() => expect(productosService.get).toHaveBeenCalledWith(ITEM_A.id))
    await waitFor(() => expect(screen.getByText(/cambió de \$1.500 a \$1.800/)).toBeInTheDocument())
  })

  it('revalida y avisa si el producto ya no está disponible', async () => {
    wrap({
      items: [ITEM_A],
      mockGet: () => Promise.reject({ response: { status: 404 } }),
    })
    await screen.findByText('Sahumerio de Rosa')
    await waitFor(() => expect(screen.getByText(/ya no está disponible/)).toBeInTheDocument())
  })

  it('"Continuar con la compra" revela los medios de pago sin crear ninguna reserva', async () => {
    const user = userEvent.setup()
    const { pedidosService } = await import('../services/api')
    wrap({ items: [ITEM_A] })
    await screen.findByText('Sahumerio de Rosa')
    await user.click(screen.getByRole('button', { name: 'Continuar con la compra' }))
    expect(await screen.findByRole('button', { name: /Pagar con Mercado Pago/ })).toBeInTheDocument()
    expect(pedidosService.crear).not.toHaveBeenCalled()
  })
})
