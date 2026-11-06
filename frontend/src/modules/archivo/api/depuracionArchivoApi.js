import client from '@/shared/api/client'
import { buscarPacientePorExpediente } from './archivoApi'
import { mapearDepuracion } from './archivoMappers'
import { hoyIsoGuatemala } from '../utils/fechaDepuracionGuatemala'
import {
  buscarExpedienteDepuracionMock,
  crearDepuracionManualMock,
  crearDepuracionMock,
  deshacerUltimaDepuracionMock,
  eliminarDepuracionMock,
  listarDepuracionesEnRangoMock,
  listarDepuracionesMock,
} from './depuracionMock'

// Capa de datos del módulo de Depuración de expedientes (archivo hermano).
// Mantiene el patrón del repositorio (USE_MOCK / desenvolver) con helpers propios.
//
// Contrato confirmado en el backend (migración V23, documentado en
// `docs/instrucciones/depuracion-y-consolidado-archivo.md` §2.3):
//   POST /expedientes/depuracion { numeroExpediente, motivo? }  -> 201
//   GET  /expedientes/depuracion?fecha=YYYY-MM-DD               -> 200 [ ... ]
//   GET  /expedientes/buscar?codigo={exp} -> content[0].depurado = true
const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'

export const USANDO_DATOS_MOCK = USE_MOCK

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

// Busca un expediente por número para la baja. Devuelve `{ expedienteId,
// numeroExpediente, pacienteNombre, depurado }` o `null` si no existe.
// El nombre del paciente se consulta en el API del hospital
// (`/integracion/hro/paciente/{n}`); el estado `depurado` y el id local se
// obtienen del buscador de expedientes de Archivo.
async function consultarPacienteHospital(numero) {
  try {
    const paciente = desenvolver(
      await client.get(`/integracion/hro/paciente/${encodeURIComponent(numero)}`),
    )
    return paciente?.nombreCompleto ? paciente : null
  } catch (fallo) {
    if (fallo?.status === 404) return null
    throw fallo
  }
}

async function consultarExpedienteLocal(numero) {
  try {
    const pagina = desenvolver(
      await client.get('/expedientes/buscar', { params: { codigo: numero } }),
    )
    return pagina?.content?.[0] ?? null
  } catch (fallo) {
    if (fallo?.status === 404) return null
    throw fallo
  }
}

export async function buscarExpedienteParaDepurar(numero) {
  const buscado = String(numero ?? '').trim()
  if (!buscado) return null

  if (USE_MOCK) return buscarExpedienteDepuracionMock(buscado)

  let pacienteHospital = null
  let errorHospital = null
  try {
    pacienteHospital = await consultarPacienteHospital(buscado)
  } catch (fallo) {
    errorHospital = fallo
  }

  let expedienteLocal = null
  let errorLocal = null
  try {
    expedienteLocal = await consultarExpedienteLocal(buscado)
  } catch (fallo) {
    errorLocal = fallo
  }

  if (!pacienteHospital && !expedienteLocal) {
    if (errorHospital) throw errorHospital
    if (errorLocal) throw errorLocal
    return null
  }

  let pacienteNombre = pacienteHospital?.nombreCompleto ?? null
  if (!pacienteNombre && expedienteLocal?.numeroExpediente) {
    try {
      const paciente = await buscarPacientePorExpediente(expedienteLocal.numeroExpediente)
      pacienteNombre = paciente?.nombreCompleto ?? null
    } catch {
      pacienteNombre = null
    }
  }

  return {
    expedienteId: expedienteLocal?.id ?? null,
    numeroExpediente:
      expedienteLocal?.numeroExpediente ?? pacienteHospital?.numeroExpediente ?? buscado,
    pacienteNombre,
    depurado: Boolean(expedienteLocal?.depurado),
  }
}

// Marca el expediente como depurado (baja lógica). 404 si no existe,
// 409 si ya estaba depurado.
export async function marcarDepurado({ numeroExpediente, motivo } = {}) {
  if (USE_MOCK) return mapearDepuracion(crearDepuracionMock({ numeroExpediente, motivo }))

  const datos = desenvolver(
    await client.post('/expedientes/depuracion', { numeroExpediente, motivo }),
  )
  return mapearDepuracion(datos)
}

// Registro manual de la baja cuando el API del hospital no responde o no
// reconoce el expediente. No consulta ni modifica el hospital.
export async function registrarDepuracionManual({
  numeroExpediente,
  pacienteNombre,
  motivo,
} = {}) {
  if (USE_MOCK) {
    return mapearDepuracion(
      crearDepuracionManualMock({ numeroExpediente, pacienteNombre, motivo }),
    )
  }

  const datos = desenvolver(
    await client.post('/expedientes/depuracion/manual', {
      numeroExpediente,
      pacienteNombre,
      motivo,
    }),
  )
  return mapearDepuracion(datos)
}

// Elimina el registro de la bitácora. Si la depuración estaba ligada a un
// expediente local, el backend revierte la baja lógica.
export async function eliminarDepuracion(id) {
  if (USE_MOCK) {
    eliminarDepuracionMock(id)
    return
  }

  await client.delete(`/expedientes/depuracion/${encodeURIComponent(id)}`)
}

// Bitácora de depuraciones del día operativo del hospital (fecha por defecto:
// hoy en America/Guatemala).
export async function listarDepuraciones({ fecha } = {}) {
  const dia = fecha ?? hoyIsoGuatemala()

  if (USE_MOCK) return listarDepuracionesMock({ fecha: dia }).map(mapearDepuracion)

  const lista = desenvolver(await client.get('/expedientes/depuracion', { params: { fecha: dia } }))
  return (lista ?? []).map(mapearDepuracion)
}

export async function listarDepuracionesEnRango({ dias = [] } = {}) {
  if (!USE_MOCK) {
    const error = new Error('La consulta de rango optimizada solo está disponible en modo mock.')
    error.codigo = 'solo_mock'
    throw error
  }

  return listarDepuracionesEnRangoMock({ dias }).map(mapearDepuracion)
}

export async function deshacerUltimaDepuracion() {
  if (!USE_MOCK) {
    const error = new Error('La reversión simulada no está disponible en modo real.')
    error.codigo = 'solo_mock'
    throw error
  }

  return mapearDepuracion(deshacerUltimaDepuracionMock())
}
