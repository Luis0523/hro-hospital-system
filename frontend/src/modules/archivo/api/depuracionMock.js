import { hoyIsoGuatemala } from '../utils/fechaDepuracionGuatemala'
import { crearHistoricoDepuracionMock, expedientesDepuracionMock } from './depuracionFixtures'
import { expedientesMock, USUARIO_ARCHIVO_MOCK } from './mockData'

const depuraciones = []
let historico = crearHistoricoDepuracionMock()
let contador = 0
let ultimaDepuracionId = null

function uuidExpedienteMock(id) {
  return `10000000-0000-4000-8000-${String(id).padStart(12, '0')}`
}

function buscarFixture(numero) {
  const buscado = String(numero ?? '').trim()
  return (
    expedientesDepuracionMock.find((expediente) => expediente.numeroExpediente === buscado) ??
    historico.expedientes.find((expediente) => expediente.numeroExpediente === buscado) ??
    expedientesMock.find((expediente) => expediente.numeroExpediente === buscado) ??
    null
  )
}

function buscarDepuracionExistente(numero) {
  const buscado = String(numero ?? '').trim()
  return (
    depuraciones.find((registro) => registro.numeroExpediente === buscado && !registro.revertida) ??
    historico.depuraciones.find((registro) => registro.numeroExpediente === buscado) ??
    null
  )
}

export function buscarExpedienteDepuracionMock(numero) {
  const expediente = buscarFixture(numero)
  if (!expediente) return null

  return {
    expedienteId: uuidExpedienteMock(expediente.id),
    numeroExpediente: expediente.numeroExpediente,
    pacienteNombre: expediente.pacienteNombre,
    depurado: Boolean(buscarDepuracionExistente(expediente.numeroExpediente)),
  }
}

export function crearDepuracionMock({ numeroExpediente, motivo } = {}) {
  const buscado = String(numeroExpediente ?? '').trim()
  const expediente = buscarFixture(buscado)

  if (!expediente) {
    const error = new Error('Expediente no encontrado')
    error.status = 404
    throw error
  }

  if (buscarDepuracionExistente(buscado)) {
    const error = new Error('El expediente ya está depurado')
    error.status = 409
    throw error
  }

  contador += 1
  const registro = {
    id: `dep-${contador}`,
    expedienteId: uuidExpedienteMock(expediente.id),
    numeroExpediente: expediente.numeroExpediente,
    pacienteNombre: expediente.pacienteNombre,
    motivo: motivo ?? null,
    usuarioNombre: USUARIO_ARCHIVO_MOCK,
    depuradoEn: new Date().toISOString(),
    fecha: hoyIsoGuatemala(),
    revertida: false,
  }
  depuraciones.unshift(registro)
  ultimaDepuracionId = registro.id
  return registro
}

export function crearDepuracionManualMock({ numeroExpediente, pacienteNombre, motivo } = {}) {
  const buscado = String(numeroExpediente ?? '').trim()
  const nombre = String(pacienteNombre ?? '').trim()

  if (!buscado || !nombre) {
    const error = new Error('Complete el número de expediente y el nombre del paciente.')
    error.status = 400
    throw error
  }

  if (buscarDepuracionExistente(buscado)) {
    const error = new Error('El expediente ya está depurado')
    error.status = 409
    throw error
  }

  const expediente = buscarFixture(buscado)
  contador += 1
  const registro = {
    id: `dep-${contador}`,
    expedienteId: expediente ? uuidExpedienteMock(expediente.id) : null,
    numeroExpediente: buscado,
    pacienteNombre: nombre,
    motivo: motivo ?? null,
    usuarioNombre: USUARIO_ARCHIVO_MOCK,
    depuradoEn: new Date().toISOString(),
    fecha: hoyIsoGuatemala(),
    revertida: false,
    manual: true,
  }
  depuraciones.unshift(registro)
  ultimaDepuracionId = registro.id
  return registro
}

export function eliminarDepuracionMock(id) {
  const indice = depuraciones.findIndex((registro) => registro.id === id)
  if (indice >= 0) {
    depuraciones.splice(indice, 1)
    if (ultimaDepuracionId === id) ultimaDepuracionId = null
    return
  }

  const indiceHistorico = historico.depuraciones.findIndex((registro) => registro.id === id)
  if (indiceHistorico >= 0) {
    historico.depuraciones.splice(indiceHistorico, 1)
    return
  }

  const error = new Error('Depuración no encontrada')
  error.status = 404
  throw error
}

export function listarDepuracionesMock({ fecha } = {}) {
  const objetivo = fecha ?? hoyIsoGuatemala()

  return [...historico.depuraciones, ...depuraciones]
    .filter((registro) => registro.fecha === objetivo && !registro.revertida)
    .sort((a, b) => Date.parse(b.depuradoEn) - Date.parse(a.depuradoEn))
}

export function listarDepuracionesEnRangoMock({ dias = [] } = {}) {
  const fechas = new Set(Array.isArray(dias) ? dias : [])

  return [...historico.depuraciones, ...depuraciones]
    .filter((registro) => fechas.has(registro.fecha) && !registro.revertida)
    .sort((a, b) => Date.parse(b.depuradoEn) - Date.parse(a.depuradoEn))
}

export function obtenerUltimaDepuracionReversibleMock() {
  if (!ultimaDepuracionId) return null
  return (
    depuraciones.find((registro) => registro.id === ultimaDepuracionId && !registro.revertida) ??
    null
  )
}

export function deshacerUltimaDepuracionMock() {
  const registro = obtenerUltimaDepuracionReversibleMock()
  if (!registro) {
    const error = new Error('No hay una depuración reversible en esta sesión.')
    error.status = 409
    throw error
  }

  registro.revertida = true
  registro.revertidaEn = new Date().toISOString()
  ultimaDepuracionId = null
  return registro
}

export function reiniciarDepuracionesMock({ hoy } = {}) {
  depuraciones.length = 0
  contador = 0
  ultimaDepuracionId = null
  historico = crearHistoricoDepuracionMock(hoy ?? hoyIsoGuatemala())
}

export function obtenerHistoricoDepuracionMock() {
  return historico
}
