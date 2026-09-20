import client from '@/shared/api/client'
import {
  avanzarEstadoMock,
  buscarExpedientePorCodigoMock,
  clinicasArchivoMock,
  crearExpedienteMock,
  listarExpedientesMock,
  marcarNoLocalizadoMock,
  medicosArchivoMock,
  obtenerExpedienteMock,
} from './mockData'

const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

function pendienteBackend(operacion) {
  const error = new Error(
    `El endpoint de ${operacion} todavía no está disponible en el backend. Active VITE_USE_MOCK=true para trabajar con datos de prueba.`,
  )
  error.status = 501
  throw error
}

export async function listarClinicas() {
  if (USE_MOCK) return clinicasArchivoMock
  return desenvolver(await client.get('/clinicas'))
}

export async function listarMedicos() {
  if (USE_MOCK) return medicosArchivoMock
  return desenvolver(await client.get('/medicos'))
}

export async function listarExpedientes({ fecha, clinicaId, medicoId } = {}) {
  if (USE_MOCK) return listarExpedientesMock({ fecha, clinicaId, medicoId })

  // PENDIENTE BACKEND (contrato propuesto, sin confirmar):
  // GET /expedientes?fecha=YYYY-MM-DD&clinicaId=&medicoId=
  //   -> [{ id, citaId, pacienteId, pacienteNombre, numeroExpediente, ubicacion,
  //         clinicaId, clinicaNombre, medicoId, medicoNombre, fechaCita,
  //         horaEstimada, estado, expedienteNuevo, historial[] }]
  return pendienteBackend('listar expedientes')
}

export async function obtenerExpediente(id) {
  if (USE_MOCK) return obtenerExpedienteMock(id)

  // PENDIENTE BACKEND (contrato propuesto, sin confirmar):
  // GET /expedientes/{id}
  return pendienteBackend('obtener el detalle del expediente')
}

export async function avanzarEstado(id) {
  if (USE_MOCK) return avanzarEstadoMock(id)

  // PENDIENTE BACKEND (contrato propuesto, sin confirmar):
  // POST /expedientes/{id}/avanzar  -> el backend calcula y devuelve el siguiente estado.
  return pendienteBackend('avanzar el estado del expediente')
}

export async function marcarNoLocalizado(id) {
  if (USE_MOCK) return marcarNoLocalizadoMock(id)

  // PENDIENTE BACKEND (contrato propuesto, sin confirmar):
  // POST /expedientes/{id}/no-localizado
  return pendienteBackend('marcar el expediente como no localizado')
}

export async function buscarExpedientePorCodigo(codigo) {
  if (USE_MOCK) return buscarExpedientePorCodigoMock(codigo)

  // PENDIENTE BACKEND (contrato propuesto, sin confirmar):
  // GET /expedientes/buscar?codigo=...  -> Expediente | 404
  return pendienteBackend('buscar el expediente por código')
}

export async function crearExpediente(pacienteId) {
  if (USE_MOCK) return crearExpedienteMock(pacienteId)

  // PENDIENTE BACKEND (contrato propuesto, sin confirmar):
  // POST /expedientes  { pacienteId }
  return pendienteBackend('crear el expediente físico')
}
