// Formato de presentación del número de expediente: separa los últimos 2
// dígitos con un guion (p. ej. "927581" -> "9275-81"). Los expedientes de 5
// dígitos se muestran con 4 + 1 (p. ej. "30954" -> "3095-4"). Es SOLO visual:
// el valor que viaja al backend y el que se captura en inputs va sin guion.
// Los valores no puramente numéricos (p. ej. "EXP-2024-035") se devuelven igual.
export function formatearExpediente(numero) {
  if (numero == null) return ''
  const texto = String(numero).trim()
  if (!/^\d+$/.test(texto)) return texto
  if (texto.length === 5) return `${texto.slice(0, 4)}-${texto.slice(4)}`
  if (texto.length >= 3) return `${texto.slice(0, -2)}-${texto.slice(-2)}`
  return texto
}
