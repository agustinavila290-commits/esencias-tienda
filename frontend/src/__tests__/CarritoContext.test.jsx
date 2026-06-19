import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CarritoProvider, useCarrito } from '../context/CarritoContext'

const PROD_A = { id: 1, nombre: 'Rosa', precio: 500, stock_disponible: 3, imagen_url: null }
const PROD_B = { id: 2, nombre: 'Lavanda', precio: 300, stock_disponible: 5, imagen_url: null }

function TestCarrito() {
  const { items, agregar, quitar, cambiarCantidad, vaciar, totalItems, totalPrecio } = useCarrito()
  return (
    <div>
      <span data-testid="total-items">{totalItems}</span>
      <span data-testid="total-precio">{totalPrecio}</span>
      <span data-testid="items-count">{items.length}</span>
      <button onClick={() => agregar(PROD_A)}>agregar-a</button>
      <button onClick={() => agregar(PROD_B)}>agregar-b</button>
      <button onClick={() => quitar(PROD_A.id)}>quitar-a</button>
      <button onClick={() => cambiarCantidad(PROD_A.id, 0)}>set-cero</button>
      <button onClick={() => vaciar()}>vaciar</button>
    </div>
  )
}

function wrap() {
  return render(<CarritoProvider><TestCarrito /></CarritoProvider>)
}

describe('CarritoContext', () => {
  beforeEach(() => localStorage.clear())

  it('inicia con carrito vacio', () => {
    wrap()
    expect(screen.getByTestId('total-items').textContent).toBe('0')
    expect(screen.getByTestId('items-count').textContent).toBe('0')
  })

  it('agregar un producto nuevo aumenta totalItems', async () => {
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByText('agregar-a'))
    expect(screen.getByTestId('total-items').textContent).toBe('1')
    expect(screen.getByTestId('total-precio').textContent).toBe('500')
  })

  it('agregar el mismo producto acumula cantidad (no duplica items)', async () => {
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByText('agregar-a'))
    await user.click(screen.getByText('agregar-a'))
    expect(screen.getByTestId('total-items').textContent).toBe('2')
    expect(screen.getByTestId('items-count').textContent).toBe('1')
  })

  it('no supera stock_disponible al agregar repetidamente', async () => {
    const user = userEvent.setup()
    wrap()
    // PROD_A tiene stock_disponible = 3; click 5 veces
    for (let i = 0; i < 5; i++) await user.click(screen.getByText('agregar-a'))
    expect(screen.getByTestId('total-items').textContent).toBe('3')
  })

  it('agregar dos productos distintos crea dos items', async () => {
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByText('agregar-a'))
    await user.click(screen.getByText('agregar-b'))
    expect(screen.getByTestId('items-count').textContent).toBe('2')
    expect(screen.getByTestId('total-items').textContent).toBe('2')
    expect(screen.getByTestId('total-precio').textContent).toBe('800')
  })

  it('quitar elimina el producto del carrito', async () => {
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByText('agregar-a'))
    await user.click(screen.getByText('quitar-a'))
    expect(screen.getByTestId('total-items').textContent).toBe('0')
    expect(screen.getByTestId('items-count').textContent).toBe('0')
  })

  it('cambiar cantidad a 0 elimina el item', async () => {
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByText('agregar-a'))
    await user.click(screen.getByText('set-cero'))
    expect(screen.getByTestId('items-count').textContent).toBe('0')
  })

  it('vaciar limpia todos los items', async () => {
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByText('agregar-a'))
    await user.click(screen.getByText('agregar-b'))
    await user.click(screen.getByText('vaciar'))
    expect(screen.getByTestId('total-items').textContent).toBe('0')
    expect(screen.getByTestId('items-count').textContent).toBe('0')
  })

  it('persiste el carrito en localStorage al agregar', async () => {
    const user = userEvent.setup()
    const { unmount } = wrap()
    await user.click(screen.getByText('agregar-a'))
    unmount()
    // Remount — debe leer localStorage
    wrap()
    expect(screen.getByTestId('total-items').textContent).toBe('1')
  })

  it('carga desde localStorage al montar', () => {
    localStorage.setItem('carrito', JSON.stringify([
      { id: 1, nombre: 'Rosa', precio: 500, stock_disponible: 3, cantidad: 2, imagen_url: null }
    ]))
    wrap()
    expect(screen.getByTestId('total-items').textContent).toBe('2')
    expect(screen.getByTestId('total-precio').textContent).toBe('1000')
  })
})
