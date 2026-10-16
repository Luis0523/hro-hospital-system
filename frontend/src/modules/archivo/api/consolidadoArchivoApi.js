import client from '@/shared/api/client'
import { consolidadoDiarioMock, consolidadoMensualMock } from './consolidadoMock'
import { construirPdfSimple } from '../utils/pdfMock'

// Capa de datos del Consolidado de Archivo.
// Contrato confirmado en el backend (V23, ver
// `docs/instrucciones/depuracion-y-consolidado-archivo.md` §3.2 y §4.5):
//   GET /archivo/consolidado/diario?fecha=YYYY-MM-DD
//     -> { fecha, total, totalDepurados, porEspecialidad:[{especialidadId,especialidadNombre,total}] }
//   GET /archivo/consolidado/mensual?anio=YYYY&mes=M
//     -> { rango, informe:[{dia,hdc,hd}], detalle:[{dia,total,porEspecialidad}], totales }
const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'

export const USANDO_DATOS_MOCK = USE_MOCK

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

export async function obtenerConsolidadoDiario({ fecha } = {}) {
  if (USE_MOCK) return consolidadoDiarioMock({ fecha })

  return desenvolver(await client.get('/archivo/consolidado/diario', { params: { fecha } }))
}

export async function obtenerConsolidadoMensual({ anio, mes } = {}) {
  if (USE_MOCK) return consolidadoMensualMock({ anio, mes })

  return desenvolver(await client.get('/archivo/consolidado/mensual', { params: { anio, mes } }))
}

/**
 * Descarga el PDF "EXPEDIENTES ARCHIVADOS": todos los expedientes pasivos
 * (número <= umbral) de la fecha, con la plantilla institucional. Devuelve un Blob.
 */
export async function descargarArchivadosPdf({ fecha } = {}) {
  if (USE_MOCK) {
    return construirPdfSimple([
      'HOSPITAL REGIONAL DE OCCIDENTE',
      'EXPEDIENTES ARCHIVADOS',
      `Fecha: ${fecha ?? 'hoy'}`,
      '(Documento simulado en modo mock)',
    ])
  }
  return client.get('/carnets/archivados/pdf', { params: { fecha }, responseType: 'blob' })
}
