import client from '@/shared/api/client'
import { mapearEstadisticasArchivo, mapearEventoMovimiento } from './archivoMappers'
import { estadisticasArchivoMock, movimientosArchivoMock } from './dashboardMock'

// Capa de datos del Dashboard de Archivo (archivo hermano de `archivoApi.js`).
// Mantiene el patrón del repositorio (USE_MOCK / desenvolver / pendienteBackend)
// con sus propios helpers, porque en `archivoApi.js` son locales y no se exportan.
const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'

// Bandera de solo lectura para que la UI etiquete "Datos simulados".
export const USANDO_DATOS_MOCK = USE_MOCK

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

// Reservado para endpoints futuros que aún no existan. Los del dashboard
// (estadisticas/movimientos) YA están implementados en el backend, así que no
// se usa aquí. Se conserva para no romper el patrón si aparece un contrato nuevo.
// eslint-disable-next-line no-unused-vars
function pendienteBackend(operacion) {
  const error = new Error(
    `El endpoint de ${operacion} todavía no está disponible en el backend. Active VITE_USE_MOCK=true para trabajar con datos de prueba.`,
  )
  error.status = 501
  throw error
}

// Reutiliza el resumen operativo diario ya existente.
export { obtenerResumenArchivo, obtenerResumenArchivoPdf } from './archivoApi'

// GET /archivo/estadisticas?desde=&hasta=&subespecialidadId=   (CONFIRMADO)
// -> ApiResponse<EstadisticasArchivoDTO>
export async function obtenerEstadisticasArchivo({ desde, hasta, subespecialidadId } = {}) {
  if (USE_MOCK) return estadisticasArchivoMock({ desde, hasta, subespecialidadId })

  const datos = desenvolver(
    await client.get('/archivo/estadisticas', {
      params: { desde, hasta, subespecialidadId },
    }),
  )
  return mapearEstadisticasArchivo(datos)
}

// GET /archivo/movimientos?desde=&hasta=&estado=&page=&size=    (CONFIRMADO)
// -> ApiResponse<Page<EventoMovimientoDTO>>
export async function listarMovimientosArchivo({ desde, hasta, estado, page = 0, size = 20 } = {}) {
  if (USE_MOCK) return movimientosArchivoMock({ desde, hasta, estado, page, size })

  const datos = desenvolver(
    await client.get('/archivo/movimientos', {
      params: { desde, hasta, estado, page, size },
    }),
  )

  return {
    ...datos,
    content: Array.isArray(datos?.content) ? datos.content.map(mapearEventoMovimiento) : [],
  }
}
