import client from '@/shared/api/client'
import { hoyIso } from '@/shared/utils/fecha'
import { estadoInicialMock } from './mockData'

export const CAMPOS_PUBLICOS = [
  'asignacionDiariaEspacioId',
  'espacioNumero',
  'nivel',
  'subespecialidadNombre',
  'turnoActual',
  'turnoSiguiente',
  'ultimaActualizacion',
  'intentosLlamado',
  'tipoEvento',
]

export const TIPOS_EVENTO = ['LLAMADO', 'ACTUALIZACION']

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

// `null` = sin filtro (mostrar todas). `[]` = filtro vacío (no mostrar ninguna).
function permitidasDesdeEnv(valor) {
  const lista = parsearAsignacionesFiltradas(valor)
  return lista.length > 0 ? lista : null
}

export const ASIGNACIONES_PERMITIDAS = permitidasDesdeEnv(import.meta.env.VITE_TABLERO_ASIGNACIONES)

export function estaPermitida(asignacionDiariaEspacioId, permitidas = ASIGNACIONES_PERMITIDAS) {
  if (permitidas == null) return true
  return permitidas.includes(Number(asignacionDiariaEspacioId))
}

export function filtrarAsignaciones(asignaciones = [], permitidas = ASIGNACIONES_PERMITIDAS) {
  if (permitidas == null) return asignaciones
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

function normalizarIntentosLlamado(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero < 0) return null
  return Math.trunc(numero)
}

function normalizarTipoEvento(valor) {
  if (valor === null || valor === undefined) return null
  const texto = String(valor).trim().toUpperCase()
  return TIPOS_EVENTO.includes(texto) ? texto : null
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
    intentosLlamado: normalizarIntentosLlamado(payload.intentosLlamado),
    tipoEvento: normalizarTipoEvento(payload.tipoEvento),
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

// El DTO REST (AsignacionDiariaResponseDTO) conoce la asignación pero NO los
// correlativos del contador. Por eso turnoActual/turnoSiguiente/ultimaActualizacion
// quedan en null hasta que llegue un evento WebSocket.
export function mapearAsignacionDiaria(dto = {}) {
  return {
    asignacionDiariaEspacioId: dto?.id ?? null,
    espacioNumero: dto?.espacioNumero ?? null,
    nivel: dto?.nivel ?? null,
    subespecialidadNombre: dto?.subespecialidadNombre ?? null,
    turnoActual: null,
    turnoSiguiente: null,
    ultimaActualizacion: null,
    intentosLlamado: null,
    tipoEvento: null,
  }
}

function extraerListaRespuesta(cuerpo) {
  if (Array.isArray(cuerpo)) return cuerpo
  if (cuerpo && Array.isArray(cuerpo.data)) return cuerpo.data
  return null
}

export async function obtenerEstadoInicialTablero({
  permitidas = ASIGNACIONES_PERMITIDAS,
  cliente = client,
  fecha = hoyIso(),
  modoMock = estaEnModoMock(),
} = {}) {
  if (modoMock) {
    const asignaciones = ordenarAsignaciones(normalizarListaAsignaciones(estadoInicialMock))
    return filtrarAsignaciones(asignaciones, permitidas)
  }

  const cuerpo = await cliente.get('/asignaciones-diarias', { params: { fecha } })
  const lista = extraerListaRespuesta(cuerpo)

  if (lista === null) {
    const error = new Error(
      'Respuesta inesperada del servidor al cargar las asignaciones del tablero.',
    )
    error.code = 'RESPUESTA_INESPERADA'
    throw error
  }

  const asignaciones = ordenarAsignaciones(
    normalizarListaAsignaciones(lista.map(mapearAsignacionDiaria)),
  )
  return filtrarAsignaciones(asignaciones, permitidas)
}
