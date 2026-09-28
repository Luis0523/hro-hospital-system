import client from '@/shared/api/client'
import {
  mapearExpedienteBusqueda,
  mapearJornadaArchivo,
  mapearMedico,
  mapearPaciente,
  mapearSubespecialidad,
} from './archivoMappers'
import {
  avanzarEstadoMock,
  buscarExpedientePorCodigoMock,
  clinicasArchivoMock,
  crearActaRecepcionMock,
  crearExpedienteMock,
  expedientesMock,
  jornadaArchivoMock,
  listarExpedientesMock,
  marcarNoLocalizadoMock,
  medicosArchivoMock,
  obtenerActaRecepcionMock,
  obtenerExpedienteMock,
  resumenArchivoMock,
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
    nombre: 'Pediatría General',
    especialidadId: 2,
    especialidadNombre: 'Pediatría',
    activo: true,
  },
  {
    id: 4,
    nombre: 'Cardiología Clínica',
    especialidadId: 6,
    especialidadNombre: 'Cardiología',
    activo: true,
  },
]

// Función auxiliar de integración real. No sustituye a listarClinicas ni está
// conectada a la UI: sirve para la futura integración con el catálogo real.
export async function listarSubespecialidades() {
  if (USE_MOCK) return subespecialidadesArchivoMock
  return desenvolver(await client.get('/subespecialidades')).map(mapearSubespecialidad)
}

export async function listarExpedientes({ fecha, subespecialidadId } = {}) {
  if (USE_MOCK) return listarExpedientesMock({ fecha, subespecialidadId })

  // La lista operativa real se toma de GET /expedientes/jornada
  // (ver listarJornadaArchivo). Se conserva por compatibilidad histórica.
  return pendienteBackend('listar expedientes')
}

// Jornada diaria real: GET /expedientes/jornada?fecha=&subespecialidadId=
// -> ApiResponse<List<ExpedienteJornadaDTO>>. En mock se usa una jornada fiel
// al DTO. No hace fallback silencioso: si el backend falla en modo real, el
// error se propaga.
export async function listarJornadaArchivo({ fecha, subespecialidadId } = {}) {
  if (USE_MOCK) {
    return jornadaArchivoMock({ fecha, subespecialidadId }).map(mapearJornadaArchivo)
  }

  const datos = desenvolver(
    await client.get('/expedientes/jornada', { params: { fecha, subespecialidadId } }),
  )
  return (datos ?? []).map(mapearJornadaArchivo)
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

  // GET /expedientes/buscar?codigo=  -> ApiResponse<Page<ExpedienteResponseDTO>>
  // El backend acepta UUID (QR) o número de expediente (código de barras) y
  // responde 404 si el código no existe.
  const pagina = desenvolver(await client.get('/expedientes/buscar', { params: { codigo } }))
  const contenido = pagina?.content ?? []
  return mapearExpedienteBusqueda(contenido[0] ?? null)
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

// ---------------------------------------------------------------------------
// Resumen operativo diario y actas de recepción (SCRUM-96).
// El backend es la fuente de verdad; estos métodos solo consumen su contrato.
// Los endpoints PDF devuelven binario (application/pdf) sin envoltura
// ApiResponse, por eso se solicitan con responseType: 'blob'.
// ---------------------------------------------------------------------------
function pdfMock(contenido) {
  return new Blob([contenido], { type: 'application/pdf' })
}

export async function obtenerResumenArchivo({ fecha } = {}) {
  if (USE_MOCK) return resumenArchivoMock(fecha)
  return desenvolver(await client.get('/archivo/resumen', { params: { fecha } }))
}

export async function obtenerResumenArchivoPdf({ fecha } = {}) {
  if (USE_MOCK) return pdfMock('%PDF-1.4 resumen mock')
  return client.get('/archivo/resumen/pdf', { params: { fecha }, responseType: 'blob' })
}

export async function crearActaRecepcion(datos) {
  if (USE_MOCK) return crearActaRecepcionMock(datos)
  return desenvolver(await client.post('/actas-recepcion', datos))
}

export async function obtenerActaRecepcion(id) {
  if (USE_MOCK) return obtenerActaRecepcionMock(id)
  return desenvolver(await client.get(`/actas-recepcion/${id}`))
}

export async function obtenerActaRecepcionPdf(id) {
  if (USE_MOCK) return pdfMock(`%PDF-1.4 acta ${id} mock`)
  return client.get(`/actas-recepcion/${id}/pdf`, { responseType: 'blob' })
}
