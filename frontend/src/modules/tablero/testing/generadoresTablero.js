import { generarAsignacionesVolumen } from '../api/mockData'

/**
 * Utilidades deterministas para pruebas de volumen del tablero.
 * Solo se importan desde archivos *.test.js(x): no entran al bundle productivo.
 * No usan Math.random ni datos reales de pacientes.
 */

export function generarAsignacionesPrueba(cantidad, { idBase = 1 } = {}) {
  return generarAsignacionesVolumen(cantidad, { idBase })
}

export function generarIdsSala(cantidad, { desde = 1 } = {}) {
  const total = Number.isInteger(cantidad) && cantidad > 0 ? cantidad : 0
  return Array.from({ length: total }, (_, indice) => desde + indice)
}

/**
 * Evento WebSocket con el contrato real. `extra` permite inyectar campos
 * ficticios (nombrePaciente, dpi, ...) solo para probar que se descartan.
 */
export function generarEventoPrueba({
  asignacionDiariaEspacioId,
  turnoActual = null,
  intentosLlamado = null,
  tipoEvento = 'ACTUALIZACION',
  ...extra
} = {}) {
  return {
    asignacionDiariaEspacioId,
    espacioNumero: String(100 + (Number(asignacionDiariaEspacioId) % 900)),
    nivel: 1 + (Number(asignacionDiariaEspacioId) % 3),
    subespecialidadNombre: `Clínica ${String(asignacionDiariaEspacioId).padStart(3, '0')}`,
    turnoActual,
    turnoSiguiente: turnoActual != null ? turnoActual + 1 : null,
    ultimaActualizacion: '2026-09-20T08:00:00-06:00',
    intentosLlamado,
    tipoEvento,
    ...extra,
  }
}

/**
 * Jornada determinista: combina ACTUALIZACION y LLAMADO (con intentos
 * incrementales) repartidos en round-robin entre las asignaciones dadas.
 */
export function generarJornadaPrueba({
  asignaciones = [],
  totalEventos = 0,
  incluirLlamados = true,
} = {}) {
  const eventos = []
  if (asignaciones.length === 0 || totalEventos <= 0) return eventos

  const turnos = new Map()
  const intentos = new Map()

  for (let i = 0; i < totalEventos; i += 1) {
    const asignacion = asignaciones[i % asignaciones.length]
    const id = asignacion.asignacionDiariaEspacioId
    let turno = turnos.get(id) ?? 0
    let intento = intentos.get(id) ?? 0
    const esLlamado = incluirLlamados && i % 5 === 0

    if (esLlamado) {
      if (turno < 1) turno = 1
      intento += 1
      eventos.push(
        generarEventoPrueba({
          asignacionDiariaEspacioId: id,
          turnoActual: turno,
          intentosLlamado: intento,
          tipoEvento: 'LLAMADO',
        }),
      )
    } else {
      turno += 1
      eventos.push(
        generarEventoPrueba({
          asignacionDiariaEspacioId: id,
          turnoActual: turno,
          intentosLlamado: null,
          tipoEvento: 'ACTUALIZACION',
        }),
      )
    }

    turnos.set(id, turno)
    intentos.set(id, intento)
  }

  return eventos
}
