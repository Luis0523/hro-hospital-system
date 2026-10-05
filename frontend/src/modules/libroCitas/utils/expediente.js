// El número de expediente real es numérico, sin guion y sin longitud fija.
// Ejemplos válidos: 837871, 123456. Inválidos: 1323-23, ABC123.
export const PATRON_EXPEDIENTE = /^\d+$/

export function normalizarExpediente(valor) {
  return String(valor ?? '').trim()
}

export function esExpedienteValido(valor) {
  return PATRON_EXPEDIENTE.test(normalizarExpediente(valor))
}
