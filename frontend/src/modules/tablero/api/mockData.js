export const asignacionesMock = [
  {
    asignacionDiariaEspacioId: 1,
    espacioNumero: '201',
    nivel: 2,
    subespecialidadNombre: 'Pediatría General',
    turnoActual: 7,
    turnoSiguiente: 8,
    ultimaActualizacion: '2026-09-20T08:05:32-06:00',
  },
  {
    asignacionDiariaEspacioId: 2,
    espacioNumero: '202',
    nivel: 2,
    subespecialidadNombre: 'Medicina General',
    turnoActual: 14,
    turnoSiguiente: 15,
    ultimaActualizacion: '2026-09-20T08:06:10-06:00',
  },
  {
    asignacionDiariaEspacioId: 3,
    espacioNumero: '301',
    nivel: 3,
    subespecialidadNombre: 'Cardiología',
    turnoActual: 3,
    turnoSiguiente: 4,
    ultimaActualizacion: '2026-09-20T08:04:48-06:00',
  },
  {
    asignacionDiariaEspacioId: 4,
    espacioNumero: '302',
    nivel: 3,
    subespecialidadNombre: 'Traumatología',
    turnoActual: 21,
    turnoSiguiente: 22,
    ultimaActualizacion: '2026-09-20T08:06:55-06:00',
  },
]

export const estadoInicialMock = {
  asignaciones: asignacionesMock,
}

/**
 * Genera asignaciones ficticias deterministas (sin Math.random) para
 * visualización manual de volumen en modo mock. Nunca se usa en backend real.
 */
export function generarAsignacionesVolumen(cantidad, { idBase = 1 } = {}) {
  const total = Number.isInteger(cantidad) && cantidad > 0 ? cantidad : 0

  return Array.from({ length: total }, (_, indice) => {
    const numero = indice + 1
    const turnoActual = 1 + (indice % 7)

    return {
      asignacionDiariaEspacioId: idBase + indice,
      espacioNumero: String(100 + numero),
      nivel: 1 + (indice % 3),
      subespecialidadNombre: `Clínica ${String(numero).padStart(3, '0')}`,
      turnoActual,
      turnoSiguiente: turnoActual + 1,
      ultimaActualizacion: '2026-09-20T08:00:00-06:00',
    }
  })
}
