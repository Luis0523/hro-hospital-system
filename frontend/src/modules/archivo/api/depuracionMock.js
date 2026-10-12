import { hoyIso } from '@/shared/utils/fecha'
import { expedientesMock, USUARIO_ARCHIVO_MOCK } from './mockData'

// Datos simulados del módulo de Depuración de expedientes (baja lógica).
// Imita el contrato confirmado del backend (migración V23): búsqueda por número,
// marca de depurado y bitácora del día. El estado mutable vive en memoria del
// módulo; es determinista (sin aleatoriedad) para que las pruebas sean estables.

const depuraciones = []
let contador = 0

function uuidExpedienteMock(id) {
  return `10000000-0000-4000-8000-${String(id).padStart(12, '0')}`
}

function buscarFixture(numero) {
  const buscado = String(numero ?? '').trim()
  return expedientesMock.find((expediente) => expediente.numeroExpediente === buscado) ?? null
}

// Resultado de la búsqueda previa a la baja. `depurado` marca si ya fue dado de
// baja (equivalente a `data.content[0].depurado = true` del backend real).
export function buscarExpedienteDepuracionMock(numero) {
  const expediente = buscarFixture(numero)
  if (!expediente) return null

  const yaDepurado = depuraciones.some(
    (registro) => registro.numeroExpediente === expediente.numeroExpediente,
  )

  return {
    expedienteId: uuidExpedienteMock(expediente.id),
    numeroExpediente: expediente.numeroExpediente,
    pacienteNombre: expediente.pacienteNombre,
    depurado: yaDepurado,
  }
}

// Marca un expediente como depurado. Lanza 404 si no existe y 409 si ya estaba.
export function crearDepuracionMock({ numeroExpediente, motivo } = {}) {
  const buscado = String(numeroExpediente ?? '').trim()
  const expediente = buscarFixture(buscado)

  if (!expediente) {
    const error = new Error('Expediente no encontrado')
    error.status = 404
    throw error
  }

  const existente = depuraciones.find((registro) => registro.numeroExpediente === buscado)
  if (existente) {
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
    fecha: hoyIso(),
  }
  depuraciones.unshift(registro)
  return registro
}

// Bitácora del día (o de la fecha indicada). Más recientes primero.
export function listarDepuracionesMock({ fecha } = {}) {
  const objetivo = fecha ?? hoyIso()
  return depuraciones.filter((registro) => registro.fecha === objetivo)
}

// Solo para pruebas: deja el estado mutable en limpio.
export function reiniciarDepuracionesMock() {
  depuraciones.length = 0
  contador = 0
}
