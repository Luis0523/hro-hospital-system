import client from '@/shared/api/client'
import { mapearMedico, mapearPaciente, mapearSubespecialidad } from './archivoMappers'
import {
  avanzarEstadoMock,
  buscarExpedientePorCodigoMock,
  clinicasArchivoMock,
  crearExpedienteMock,
  expedientesMock,
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

  // PENDIENTE BACKEND (contrato sin confirmar):
  // "Clínica" NO existe como recurso en el backend. En el entorno desplegado
  // GET /clinicas responde 500 ("No static resource clinicas"). No se remapea
  // silenciosamente a /subespecialidades porque no está confirmado que
  // "clínica" y "subespecialidad" sean el mismo concepto de negocio.
  return pendienteBackend('listar clínicas (contrato sin confirmar)')
}

export async function listarMedicos() {
  if (USE_MOCK) return medicosArchivoMock
  return desenvolver(await client.get('/medicos')).map(mapearMedico)
}

// Catálogo temporal usado SOLO por el modo mock de esta función auxiliar.
// La función no está conectada a la interfaz todavía.
const subespecialidadesArchivoMock = [
  {
    id: 1,
    nombre: 'Medicina General',
    especialidadId: 1,
    especialidadNombre: 'Medicina Interna',
    activo: true,
  },
  {
    id: 2,
    nombre: 'Cardiología Clínica',
    especialidadId: 6,
    especialidadNombre: 'Cardiología',
    activo: true,
  },
  {
    id: 3,
    nombre: 'Pediatría General',
    especialidadId: 2,
    especialidadNombre: 'Pediatría',
    activo: true,
  },
]

// Función auxiliar de integración real. No sustituye a listarClinicas ni está
// conectada a la UI: sirve para la futura integración con el catálogo real.
export async function listarSubespecialidades() {
  if (USE_MOCK) return subespecialidadesArchivoMock
  return desenvolver(await client.get('/subespecialidades')).map(mapearSubespecialidad)
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
  // NOTA: NO se conecta con POST/PUT /pacientes. El campo
  // paciente.numeroExpediente NO equivale a una entidad de expediente físico
  // con ubicación, estado e historial.
  return pendienteBackend('crear el expediente físico')
}

// Los siguientes pacientes se construyen a partir de expedientesMock para que
// las funciones auxiliares tengan una respuesta coherente en modo mock.
function pacienteDesdeExpedienteMock(expediente) {
  if (!expediente) return null
  return {
    id: expediente.pacienteId ?? null,
    dpi: expediente.pacienteDpi ?? null,
    nombres: expediente.pacienteNombre ?? '',
    apellidos: '',
    nombreCompleto: expediente.pacienteNombre ?? '',
    numeroExpediente: expediente.numeroExpediente ?? null,
    fechaNacimiento: null,
    sexo: null,
    telefono: null,
    direccion: null,
  }
}

// Funciones auxiliares reales, todavía NO conectadas a la interfaz.
export async function buscarPacientePorExpediente(numeroExpediente) {
  if (USE_MOCK) {
    return pacienteDesdeExpedienteMock(
      expedientesMock.find((expediente) => expediente.numeroExpediente === numeroExpediente),
    )
  }
  return mapearPaciente(desenvolver(await client.get(`/pacientes/expediente/${numeroExpediente}`)))
}

export async function buscarPacientePorDpi(dpi) {
  if (USE_MOCK) {
    return pacienteDesdeExpedienteMock(
      expedientesMock.find((expediente) => expediente.pacienteDpi === dpi),
    )
  }
  return mapearPaciente(desenvolver(await client.get(`/pacientes/dpi/${dpi}`)))
}
