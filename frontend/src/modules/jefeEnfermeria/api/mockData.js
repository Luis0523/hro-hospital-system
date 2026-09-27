// Datos provisionales para el área de Jefe de Enfermería (solo dev/mock).
// La estructura imita los DTO confirmados del backend; no es fuente real.

const ESPACIOS_BASE = [
  { id: 'ef-101', numero: '101', nivel: 1, capacidadCamillas: 1 },
  { id: 'ef-102', numero: '102', nivel: 1, capacidadCamillas: 1 },
  { id: 'ef-201', numero: '201', nivel: 2, capacidadCamillas: 1 },
  { id: 'ef-202', numero: '202', nivel: 2, capacidadCamillas: 1 },
  { id: 'ef-203', numero: '203', nivel: 2, capacidadCamillas: 2 },
  { id: 'ef-301', numero: '301', nivel: 3, capacidadCamillas: 1 },
  { id: 'ef-401', numero: '401', nivel: 4, capacidadCamillas: 1 },
  { id: 'ef-402', numero: '402', nivel: 4, capacidadCamillas: 1 },
]

const SUBESPECIALIDADES_BASE = [
  { id: 1, nombre: 'Medicina General', especialidadId: 1, especialidadNombre: 'Medicina Interna' },
  { id: 2, nombre: 'Cardiología Clínica', especialidadId: 6, especialidadNombre: 'Cardiología' },
  { id: 3, nombre: 'Pediatría General', especialidadId: 2, especialidadNombre: 'Pediatría' },
  { id: 4, nombre: 'Control de Niño Sano', especialidadId: 2, especialidadNombre: 'Pediatría' },
  { id: 5, nombre: 'Pediatría Especializada', especialidadId: 2, especialidadNombre: 'Pediatría' },
  {
    id: 6,
    nombre: 'Ginecología General',
    especialidadId: 3,
    especialidadNombre: 'Ginecología y Obstetricia',
  },
  { id: 7, nombre: 'Cirugía General', especialidadId: 4, especialidadNombre: 'Cirugía General' },
  {
    id: 8,
    nombre: 'Traumatología General',
    especialidadId: 5,
    especialidadNombre: 'Traumatología y Ortopedia',
  },
]

export const espaciosMock = ESPACIOS_BASE.map((espacio) => ({ ...espacio }))
export const subespecialidadesMock = SUBESPECIALIDADES_BASE.map((sub) => ({ ...sub }))

/** fecha -> Map(espacioFisicoId -> { id, subespecialidadId }) */
const asignacionesPorFecha = new Map()
let contadorAsignacion = 1

function mapaDe(fecha) {
  if (!asignacionesPorFecha.has(fecha)) asignacionesPorFecha.set(fecha, new Map())
  return asignacionesPorFecha.get(fecha)
}

function subDe(id) {
  return subespecialidadesMock.find((sub) => sub.id === Number(id)) ?? null
}

export function listarEspaciosFisicosMock(nivel) {
  return espaciosMock
    .filter((espacio) => !nivel || Number(espacio.nivel) === Number(nivel))
    .map((espacio) => ({ ...espacio, activo: true }))
}

export function listarSubespecialidadesMock() {
  return subespecialidadesMock.map((sub) => ({ ...sub, activo: true }))
}

export function vistaAsignacionMock(fecha, nivel) {
  const mapa = mapaDe(fecha)
  return espaciosMock
    .filter((espacio) => !nivel || Number(espacio.nivel) === Number(nivel))
    .map((espacio) => {
      const asignacion = mapa.get(espacio.id)
      const sub = asignacion ? subDe(asignacion.subespecialidadId) : null
      return {
        espacioFisicoId: espacio.id,
        numero: espacio.numero,
        nivel: espacio.nivel,
        capacidadCamillas: espacio.capacidadCamillas,
        asignacionId: asignacion?.id ?? null,
        subespecialidadId: sub?.id ?? null,
        subespecialidadNombre: sub?.nombre ?? null,
        especialidadId: sub?.especialidadId ?? null,
        especialidadNombre: sub?.especialidadNombre ?? null,
      }
    })
}

export function guardarAsignacionMock({ espacioFisicoId, subespecialidadId, fecha }) {
  const mapa = mapaDe(fecha)
  const existente = mapa.get(espacioFisicoId)
  const asignacion = existente ?? { id: contadorAsignacion++, subespecialidadId: null }
  asignacion.subespecialidadId = Number(subespecialidadId)
  mapa.set(espacioFisicoId, asignacion)

  const sub = subDe(asignacion.subespecialidadId)
  return {
    id: asignacion.id,
    fecha,
    espacioFisicoId,
    subespecialidadId: sub?.id ?? null,
    subespecialidadNombre: sub?.nombre ?? null,
  }
}

export function eliminarAsignacionMock(id) {
  for (const mapa of asignacionesPorFecha.values()) {
    for (const [espacioFisicoId, asignacion] of mapa.entries()) {
      if (asignacion.id === Number(id)) {
        mapa.delete(espacioFisicoId)
        return { ok: true }
      }
    }
  }
  return { ok: true }
}

export function reiniciarJefeMock() {
  asignacionesPorFecha.clear()
  contadorAsignacion = 1
}
