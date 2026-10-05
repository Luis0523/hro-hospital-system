// Definición centralizada de los 8 contadores diarios del Libro de Citas.
// No agregar categorías nuevas en SCRUM-202. "Sobres" es UN único contador.
export const DEFINICION_CONTADORES = [
  { clave: 'ha', sigla: 'H.A.', nombre: 'Historias Archivadas' },
  { clave: 'eh', sigla: 'EH', nombre: 'Egresos Hospitalarios' },
  { clave: 'hdt', sigla: 'HDT', nombre: 'Historias Desactivadas por Trabajo' },
  { clave: 'hdc', sigla: 'HDC', nombre: 'Historias Desactivadas por Consulta' },
  { clave: 'sobres', sigla: 'Sobres', nombre: 'Sobres' },
  { clave: 'hr', sigla: 'HR', nombre: 'Historias Revisadas' },
  { clave: 'hd', sigla: 'HD', nombre: 'Historias Depuradas' },
  { clave: 'tia', sigla: 'T.I.A.', nombre: 'Tarjetas Índices Archivadas' },
]

export const CONTADORES_INICIALES = Object.freeze(
  DEFINICION_CONTADORES.reduce((acumulado, { clave }) => {
    acumulado[clave] = 0
    return acumulado
  }, {}),
)

/**
 * Normaliza un valor de contador a un entero >= 0.
 * - vacío / no numérico / NaN / Infinity → 0
 * - negativo → 0
 * - decimal → truncado hacia cero
 */
export function normalizarContador(valor) {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return 0
  const entero = Math.trunc(numero)
  return entero < 0 ? 0 : entero
}

/** Total DERIVADO de los 8 contadores. No se almacena como estado. */
export function calcularTotal(contadores = {}) {
  return DEFINICION_CONTADORES.reduce(
    (total, { clave }) => total + normalizarContador(contadores[clave]),
    0,
  )
}
