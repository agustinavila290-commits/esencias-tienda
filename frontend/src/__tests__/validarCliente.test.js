import { describe, it, expect } from 'vitest'
import { validarCliente } from '../utils/validarCliente'

describe('validarCliente', () => {
  it('campos vacios son opcionales — pasa validacion', () => {
    const { valido, error } = validarCliente({ email: '', telefono: '' })
    expect(valido).toBe(true)
    expect(error).toBe('')
  })

  it('email con formato correcto pasa', () => {
    expect(validarCliente({ email: 'usuario@dominio.com', telefono: '' }).valido).toBe(true)
  })

  it('email con subdominio pasa', () => {
    expect(validarCliente({ email: 'user@mail.co.ar', telefono: '' }).valido).toBe(true)
  })

  it('email invalido sin arroba retorna error', () => {
    const { valido, error } = validarCliente({ email: 'sinArroba', telefono: '' })
    expect(valido).toBe(false)
    expect(error).toMatch(/email/i)
  })

  it('email invalido sin dominio retorna error', () => {
    const { valido } = validarCliente({ email: 'user@', telefono: '' })
    expect(valido).toBe(false)
  })

  it('telefono numerico valido pasa', () => {
    expect(validarCliente({ email: '', telefono: '1122334455' }).valido).toBe(true)
  })

  it('telefono con espacios y guiones pasa', () => {
    expect(validarCliente({ email: '', telefono: '+54 11 1234-5678' }).valido).toBe(true)
  })

  it('telefono con letras retorna error', () => {
    const { valido, error } = validarCliente({ email: '', telefono: 'abc123' })
    expect(valido).toBe(false)
    expect(error).toMatch(/teléfono/i)
  })

  it('telefono demasiado corto retorna error', () => {
    const { valido } = validarCliente({ email: '', telefono: '123' })
    expect(valido).toBe(false)
  })

  it('valida email antes que telefono (primer error primero)', () => {
    const { valido, error } = validarCliente({ email: 'malo', telefono: 'abc' })
    expect(valido).toBe(false)
    expect(error).toMatch(/email/i)
  })
})
