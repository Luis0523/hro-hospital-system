import { estadoInicialMock } from './mockData'

export const CAMPOS_PUBLICOS = [
  'asignacionDiariaEspacioId',
  'espacioNumero',
  'nivel',
  'subespecialidadNombre',
  'turnoActual',
  'turnoSiguiente',
  'ultimaActualizacion',
]

export function estaEnModoMock(env = import.meta.env) {
  return env.MODE === 'test' || env.VITE_USE_MOCK === 'true'
}

export function parsearAsignacionesFiltradas(valor) {
  const crudo = valor === undefined ? import.meta.env.VITE_TABLERO_ASIGNACIONES : valor
  if (crudo === null || crudo === undefined) return []

  const ids = String(crudo)
    .split(',')
    .map((parte) => Number(parte.trim()))
    .filter((numero) => Number.isInteger(numero) && numero > 0)

  return Array.from(new Set(ids))
}

export const ASIGNACIONES_PERMITIDAS = parsearAsignacionesFiltradas()

export function estaPermitida(asignacionDiariaEspacioId, permitidas = ASIGNACIONES_PERMITIDAS) {
  if (!permitidas || permitidas.length === 0) return true
  return permitidas.includes(Number(asignacionDiariaEspacioId))
}

export function filtrarAsignaciones(asignaciones = [], permitidas = ASIGNACIONES_PERMITIDAS) {
  if (!permitidas || permitidas.length === 0) return asignaciones
  return asignaciones.filter((asignacion) =>
    estaPermitida(asignacion.asignacionDiariaEspacioId, permitidas),
  )
}

function normalizarIdAsignacion(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

function normalizarNumeroTurno(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero <= 0) return null
  return Math.trunc(numero)
}

function normalizarTexto(valor) {
  if (valor === null || valor === undefined) return null
  const texto = String(valor).trim()
  return texto === '' ? null : texto
}

function normalizarNivel(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = Number(valor)
  return Number.isFinite(numero) ? Math.trunc(numero) : null
}

function normalizarFecha(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString()
}

export function normalizarEstadoTablero(payload) {
  if (!payload || typeof payload !== 'object') return null

  const estado = {
    asignacionDiariaEspacioId: normalizarIdAsignacion(payload.asignacionDiariaEspacioId),
    espacioNumero: normalizarTexto(payload.espacioNumero),
    nivel: normalizarNivel(payload.nivel),
    subespecialidadNombre: normalizarTexto(payload.subespecialidadNombre),
    turnoActual: normalizarNumeroTurno(payload.turnoActual),
    turnoSiguiente: normalizarNumeroTurno(payload.turnoSiguiente),
    ultimaActualizacion: normalizarFecha(payload.ultimaActualizacion),
  }

  if (estado.asignacionDiariaEspacioId === null) return null
  return estado
}

export function normalizarListaAsignaciones(payload) {
  const lista = Array.isArray(payload) ? payload : (payload?.asignaciones ?? payload?.content ?? [])
  if (!Array.isArray(lista)) return []
  return lista.map(normalizarEstadoTablero).filter(Boolean)
}

export function ordenarAsignaciones(asignaciones = []) {
  return [...asignaciones].sort((a, b) => {
    const nivelA = a.nivel ?? Number.MAX_SAFE_INTEGER
    const nivelB = b.nivel ?? Number.MAX_SAFE_INTEGER
    if (nivelA !== nivelB) return nivelA - nivelB
    return String(a.espacioNumero ?? '').localeCompare(String(b.espacioNumero ?? ''), 'es', {
      numeric: true,
    })
  })
}

export function fusionarAsignacion(asignaciones = [], nueva) {
  const normalizada = normalizarEstadoTablero(nueva)
  if (!normalizada) return asignaciones

  const indice = asignaciones.findIndex(
    (asignacion) => asignacion.asignacionDiariaEspacioId === normalizada.asignacionDiariaEspacioId,
  )

  if (indice === -1) {
    return ordenarAsignaciones([...asignaciones, normalizada])
  }

  const copia = asignaciones.slice()
  copia[indice] = { ...copia[indice], ...normalizada }
  return ordenarAsignaciones(copia)
}

export async function obtenerEstadoInicialTablero({ permitidas = ASIGNACIONES_PERMITIDAS } = {}) {
  if (estaEnModoMock()) {
    const asignaciones = ordenarAsignaciones(normalizarListaAsignaciones(estadoInicialMock))
    return filtrarAsignaciones(asignaciones, permitidas)
  }

  // TODO(backend): cuando exista el snapshot REST del tablero, consumirlo aquí.
  // No se inventa una URL porque el backend todavía no expone este recurso.
  const error = new Error('El backend todavía no expone el estado inicial del tablero.')
  error.code = 'SNAPSHOT_NO_DISPONIBLE'
  throw error
}
