// Agrupación de registros del Cuaderno Rojo por mes y año.
// Utilitario puro: no accede a red, almacenamiento ni estado global.
// Se prepara para cuando exista integración con backend; hoy no recibe datos.

const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** Extrae la clave `YYYY-MM` de una fecha `YYYY-MM-DD`. Devuelve `null` si no es válida. */
export function clavePeriodo(fecha) {
  const coincidencia = /^(\d{4})-(\d{2})/.exec(String(fecha ?? '').trim())
  return coincidencia ? `${coincidencia[1]}-${coincidencia[2]}` : null
}

/** Etiqueta legible de un período `YYYY-MM`, p. ej. "Octubre 2026". */
export function etiquetaPeriodo(clave) {
  const [anio, mes] = String(clave ?? '').split('-')
  const indice = Number(mes) - 1
  const nombre = MESES_ES[indice] ?? mes
  return `${capitalizar(nombre)} ${anio}`
}

/**
 * Agrupa registros por mes y año, ordenados del período más reciente al más
 * antiguo. Cada grupo: `{ clave, anio, mes, etiqueta, registros }`.
 * Los registros sin fecha válida se descartan.
 */
export function agruparPorMesAnio(registros = []) {
  const grupos = new Map()

  for (const registro of registros) {
    const clave = clavePeriodo(registro?.fecha)
    if (!clave) continue
    if (!grupos.has(clave)) grupos.set(clave, [])
    grupos.get(clave).push(registro)
  }

  return [...grupos.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([clave, items]) => {
      const registrosOrdenados = [...items].sort((a, b) =>
        String(b?.fecha ?? '').localeCompare(String(a?.fecha ?? '')),
      )
      return {
        clave,
        anio: Number(clave.slice(0, 4)),
        mes: Number(clave.slice(5, 7)),
        etiqueta: etiquetaPeriodo(clave),
        registros: registrosOrdenados,
      }
    })
}
