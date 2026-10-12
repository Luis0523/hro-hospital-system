import client from '@/shared/api/client'
import { buscarPacientePorExpediente } from './archivoApi'
import { mapearDepuracion } from './archivoMappers'
import {
  buscarExpedienteDepuracionMock,
  crearDepuracionMock,
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
// numeroExpediente, pacienteNombre, depurado }` o `null` si no existe. El nombre
// del paciente se resuelve por el endpoint de pacientes (el buscador de
// expediente no lo incluye).
export async function buscarExpedienteParaDepurar(numero) {
  const buscado = String(numero ?? '').trim()
  if (!buscado) return null

  if (USE_MOCK) return buscarExpedienteDepuracionMock(buscado)

  const pagina = desenvolver(
    await client.get('/expedientes/buscar', { params: { codigo: buscado } }),
  )
  const expediente = pagina?.content?.[0] ?? null
  if (!expediente) return null

  let pacienteNombre = null
  try {
    const paciente = await buscarPacientePorExpediente(expediente.numeroExpediente ?? buscado)
    pacienteNombre = paciente?.nombreCompleto ?? null
  } catch {
    // El nombre es informativo: si falla, la búsqueda sigue siendo válida.
    pacienteNombre = null
  }

  return {
    expedienteId: expediente.id ?? null,
    numeroExpediente: expediente.numeroExpediente ?? buscado,
    pacienteNombre,
    depurado: Boolean(expediente.depurado),
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

// Bitácora de depuraciones del día (fecha por defecto: hoy).
export async function listarDepuraciones({ fecha } = {}) {
  if (USE_MOCK) return listarDepuracionesMock({ fecha }).map(mapearDepuracion)

  const lista = desenvolver(await client.get('/expedientes/depuracion', { params: { fecha } }))
  return (lista ?? []).map(mapearDepuracion)
}
