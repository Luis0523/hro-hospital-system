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
const diasCerrados = new Set()
let contadorAsignacion = 1

function mapaDe(fecha) {
  if (!asignacionesPorFecha.has(fecha)) asignacionesPorFecha.set(fecha, new Map())
  return asignacionesPorFecha.get(fecha)
}

function subDe(id) {
  return subespecialidadesMock.find((sub) => sub.id === Number(id)) ?? null
}

function espacioDe(id) {
  return espaciosMock.find((espacio) => espacio.id === id) ?? null
}

function itemDesdeAsignacion(fecha, espacioId, asignacion) {
  const espacio = espacioDe(espacioId)
  const sub = asignacion ? subDe(asignacion.subespecialidadId) : null
  return {
    espacioFisicoId: espacioId,
    numero: espacio?.numero ?? null,
    nivel: espacio?.nivel ?? null,
    capacidadCamillas: espacio?.capacidadCamillas ?? 1,
    asignacionId: asignacion?.id ?? null,
    subespecialidadId: sub?.id ?? null,
    subespecialidadNombre: sub?.nombre ?? null,
    especialidadId: sub?.especialidadId ?? null,
    especialidadNombre: sub?.especialidadNombre ?? null,
  }
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
    .map((espacio) => itemDesdeAsignacion(fecha, espacio.id, mapa.get(espacio.id)))
}

export function guardarAsignacionMock({ espacioFisicoId, subespecialidadId, fecha }) {
  if (diasCerrados.has(fecha)) {
    const error = new Error('La asignación del día está cerrada. Use reasignación en caliente.')
    error.status = 409
    throw error
  }
  const mapa = mapaDe(fecha)
  const existente = mapa.get(espacioFisicoId)
  const asignacion = existente ?? { id: contadorAsignacion++, subespecialidadId: null }
  asignacion.subespecialidadId = Number(subespecialidadId)
  mapa.set(espacioFisicoId, asignacion)

  return {
    id: asignacion.id,
    fecha,
    espacioFisicoId,
    subespecialidadId: asignacion.subespecialidadId,
    subespecialidadNombre: subDe(asignacion.subespecialidadId)?.nombre ?? null,
  }
}

export function eliminarAsignacionMock(id) {
  for (const [fecha, mapa] of asignacionesPorFecha.entries()) {
    for (const [espacioFisicoId, asignacion] of mapa.entries()) {
      if (asignacion.id === Number(id)) {
        if (diasCerrados.has(fecha)) {
          const error = new Error('La asignación del día está cerrada; no se puede quitar.')
          error.status = 409
          throw error
        }
        mapa.delete(espacioFisicoId)
        return { ok: true }
      }
    }
  }
  return { ok: true }
}

export function obtenerCoberturaMock(fecha) {
  const mapa = asignacionesPorFecha.get(fecha) ?? new Map()
  const asignadas = new Set([...mapa.values()].map((a) => a.subespecialidadId))
  return subespecialidadesMock
    .filter((sub) => !asignadas.has(sub.id))
    .map((sub) => ({ subespecialidadId: sub.id, subespecialidadNombre: sub.nombre }))
}

export function cerrarDiaMock(fecha) {
  diasCerrados.add(fecha)
  return { ok: true }
}

export function estaCerradoMock(fecha) {
  return diasCerrados.has(fecha)
}

export function duplicarAsignacionMock(fechaOrigen, fechaDestino) {
  const origen = asignacionesPorFecha.get(fechaOrigen)
  if (!origen) return 0
  if (diasCerrados.has(fechaDestino)) {
    const error = new Error('La asignación del día destino está cerrada.')
    error.status = 409
    throw error
  }
  const destino = mapaDe(fechaDestino)
  let copiadas = 0
  for (const [espacioId, asignacion] of origen.entries()) {
    const existente = destino.get(espacioId)
    if (existente) {
      existente.subespecialidadId = asignacion.subespecialidadId
    } else {
      destino.set(espacioId, { id: contadorAsignacion++, subespecialidadId: asignacion.subespecialidadId })
    }
    copiadas++
  }
  return copiadas
}

export function reasignarEnCalienteMock(id, nuevoEspacioFisicoId, motivo) {
  for (const [fecha, mapa] of asignacionesPorFecha.entries()) {
    for (const [espacioId, asignacion] of mapa.entries()) {
      if (asignacion.id === Number(id)) {
        mapa.delete(espacioId)
        mapa.set(nuevoEspacioFisicoId, asignacion)
        const item = itemDesdeAsignacion(fecha, nuevoEspacioFisicoId, asignacion)
        return { ...item, fecha, motivo: motivo ?? null }
      }
    }
  }
  return null
}

export function reiniciarJefeMock() {
  asignacionesPorFecha.clear()
  diasCerrados.clear()
  contadorAsignacion = 1
}
