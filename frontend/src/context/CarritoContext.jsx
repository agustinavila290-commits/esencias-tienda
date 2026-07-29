import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CarritoContext = createContext(null)

const STORAGE_KEY = 'carrito'
const STORAGE_VERSION = 1

// Un item corrupto (de una versión vieja del carrito, o editado a mano en
// devtools) no debe tirar abajo toda la app — se descarta en silencio en vez
// de romper el parseo de todo el carrito.
function esItemValido(item) {
  return item
    && typeof item === 'object'
    && Number.isFinite(item.id)
    && typeof item.nombre === 'string' && item.nombre.length > 0
    && Number.isFinite(item.precio) && item.precio >= 0
    && Number.isFinite(item.cantidad) && item.cantidad > 0
    && Number.isFinite(item.stock_disponible) && item.stock_disponible >= 0
}

function sanearItem(item) {
  return { ...item, cantidad: Math.min(item.cantidad, item.stock_disponible) }
}

function cargarDesdeStorage() {
  let crudo
  try {
    crudo = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
  // Formato viejo (sin versionar): un array plano de items. Formato actual:
  // { v: 1, items: [...] }. Se soportan ambos para no perder carritos ya
  // guardados en el navegador de un cliente al desplegar esta versión.
  const items = Array.isArray(crudo) ? crudo : (Array.isArray(crudo?.items) ? crudo.items : [])
  return items.filter(esItemValido).map(sanearItem)
}

export function CarritoProvider({ children }) {
  const [items, setItems] = useState(cargarDesdeStorage)
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: STORAGE_VERSION, items }))
  }, [items])

  const agregar = useCallback((producto, cantidad = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === producto.id)
      if (idx >= 0) {
        const next = [...prev]
        const nuevaCantidad = next[idx].cantidad + cantidad
        next[idx] = {
          ...next[idx],
          // Se refresca con los datos más recientes del producto por si
          // cambiaron desde que se agregó la primera vez (precio, stock, etc).
          precio: parseFloat(producto.precio),
          stock_disponible: producto.stock_disponible,
          cantidad: Math.min(nuevaCantidad, producto.stock_disponible),
        }
        return next
      }
      return [...prev, {
        id: producto.id,
        nombre: producto.nombre,
        slug: producto.slug,
        precio: parseFloat(producto.precio),
        imagen_url: producto.imagen_thumbnail_url || producto.imagen_url,
        categoria_nombre: producto.categoria_nombre || null,
        stock_disponible: producto.stock_disponible,
        cantidad: Math.min(cantidad, producto.stock_disponible),
      }]
    })
  }, [])

  const cambiarCantidad = useCallback((id, cantidad) => {
    setItems(prev => prev
      .map(i => i.id === id ? { ...i, cantidad: Math.min(cantidad, i.stock_disponible) } : i)
      .filter(i => i.cantidad > 0)
    )
  }, [])

  const quitar = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  // Reinserta un item ya eliminado en su posición original — usado por el
  // "Deshacer" del toast de eliminación. No es lo mismo que `agregar`
  // (que fusionaría cantidades si el producto ya estuviera en el carrito).
  const restaurar = useCallback((item, indice) => {
    setItems(prev => {
      if (prev.some(i => i.id === item.id)) return prev
      const next = [...prev]
      next.splice(Math.min(indice, next.length), 0, item)
      return next
    })
  }, [])

  // Actualiza en el lugar los datos "de verdad" (precio/stock/disponibilidad)
  // de items ya en el carrito, tras revalidar contra el backend. No cambia
  // cantidades salvo para no superar el nuevo stock disponible.
  const actualizarDatosProducto = useCallback((id, datos) => {
    setItems(prev => prev.map(i => i.id === id
      ? { ...i, ...datos, cantidad: Math.min(i.cantidad, datos.stock_disponible ?? i.stock_disponible) }
      : i
    ))
  }, [])

  const vaciar = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((s, i) => s + i.cantidad, 0)
  const totalPrecio = items.reduce((s, i) => s + i.precio * i.cantidad, 0)

  return (
    <CarritoContext.Provider value={{
      items, abierto, setAbierto,
      agregar, cambiarCantidad, quitar, restaurar, actualizarDatosProducto, vaciar,
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
