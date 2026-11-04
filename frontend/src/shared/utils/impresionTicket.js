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
  { turno, especialidad, clinica = null, fechaHora = formatearFechaHora(new Date()) },
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
        fechaHora,
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

/** Indica si el ticket corresponde a Ginecología (ajuste temporal). */
export function esEspecialidadGinecologia(especialidad) {
  return /ginecolog/i.test(String(especialidad ?? ''))
}

/** Valida que el número de clínica pueda viajar como entero al agente. */
export function esNumeroClinica(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) return false
  const numero = Number(texto)
  return Number.isInteger(numero) && numero >= 0
}

/**
 * Ticket temporal de Ginecología: el número grande vuelve a ser la clínica.
 * Se envía el número de clínica en `turno` y otra vez en `clinica`, sin
 * modificar el agente de impresión ni el ticket oficial.
 */
export function payloadTicketGinecologia({
  clinica,
  especialidad,
  fechaHora = formatearFechaHora(new Date()),
}) {
  const textoClinica = String(clinica ?? '').trim()
  if (!esNumeroClinica(textoClinica)) {
    throw new Error('El número de clínica debe ser un entero mayor o igual a cero.')
  }
  return {
    turno: Number(textoClinica),
    especialidad,
    clinica: textoClinica,
    fechaHora,
  }
}

export async function imprimirTicketGinecologia({ clinica, especialidad }, opciones) {
  return imprimirTicketTurno(payloadTicketGinecologia({ clinica, especialidad }), opciones)
}
