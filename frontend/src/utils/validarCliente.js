/**
 * Valida los datos opcionales del cliente en el checkout.
 * Retorna { valido: boolean, error: string }.
 */
export function validarCliente({ email, telefono }) {
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valido: false, error: 'El email ingresado no es válido.' }
  }
  if (telefono && !/^[\d\s+\-()]{6,20}$/.test(telefono)) {
    return { valido: false, error: 'El teléfono ingresado no es válido.' }
  }
  return { valido: true, error: '' }
}
