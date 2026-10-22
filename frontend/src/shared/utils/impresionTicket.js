const AGENTE_URL = import.meta.env.VITE_PRINT_AGENT_URL || 'http://127.0.0.1:17777'
const ES_MODO_TEST = import.meta.env.MODE === 'test'

/** Fecha y hora local con el formato que espera el ticket. */
export function formatearFechaHora(fecha = new Date()) {
  const dd = String(fecha.getDate()).padStart(2, '0')
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const aaaa = fecha.getFullYear()
  const hh = String(fecha.getHours()).padStart(2, '0')
  const min = String(fecha.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${aaaa} ${hh}:${min}`
}

/**
 * Envía un ticket al agente local de impresión.
 * Si no hay clínica asignada, el agente imprime «Estar atento a la pantalla».
 */
export async function imprimirTicketTurno(
  { turno, especialidad, clinica = null },
  { ms = 12000 } = {},
) {
  if (ES_MODO_TEST) return { ok: true, omitido: true }

  const control = new AbortController()
  const temporizador = setTimeout(() => control.abort(), ms)

  try {
    const respuesta = await fetch(`${AGENTE_URL}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turno,
        especialidad,
        clinica,
        fechaHora: formatearFechaHora(new Date()),
      }),
      signal: control.signal,
    })

    const datos = await respuesta.json().catch(() => ({}))
    if (!respuesta.ok || !datos.ok) {
      throw new Error(datos.mensaje || `El agente respondió con estado ${respuesta.status}`)
    }
    return datos
  } finally {
    clearTimeout(temporizador)
  }
}
