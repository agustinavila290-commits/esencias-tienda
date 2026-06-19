/**
 * Filtra y ordena una lista de productos según los criterios del catálogo.
 * Función pura — sin efectos secundarios, fácil de testear.
 */
export function filtrarProductos(productos, { tabActivo, busqueda, orden }) {
  let lista =
    tabActivo === 'todos'
      ? [...productos]
      : productos.filter(p => p.categoria_slug === tabActivo)

  if (busqueda.trim()) {
    const q = busqueda.toLowerCase()
    lista = lista.filter(
      p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion || '').toLowerCase().includes(q)
    )
  }

  if (orden === 'precio_asc') lista.sort((a, b) => a.precio - b.precio)
  else if (orden === 'precio_desc') lista.sort((a, b) => b.precio - a.precio)
  else if (orden === 'nuevos') lista.sort((a, b) => b.id - a.id)
  else lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  return lista
}
