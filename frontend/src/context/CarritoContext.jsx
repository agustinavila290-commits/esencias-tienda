import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CarritoContext = createContext(null)

export function CarritoProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('carrito') || '[]')
    } catch {
      return []
    }
  })
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    localStorage.setItem('carrito', JSON.stringify(items))
  }, [items])

  const agregar = useCallback((producto, cantidad = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === producto.id)
      if (idx >= 0) {
        const next = [...prev]
        const nuevaCantidad = next[idx].cantidad + cantidad
        next[idx] = {
          ...next[idx],
          cantidad: Math.min(nuevaCantidad, producto.stock_disponible),
        }
        return next
      }
      return [...prev, {
        id: producto.id,
        nombre: producto.nombre,
        precio: parseFloat(producto.precio),
        imagen_url: producto.imagen_url,
        stock_disponible: producto.stock_disponible,
        cantidad: Math.min(cantidad, producto.stock_disponible),
      }]
    })
  }, [])

  const cambiarCantidad = useCallback((id, cantidad) => {
    setItems(prev => prev
      .map(i => i.id === id ? { ...i, cantidad } : i)
      .filter(i => i.cantidad > 0)
    )
  }, [])

  const quitar = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const vaciar = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((s, i) => s + i.cantidad, 0)
  const totalPrecio = items.reduce((s, i) => s + i.precio * i.cantidad, 0)

  return (
    <CarritoContext.Provider value={{
      items, abierto, setAbierto,
      agregar, cambiarCantidad, quitar, vaciar,
      totalItems, totalPrecio,
    }}>
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  const ctx = useContext(CarritoContext)
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider')
  return ctx
}
