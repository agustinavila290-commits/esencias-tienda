import { describe, it, expect } from 'vitest'
import { filtrarProductos } from '../utils/filtrarProductos'

const PRODUCTOS = [
  { id: 1, nombre: 'Sahumerio Rosa', descripcion: 'Aroma suave y floral', precio: 500, categoria_slug: 'sahumerios' },
  { id: 2, nombre: 'Incienso Lavanda', descripcion: 'Relajante y medicinal', precio: 300, categoria_slug: 'inciensos' },
  { id: 3, nombre: 'Porta-sahumerios', descripcion: 'Accesorio de madera', precio: 200, categoria_slug: 'accesorios' },
]

describe('filtrarProductos', () => {
  it('retorna todos los productos cuando tabActivo es "todos"', () => {
    const r = filtrarProductos(PRODUCTOS, { tabActivo: 'todos', busqueda: '', orden: 'nombre' })
    expect(r).toHaveLength(3)
  })

  it('filtra por categoria_slug', () => {
    const r = filtrarProductos(PRODUCTOS, { tabActivo: 'sahumerios', busqueda: '', orden: 'nombre' })
    expect(r).toHaveLength(1)
    expect(r[0].nombre).toBe('Sahumerio Rosa')
  })

  it('filtra por categoria y no muestra las otras', () => {
    const r = filtrarProductos(PRODUCTOS, { tabActivo: 'inciensos', busqueda: '', orden: 'nombre' })
    expect(r.map(p => p.nombre)).not.toContain('Sahumerio Rosa')
  })

  it('busca por nombre (case-insensitive)', () => {
    const r = filtrarProductos(PRODUCTOS, { tabActivo: 'todos', busqueda: 'LAVANDA', orden: 'nombre' })
    expect(r).toHaveLength(1)
    expect(r[0].nombre).toBe('Incienso Lavanda')
  })

  it('busca por descripcion', () => {
    const r = filtrarProductos(PRODUCTOS, { tabActivo: 'todos', busqueda: 'relajante', orden: 'nombre' })
    expect(r).toHaveLength(1)
    expect(r[0].nombre).toBe('Incienso Lavanda')
  })

  it('combina filtro de categoria y busqueda', () => {
    const r = filtrarProductos(PRODUCTOS, { tabActivo: 'sahumerios', busqueda: 'floral', orden: 'nombre' })
    expect(r).toHaveLength(1)
    expect(r[0].nombre).toBe('Sahumerio Rosa')
  })

  it('retorna lista vacia si no hay coincidencias', () => {
    const r = filtrarProductos(PRODUCTOS, { tabActivo: 'todos', busqueda: 'xyz_no_existe', orden: 'nombre' })
    expect(r).toHaveLength(0)
  })

  it('ordena por precio ascendente', () => {
    const r = filtrarProductos(PRODUCTOS, { tabActivo: 'todos', busqueda: '', orden: 'precio_asc' })
    const precios = r.map(p => p.precio)
    expect(precios).toEqual([...precios].sort((a, b) => a - b))
  })

  it('ordena por precio descendente', () => {
    const r = filtrarProductos(PRODUCTOS, { tabActivo: 'todos', busqueda: '', orden: 'precio_desc' })
    const precios = r.map(p => p.precio)
    expect(precios).toEqual([...precios].sort((a, b) => b - a))
  })

  it('ordena por mas nuevos (id descendente)', () => {
    const r = filtrarProductos(PRODUCTOS, { tabActivo: 'todos', busqueda: '', orden: 'nuevos' })
    expect(r[0].id).toBe(3)
    expect(r[r.length - 1].id).toBe(1)
  })

  it('ordena por nombre (A-Z) por defecto', () => {
    const r = filtrarProductos(PRODUCTOS, { tabActivo: 'todos', busqueda: '', orden: 'nombre' })
    const nombres = r.map(p => p.nombre)
    expect(nombres).toEqual([...nombres].sort((a, b) => a.localeCompare(b, 'es')))
  })

  it('no muta el array original', () => {
    const original = [...PRODUCTOS]
    filtrarProductos(PRODUCTOS, { tabActivo: 'todos', busqueda: '', orden: 'precio_asc' })
    expect(PRODUCTOS).toEqual(original)
  })
})
