import { ORDEN_ESTADOS, ESTADOS_EXPEDIENTE } from '../estadosExpediente'
import { jornadaArchivoMock, USUARIO_ARCHIVO_MOCK } from './mockData'

// Datos simulados del Dashboard de Archivo. Imitan el contrato confirmado del
// backend (EstadisticasArchivoDTO y Page<EventoMovimientoDTO>) y se derivan de
// los mismos fixtures que la pantalla operativa, para que las cifras cuadren.
//
// Son DETERMINISTAS (sin Math.random) para que las pruebas sean estables; en
// desarrollo muestran un conjunto de datos plausible, no aleatorio.

// `porEstado` incluye los 8 estados del ciclo en orden, con `no_localizado` al
// final (excepción). `sin_ciclo` NO es un estado del ciclo.
const ESTADOS_SERIE = [...ORDEN_ESTADOS, 'no_localizado']

// Permanencia promedio (minutos) por estado. Valor fijo de referencia.
const PERMANENCIA_BASE = {
  pendiente_localizar: 18,
  en_busqueda: 42,
  localizado: 12,
  en_transito_entrega: 9,
  entregado: 35,
  en_transito_retorno: 21,
  archivado: 5,
  no_localizado: 60,
}

function hoyIso() {
  return new Date().toISOString().slice(0, 10)
}

function aIso(fecha) {
  return fecha.toISOString().slice(0, 10)
}

// Cuenta expedientes por estado a partir de la jornada simulada, respetando el
// filtro por unidad. `sin_ciclo` se contabiliza como expediente nuevo (aún sin
// ciclo), no como paso del flujo.
function contarPorEstado({ subespecialidadId } = {}) {
  const filas = jornadaArchivoMock({ subespecialidadId })
  const conteo = Object.fromEntries(ESTADOS_SERIE.map((estado) => [estado, 0]))
  const porUnidadMap = new Map()
  let expedientesNuevos = 0

  for (const fila of filas) {
    const estado = fila.estadoActual
    if (!estado || estado === 'sin_ciclo') {
      expedientesNuevos += 1
      continue
    }

    if (estado in conteo) conteo[estado] += 1

    const clave = fila.subespecialidadId ?? 'sin-unidad'
    const unidad = porUnidadMap.get(clave) ?? {
      subespecialidadId: fila.subespecialidadId ?? null,
      nombre: fila.subespecialidadNombre ?? 'Sin unidad',
      total: 0,
      noLocalizado: 0,
    }
    unidad.total += 1
    if (estado === 'no_localizado') unidad.noLocalizado += 1
    porUnidadMap.set(clave, unidad)
  }

  return { conteo, expedientesNuevos, porUnidad: [...porUnidadMap.values()] }
}

// Serie diaria determinista: 7 días que terminan en `fin`. La forma es estable;
// los conteos dependen solo del índice del día (no de la fecha real).
function serieDiariaMock({ desde, hasta } = {}) {
  const fin = hasta || desde || hoyIso()
  const base = new Date(`${fin}T00:00:00Z`)
  const dias = []
  for (let i = 6; i >= 0; i -= 1) {
    const fecha = new Date(base)
    fecha.setUTCDate(base.getUTCDate() - i)
    const factor = i + 1
    dias.push({
      fecha: aIso(fecha),
      transiciones: 8 + factor * 3,
      ciclosNuevos: 1 + (factor % 4),
      noLocalizado: factor % 3 === 0 ? 1 : 0,
    })
  }
  return dias
}

export function estadisticasArchivoMock({ desde, hasta, subespecialidadId } = {}) {
  const { conteo, expedientesNuevos, porUnidad } = contarPorEstado({ subespecialidadId })
  const porEstado = ESTADOS_SERIE.map((estado) => ({ estado, total: conteo[estado] }))
  const totalCiclos = ESTADOS_SERIE.reduce((total, estado) => total + conteo[estado], 0)
  const inicio = desde || hoyIso()
  const fin = hasta || inicio

  return {
    rango: { desde: inicio, hasta: fin },
    totales: {
      totalCiclos,
      expedientesNuevos,
      noLocalizado: conteo.no_localizado,
      archivado: conteo.archivado,
      entregado: conteo.entregado,
      enTransito: conteo.en_transito_entrega + conteo.en_transito_retorno,
    },
    porEstado,
    serieDiaria: serieDiariaMock({ desde: inicio, hasta: fin }),
    porUnidad,
    permanencia: ESTADOS_SERIE.map((estado) => ({
      estado,
      minutosPromedio: PERMANENCIA_BASE[estado] ?? 0,
    })),
  }
}

// Construye la bitácora completa (determinista) a partir de la jornada.
function construirMovimientos() {
  const filas = jornadaArchivoMock({})
  const eventos = []
  let id = 0

  filas.forEach((fila) => {
    const estado = fila.estadoActual
    if (!estado || estado === 'sin_ciclo') return

    const indice = ORDEN_ESTADOS.indexOf(estado)
    const estadoAnterior = indice > 0 ? ORDEN_ESTADOS[indice - 1] : null
    id += 1
    eventos.push({
      id,
      expedienteId: fila.expedienteId,
      numeroExpediente: fila.numeroExpediente,
      pacienteNombre: fila.pacienteNombre,
      estadoAnterior,
      estadoNuevo: estado,
      usuarioNombre: USUARIO_ARCHIVO_MOCK,
      observacion: estado === 'no_localizado' ? 'No se encontró en su ubicación.' : null,
      // Instante determinista en el pasado (no depende del reloj para la forma).
      fechaMovimiento: new Date(Date.UTC(2026, 9, 7, 12, 0, 0) - id * 45 * 60 * 1000).toISOString(),
    })
  })

  return eventos
}

// `desde`/`hasta` se aceptan por paridad con el contrato real, pero el rango
// no filtra en el mock (la bitácora simulada es la del día operativo).
export function movimientosArchivoMock(parametros = {}) {
  const { estado, page = 0, size = 20 } = parametros
  const todos = construirMovimientos()
  const filtrados = estado ? todos.filter((evento) => evento.estadoNuevo === estado) : todos

  const totalElements = filtrados.length
  const tamano = size > 0 ? size : 20
  const totalPages = Math.ceil(totalElements / tamano)
  const number = totalPages === 0 ? 0 : Math.min(Math.max(page, 0), totalPages - 1)
  const inicio = number * tamano
  const content = filtrados.slice(inicio, inicio + tamano)

  return {
    content,
    totalElements,
    totalPages,
    size: tamano,
    number,
    first: number === 0,
    last: number >= totalPages - 1,
  }
}

// Emisor simulado para el feed de tiempo real. Repite la bitácora en orden y
// marca cada entrega con un id y un instante nuevos. `emitir()` permite forzar
// un evento en pruebas; `detener()` cancela el temporizador.
export function crearEmisorMovimientosMock({ onEvento, intervaloMs = 4000, eventos } = {}) {
  const pool = eventos ?? construirMovimientos()
  let indice = 0

  function emitir() {
    if (!onEvento || pool.length === 0) return
    const base = pool[indice % pool.length]
    indice += 1
    onEvento({
      ...base,
      id: `mock-${indice}`,
      fechaMovimiento: new Date().toISOString(),
    })
  }

  const timer = setInterval(emitir, intervaloMs)

  return {
    emitir,
    detener: () => clearInterval(timer),
  }
}

// Etiqueta de estado legible para el mock (misma fuente que la UI).
export function etiquetaEstadoMock(estado) {
  return ESTADOS_EXPEDIENTE[estado]?.etiqueta ?? estado
}
