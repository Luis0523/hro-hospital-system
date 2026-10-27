import client from '@/shared/api/client'
import { mapearEstadisticasArchivo, mapearEventoMovimiento } from './archivoMappers'
import { estadisticasArchivoMock, movimientosArchivoMock } from './dashboardMock'
import { listarSalidasHospital } from './salidaArchivoHospitalApi'
import { obtenerCuadernoRojo } from './archivoApi'
import { listarCarnets, obtenerConfiguracionArchivo } from '@/modules/carnets/api/carnetsApi'

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

// GET /archivo/jefe/estadisticas?fecha=    (Dashboard administrativo)
export async function obtenerEstadisticasJefe({ fecha } = {}) {
  if (USE_MOCK) return estadisticasJefeMock({ fecha })

  try {
    return desenvolver(await client.get('/archivo/jefe/estadisticas', { params: { fecha } }))
  } catch (fallo) {
    // Compatibilidad con backends desplegados que aún no tienen el endpoint.
    if (esEndpointAusente(fallo)) return estadisticasJefeDesdeEndpoints(fecha)
    throw fallo
  }
}

function esEndpointAusente(fallo) {
  const mensaje = String(fallo?.message ?? '')
  return (
    fallo?.status === 404 || fallo?.status === 405 || /no static resource|not found/i.test(mensaje)
  )
}

const ORDEN_ESTADOS_CARNET = [
  'registrado',
  'no_localizado',
  'salida_archivo',
  'salida_enfermeria',
  'resguardado',
]

async function estadisticasJefeDesdeEndpoints(fecha) {
  const [salidas, carnets, cuaderno, config] = await Promise.all([
    listarSalidasHospital({ fecha }),
    listarCarnets({ fecha }),
    obtenerCuadernoRojo(fecha).catch(() => null),
    obtenerConfiguracionArchivo().catch(() => null),
  ])
  const umbral = config?.umbralActivo ?? null
  const dia = fecha || new Date().toISOString().slice(0, 10)
  const mapaEstaciones = new Map()

  for (const salida of salidas ?? []) {
    const clave = salida.estacionId ?? 'sin-estacion'
    const fila = mapaEstaciones.get(clave) ?? {
      estacionId: salida.estacionId ?? null,
      estacionNombre: salida.estacionNombre ?? 'Sin estación',
      total: 0,
      clinicaMujer: 0,
      activos: 0,
      pasivos: 0,
    }
    fila.total += 1
    if (salida.esClinicaMujer) fila.clinicaMujer += 1
    const clasificacion =
      salida.clasificacion ?? clasificarExpediente(salida.numeroExpediente, umbral)
    if (clasificacion === 'activo') fila.activos += 1
    if (clasificacion === 'pasivo') fila.pasivos += 1
    mapaEstaciones.set(clave, fila)
  }

  const porEstacion = [...mapaEstaciones.values()].sort((a, b) => b.total - a.total)
  const conteoEstados = Object.fromEntries(ORDEN_ESTADOS_CARNET.map((estado) => [estado, 0]))
  for (const carnet of carnets ?? []) {
    if (carnet?.estado in conteoEstados) conteoEstados[carnet.estado] += 1
  }

  return {
    fecha: dia,
    totalSalidas: porEstacion.reduce((total, fila) => total + fila.total, 0),
    totalClinicaMujer: porEstacion.reduce((total, fila) => total + fila.clinicaMujer, 0),
    totalActivos: porEstacion.reduce((total, fila) => total + fila.activos, 0),
    totalPasivos: porEstacion.reduce((total, fila) => total + fila.pasivos, 0),
    porEstacion,
    porEstado: ORDEN_ESTADOS_CARNET.map((estado) => ({ estado, total: conteoEstados[estado] })),
    cuadernoRojo: {
      fecha: dia,
      egresosHospitalarios: cuaderno?.egresosHospitalarios ?? 0,
      sobresEmergencia: cuaderno?.sobresEmergencia ?? 0,
      sobresSellados: cuaderno?.sobresSellados ?? 0,
      tia: cuaderno?.tia ?? 0,
      registrado: Boolean(cuaderno),
    },
  }
}

function clasificarExpediente(numeroExpediente, umbral) {
  if (umbral == null || numeroExpediente == null) return null
  const numero = Number.parseInt(numeroExpediente, 10)
  if (Number.isNaN(numero)) return null
  return numero > umbral ? 'activo' : 'pasivo'
}

function estadisticasJefeMock({ fecha } = {}) {
  const dia = fecha || new Date().toISOString().slice(0, 10)
  const porEstacion = [
    {
      estacionId: 1,
      estacionNombre: 'Archivo Central',
      total: 12,
      clinicaMujer: 4,
      activos: 7,
      pasivos: 5,
    },
    {
      estacionId: 2,
      estacionNombre: 'Consulta Externa',
      total: 8,
      clinicaMujer: 1,
      activos: 3,
      pasivos: 5,
    },
    {
      estacionId: 3,
      estacionNombre: 'Emergencia',
      total: 5,
      clinicaMujer: 2,
      activos: 2,
      pasivos: 3,
    },
  ]
  return {
    fecha: dia,
    totalSalidas: 25,
    totalClinicaMujer: 7,
    totalActivos: 12,
    totalPasivos: 13,
    porEstacion,
    porEstado: [
      { estado: 'registrado', total: 18 },
      { estado: 'no_localizado', total: 2 },
      { estado: 'salida_archivo', total: 25 },
      { estado: 'salida_enfermeria', total: 9 },
      { estado: 'resguardado', total: 31 },
    ],
    cuadernoRojo: {
      fecha: dia,
      egresosHospitalarios: 14,
      sobresEmergencia: 6,
      sobresSellados: 9,
      tia: 3,
      registrado: true,
    },
  }
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
