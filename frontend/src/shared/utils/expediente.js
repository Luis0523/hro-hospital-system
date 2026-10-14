// Formato de presentación del número de expediente: separa los 2 últimos
// dígitos con un guion (p. ej. "927581" -> "9275-81"). Es SOLO visual: el valor
// que viaja al backend y el que se captura en inputs van sin guion.
// Los valores no puramente numéricos (p. ej. "EXP-2024-035") se devuelven igual.
export function formatearExpediente(numero) {
  if (numero == null) return ''
  const texto = String(numero).trim()
  if (!/^\d{3,}$/.test(texto)) return texto
  return `${texto.slice(0, -2)}-${texto.slice(-2)}`
}
