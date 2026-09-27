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

/** fecha -> Array<{ id, espacioFisicoId, subespecialidadId }> (una sala puede tener varias) */
const asignacionesPorFecha = new Map()
const diasCerrados = new Set()
let contadorAsignacion = 1

function listaDe(fecha) {
  if (!asignacionesPorFecha.has(fecha)) asignacionesPorFecha.set(fecha, [])
  return asignacionesPorFecha.get(fecha)
}

function subDe(id) {
  return subespecialidadesMock.find((sub) => sub.id === Number(id)) ?? null
}

function espacioDe(id) {
  return espaciosMock.find((espacio) => espacio.id === id) ?? null
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
  const fila = listaDe(fecha)
  return espaciosMock
    .filter((espacio) => !nivel || Number(espacio.nivel) === Number(nivel))
    .map((espacio) => {
      const asignaciones = fila
        .filter((a) => a.espacioFisicoId === espacio.id)
        .map((a) => {
          const sub = subDe(a.subespecialidadId)
          return {
            asignacionId: a.id,
            subespecialidadId: sub?.id ?? null,
            subespecialidadNombre: sub?.nombre ?? null,
            especialidadId: sub?.especialidadId ?? null,
            especialidadNombre: sub?.especialidadNombre ?? null,
          }
        })
      return {
        espacioFisicoId: espacio.id,
        numero: espacio.numero,
        nivel: espacio.nivel,
        capacidadCamillas: espacio.capacidadCamillas,
        asignaciones,
      }
    })
}

export function guardarAsignacionMock({ espacioFisicoId, subespecialidadId, fecha }) {
  if (diasCerrados.has(fecha)) {
    const error = new Error('La asignación del día está cerrada. Use reasignación en caliente.')
    error.status = 409
    throw error
  }
  const fila = listaDe(fecha)
  const subId = Number(subespecialidadId)
  const existente = fila.find(
    (a) => a.espacioFisicoId === espacioFisicoId && a.subespecialidadId === subId,
  )
  if (existente) {
    return { id: existente.id, fecha, espacioFisicoId, subespecialidadId: subId }
  }
  const nueva = { id: contadorAsignacion++, espacioFisicoId, subespecialidadId: subId }
  fila.push(nueva)
  return { id: nueva.id, fecha, espacioFisicoId, subespecialidadId: subId }
}

export function eliminarAsignacionMock(id) {
  for (const [fecha, fila] of asignacionesPorFecha.entries()) {
    const indice = fila.findIndex((a) => a.id === Number(id))
    if (indice !== -1) {
      if (diasCerrados.has(fecha)) {
        const error = new Error('La asignación del día está cerrada; no se puede quitar.')
        error.status = 409
        throw error
      }
      fila.splice(indice, 1)
      return { ok: true }
    }
  }
  return { ok: true }
}

export function obtenerCoberturaMock(fecha) {
  const asignadas = new Set(listaDe(fecha).map((a) => a.subespecialidadId))
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
  if (diasCerrados.has(fechaDestino)) {
    const error = new Error('La asignación del día destino está cerrada.')
    error.status = 409
    throw error
  }
  const origen = asignacionesPorFecha.get(fechaOrigen) ?? []
  const destino = listaDe(fechaDestino)
  let copiadas = 0
  for (const a of origen) {
    const yaEsta = destino.some(
      (d) => d.espacioFisicoId === a.espacioFisicoId && d.subespecialidadId === a.subespecialidadId,
    )
    if (yaEsta) continue
    destino.push({ id: contadorAsignacion++, espacioFisicoId: a.espacioFisicoId, subespecialidadId: a.subespecialidadId })
    copiadas++
  }
  return copiadas
}

export function reasignarEnCalienteMock(id, nuevoEspacioFisicoId, motivo) {
  for (const [fecha, fila] of asignacionesPorFecha.entries()) {
    const asignacion = fila.find((a) => a.id === Number(id))
    if (!asignacion) continue

    const duplicada = fila.some(
      (a) =>
        a.id !== asignacion.id &&
        a.espacioFisicoId === nuevoEspacioFisicoId &&
        a.subespecialidadId === asignacion.subespecialidadId,
    )
    if (duplicada) {
      const error = new Error('Esa sala ya tiene la misma subespecialidad asignada.')
      error.status = 409
      throw error
    }

    asignacion.espacioFisicoId = nuevoEspacioFisicoId
    const espacio = espacioDe(nuevoEspacioFisicoId)
    const sub = subDe(asignacion.subespecialidadId)
    return {
      id: asignacion.id,
      fecha,
      espacioFisicoId: nuevoEspacioFisicoId,
      espacioNumero: espacio?.numero ?? null,
      subespecialidadId: sub?.id ?? null,
      subespecialidadNombre: sub?.nombre ?? null,
      motivo: motivo ?? null,
    }
  }
  return null
}

export function reiniciarJefeMock() {
  asignacionesPorFecha.clear()
  diasCerrados.clear()
  contadorAsignacion = 1
}
