// Reglas puras de los préstamos externos de expedientes (Archivo).
//
// Modelo interno provisional (NO es un DTO del backend):
// {
//   id, numeroExpediente, personaRetira, motivo,
//   fechaSalida, fechaDevolucion, registradoPor, recuperadoManualmente
// }
//
// Un registro = un expediente prestado. No hay lotes ni agrupaciones.
// El estado se DERIVA de fechaDevolucion (no se almacena). La procedencia de un
// registro recuperado a mano vive en `recuperadoManualmente` (metadato), no en
// un estado adicional.
//
// Estas funciones no guardan estado global ni tocan el navegador: reciben los
// arreglos como parámetro y nunca mutan la entrada.

import { formatearExpediente } from '@/shared/utils/expediente'
import {
  aInstante,
  diasEntreFechasIso,
  esFechaIsoValida,
  fechaGuatemalaDe,
  finDelDiaGuatemala,
  ocurrioEnFecha,
} from './fechaGuatemala'

export const ESTADO_PENDIENTE = 'pendiente'
export const ESTADO_DEVUELTO = 'devuelto'

export const MOTIVO_INVALIDO = 'invalido'
export const MOTIVO_DUPLICADO_ACTIVO = 'duplicado_activo'
export const MOTIVO_SIN_PENDIENTE = 'sin_pendiente'
export const MOTIVO_YA_DEVUELTO = 'ya_devuelto'

export const ERROR_REQUERIDO = 'requerido'
export const ERROR_MUY_CORTO = 'muy_corto'
export const ERROR_MUY_LARGO = 'muy_largo'
export const ERROR_CARACTERES = 'caracteres_invalidos'
export const ERROR_GUION_INVALIDO = 'guion_invalido'

// Límites tomados del esquema vigente para el número de expediente
// (`expediente.numero_expediente VARCHAR(30)`). Los de persona y motivo son
// límites de interfaz acordados en el PLAN; no son reglas del backend.
export const MAX_LONGITUD_EXPEDIENTE = 30
export const MAX_LONGITUD_PERSONA = 120
export const MAX_LONGITUD_MOTIVO = 120
export const MIN_LONGITUD_TEXTO = 3

// Los lectores suelen enviar CR/LF al final del código. Se filtran por código
// de carácter (no con una regex de control) para mantener el lint limpio.
function esCaracterDeControl(codigo) {
  return codigo <= 0x1f || codigo === 0x7f
}

function quitarCaracteresDeControl(texto) {
  let limpio = ''
  for (const caracter of texto) {
    if (!esCaracterDeControl(caracter.codePointAt(0))) limpio += caracter
  }
  return limpio
}

function reemplazarCaracteresDeControl(texto) {
  let limpio = ''
  for (const caracter of texto) {
    limpio += esCaracterDeControl(caracter.codePointAt(0)) ? ' ' : caracter
  }
  return limpio
}

/**
 * Limpia una entrada de código: quita caracteres de control (un lector suele
 * enviar CR/LF) y normaliza los espacios. No altera letras ni dígitos.
 */
export function limpiarEntradaCodigo(valor) {
  if (valor == null) return ''
  return quitarCaracteresDeControl(String(valor)).replace(/\s+/g, ' ').trim()
}

/**
 * Normaliza un número de expediente para comparar y almacenar.
 *
 * - Solo dígitos (con o sin espacios/guiones) → se guardan los dígitos, de modo
 *   que la presentación "9275-81" y la captura "927581" sean el mismo valor.
 *   El guion es solo visual (ver shared/utils/expediente.js).
 * - Código no numérico (p. ej. "EXP-2024-035") → se conserva tal cual, sin
 *   inventar un formato nuevo.
 */
export function normalizarNumeroExpediente(valor) {
  const limpio = limpiarEntradaCodigo(valor)
  if (!limpio) return ''

  const soloDigitos = limpio.replace(/[\s-]/g, '')
  if (/^\d+$/.test(soloDigitos)) return soloDigitos

  return limpio
}

/**
 * Resultado interpretable: `{ valido, valor, error }`.
 *
 * Para NUEVAS capturas por teclado/escáner solo se admiten dígitos. El guion
 * queda reservado al ingreso manual (`interpretarExpedienteManual`). La
 * normalización (`normalizarNumeroExpediente`) sigue siendo permisiva para
 * comparar/buscar registros ya existentes.
 */
export function validarNumeroExpediente(valor) {
  const limpio = limpiarEntradaCodigo(valor)

  if (!limpio) {
    return { valido: false, valor: '', error: ERROR_REQUERIDO }
  }
  if (!/^\d+$/.test(limpio)) {
    return { valido: false, valor: limpio, error: ERROR_CARACTERES }
  }
  if (limpio.length > MAX_LONGITUD_EXPEDIENTE) {
    return { valido: false, valor: limpio, error: ERROR_MUY_LARGO }
  }
  return { valido: true, valor: limpio, error: null }
}

const PATRON_MANUAL = /^(\d+)-(\d+)$/

/**
 * Interpreta una captura manual con un único guion interno (p. ej. "91-1330").
 * Devuelve la identidad normalizada (`numero`, sin guion) y la representación
 * elegida por el operador (`presentacion`), que se conserva para mostrarla.
 */
export function interpretarExpedienteManual(valor) {
  const limpio = limpiarEntradaCodigo(valor)

  if (!limpio) {
    return { valido: false, numero: '', presentacion: '', error: ERROR_REQUERIDO }
  }

  const partes = PATRON_MANUAL.exec(limpio)
  if (!partes) {
    const error = limpio.includes('-') ? ERROR_GUION_INVALIDO : ERROR_CARACTERES
    return { valido: false, numero: '', presentacion: limpio, error }
  }

  const numero = `${partes[1]}${partes[2]}`
  if (numero.length > MAX_LONGITUD_EXPEDIENTE) {
    return { valido: false, numero, presentacion: limpio, error: ERROR_MUY_LARGO }
  }

  return { valido: true, numero, presentacion: limpio, error: null }
}

function validarTextoLibre(valor, maximo, minimo = MIN_LONGITUD_TEXTO) {
  const limpio = valor == null ? '' : reemplazarCaracteresDeControl(String(valor)).trim()
  const normalizado = limpio.replace(/\s+/g, ' ')

  if (!normalizado) {
    return { valido: false, valor: '', error: ERROR_REQUERIDO }
  }
  if (normalizado.length < minimo) {
    return { valido: false, valor: normalizado, error: ERROR_MUY_CORTO }
  }
  if (normalizado.length > maximo) {
    return { valido: false, valor: normalizado, error: ERROR_MUY_LARGO }
  }
  return { valido: true, valor: normalizado, error: null }
}

// Nombres reales: letras (con tildes/diacríticos), espacios, punto, apóstrofos
// y guiones. Se rechazan dígitos y otros símbolos.
const PATRON_PERSONA = /^[\p{L}\p{M} .'’-]+$/u

/**
 * Persona que retira. No admite números; sí acentos, apóstrofos, puntos y
 * guiones propios de nombres reales.
 */
export function validarPersonaRetira(valor) {
  const resultado = validarTextoLibre(valor, MAX_LONGITUD_PERSONA, 1)
  if (!resultado.valido) return resultado

  if (!PATRON_PERSONA.test(resultado.valor)) {
    return { valido: false, valor: resultado.valor, error: ERROR_CARACTERES }
  }
  if (resultado.valor.length < MIN_LONGITUD_TEXTO) {
    return { valido: false, valor: resultado.valor, error: ERROR_MUY_CORTO }
  }
  return resultado
}

/** Motivo del préstamo: texto libre acordado con el área. */
export function validarMotivo(valor) {
  return validarTextoLibre(valor, MAX_LONGITUD_MOTIVO)
}

/** Estado derivado: 'pendiente' si no hay devolución registrada. */
export function estadoDePrestamo(registro) {
  if (!registro || typeof registro !== 'object') return null
  return registro.fechaDevolucion == null ? ESTADO_PENDIENTE : ESTADO_DEVUELTO
}

export function esPendiente(registro) {
  return estadoDePrestamo(registro) === ESTADO_PENDIENTE
}

export function esDevuelto(registro) {
  return estadoDePrestamo(registro) === ESTADO_DEVUELTO
}

/**
 * Número tal como debe verse: respeta la presentación manual elegida
 * (p. ej. "91-1330"); si no existe, aplica el formato estándar por defecto.
 */
export function numeroExpedienteVisible(registro) {
  if (!registro || typeof registro !== 'object') return ''
  return (
    registro.numeroExpedientePresentacion || formatearExpediente(registro.numeroExpediente) || ''
  )
}

/** Instante del último movimiento: la devolución manda; si no, la salida. */
export function ultimoMovimientoDe(registro) {
  if (!registro || typeof registro !== 'object') return Number.NEGATIVE_INFINITY

  const salida = aInstante(registro.fechaSalida)
  const devolucion = registro.fechaDevolucion == null ? null : aInstante(registro.fechaDevolucion)

  if (devolucion) return devolucion.getTime()
  if (salida) return salida.getTime()
  return Number.NEGATIVE_INFINITY
}

function compararPorNumero(a, b) {
  const numeroA = normalizarNumeroExpediente(a?.numeroExpediente)
  const numeroB = normalizarNumeroExpediente(b?.numeroExpediente)
  if (numeroA === numeroB) return 0
  return numeroA < numeroB ? -1 : 1
}

function compararPorId(a, b) {
  const idA = String(a?.id ?? '')
  const idB = String(b?.id ?? '')
  if (idA === idB) return 0
  return idA < idB ? -1 : 1
}

/**
 * Ordena del movimiento más reciente al más antiguo sin mutar la entrada.
 * Desempates deterministas: salida descendente, expediente ascendente, id ascendente.
 */
export function ordenarPorMovimientoReciente(registros) {
  const lista = Array.isArray(registros) ? [...registros] : []

  return lista.sort((a, b) => {
    const movimientoA = ultimoMovimientoDe(a)
    const movimientoB = ultimoMovimientoDe(b)

    if (movimientoA !== movimientoB) {
      if (movimientoA === Number.NEGATIVE_INFINITY) return 1
      if (movimientoB === Number.NEGATIVE_INFINITY) return -1
      return movimientoB - movimientoA
    }

    const salidaA = aInstante(a?.fechaSalida)?.getTime() ?? Number.NEGATIVE_INFINITY
    const salidaB = aInstante(b?.fechaSalida)?.getTime() ?? Number.NEGATIVE_INFINITY
    if (salidaA !== salidaB) {
      if (salidaA === Number.NEGATIVE_INFINITY) return 1
      if (salidaB === Number.NEGATIVE_INFINITY) return -1
      return salidaB - salidaA
    }

    return compararPorNumero(a, b) || compararPorId(a, b)
  })
}

/** Préstamo activo (sin devolución) del expediente indicado, si existe. */
export function buscarPrestamoActivo(registros, numeroExpediente) {
  const objetivo = normalizarNumeroExpediente(numeroExpediente)
  if (!objetivo || !Array.isArray(registros)) return null

  return (
    registros.find(
      (registro) =>
        esPendiente(registro) && normalizarNumeroExpediente(registro.numeroExpediente) === objetivo,
    ) ?? null
  )
}

/**
 * ¿Se puede registrar un nuevo préstamo de este expediente?
 * `{ permitido, motivo, registro, numeroExpediente }`
 */
export function evaluarRegistroPrestamo(registros, numeroExpediente) {
  const validacion = validarNumeroExpediente(numeroExpediente)
  if (!validacion.valido) {
    return {
      permitido: false,
      motivo: MOTIVO_INVALIDO,
      registro: null,
      numeroExpediente: validacion.valor,
      error: validacion.error,
    }
  }

  const activo = buscarPrestamoActivo(registros, validacion.valor)
  if (activo) {
    return {
      permitido: false,
      motivo: MOTIVO_DUPLICADO_ACTIVO,
      registro: activo,
      numeroExpediente: validacion.valor,
      error: null,
    }
  }

  return {
    permitido: true,
    motivo: null,
    registro: null,
    numeroExpediente: validacion.valor,
    error: null,
  }
}

/**
 * ¿Se puede registrar la devolución de este expediente?
 * Distingue "sin pendiente" de "ya devuelto" para dar un mensaje útil.
 */
export function evaluarDevolucion(registros, numeroExpediente) {
  const validacion = validarNumeroExpediente(numeroExpediente)
  if (!validacion.valido) {
    return {
      permitido: false,
      motivo: MOTIVO_INVALIDO,
      registro: null,
      numeroExpediente: validacion.valor,
      error: validacion.error,
    }
  }

  const lista = Array.isArray(registros) ? registros : []
  const objetivo = validacion.valor

  const pendiente = lista.find(
    (registro) =>
      esPendiente(registro) && normalizarNumeroExpediente(registro.numeroExpediente) === objetivo,
  )
  if (pendiente) {
    return {
      permitido: true,
      motivo: null,
      registro: pendiente,
      numeroExpediente: objetivo,
      error: null,
    }
  }

  const devueltos = lista.filter(
    (registro) =>
      esDevuelto(registro) && normalizarNumeroExpediente(registro.numeroExpediente) === objetivo,
  )
  if (devueltos.length > 0) {
    const [masReciente] = ordenarPorMovimientoReciente(devueltos)
    return {
      permitido: false,
      motivo: MOTIVO_YA_DEVUELTO,
      registro: masReciente,
      numeroExpediente: objetivo,
      error: null,
    }
  }

  return {
    permitido: false,
    motivo: MOTIVO_SIN_PENDIENTE,
    registro: null,
    numeroExpediente: objetivo,
    error: null,
  }
}

/**
 * Vista operativa del día: salidas del día + devoluciones del día + pendientes
 * de cualquier fecha. Los devueltos de días anteriores quedan fuera.
 * `fechaIso` es obligatoria para poder calcular cualquier fecha de prueba.
 */
export function filtrarVistaDiaria(registros, fechaIso) {
  if (!esFechaIsoValida(fechaIso)) return []
  const fecha = fechaIso.trim()
  const lista = Array.isArray(registros) ? registros : []

  const delDia = lista.filter((registro) => {
    if (!registro) return false
    if (ocurrioEnFecha(registro.fechaSalida, fecha)) return true
    if (ocurrioEnFecha(registro.fechaDevolucion, fecha)) return true
    return esPendiente(registro)
  })

  return ordenarPorMovimientoReciente(delDia)
}

/** Préstamos pendientes (sin devolución), más recientes primero. */
export function obtenerPendientes(registros) {
  const lista = Array.isArray(registros) ? registros : []
  return ordenarPorMovimientoReciente(lista.filter(esPendiente))
}

/** Historial completo ordenado por movimiento reciente. */
export function obtenerHistorial(registros) {
  return ordenarPorMovimientoReciente(registros)
}

/** Préstamos ya devueltos (de cualquier fecha), ordenados por último movimiento. */
export function obtenerDevueltos(registros) {
  const lista = Array.isArray(registros) ? registros : []
  return ordenarPorMovimientoReciente(lista.filter(esDevuelto))
}

/** Texto comparable: minúsculas y sin diacríticos. */
export function normalizarParaBusqueda(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Búsqueda local por expediente, persona o motivo.
 * El expediente se compara normalizado, así que "9275-81" encuentra "927581".
 */
export function buscarRegistros(registros, consulta) {
  const ordenados = ordenarPorMovimientoReciente(registros)
  const texto = normalizarParaBusqueda(consulta)
  if (!texto) return ordenados

  const consultaExpediente = normalizarNumeroExpediente(consulta).toLowerCase()

  return ordenados.filter((registro) => {
    if (!registro) return false

    const expediente = normalizarNumeroExpediente(registro.numeroExpediente).toLowerCase()
    if (consultaExpediente && expediente.includes(consultaExpediente)) return true

    return (
      normalizarParaBusqueda(registro.personaRetira).includes(texto) ||
      normalizarParaBusqueda(registro.motivo).includes(texto)
    )
  })
}

/**
 * ¿El registro estaba pendiente en el instante de corte?
 * Se basa en las fechas, no en el estado actual, para que un reporte histórico
 * sea correcto aunque el expediente ya se haya devuelto después.
 */
export function estabaPendienteAlCorte(registro, instanteCorte) {
  if (!registro || typeof registro !== 'object') return false

  const corte = aInstante(instanteCorte)
  const salida = aInstante(registro.fechaSalida)
  if (!corte || !salida) return false

  if (salida.getTime() > corte.getTime()) return false

  if (registro.fechaDevolucion == null) return true

  const devolucion = aInstante(registro.fechaDevolucion)
  if (!devolucion) return true

  return devolucion.getTime() > corte.getTime()
}

/** Días de antigüedad del préstamo respecto al corte (0 = mismo día). */
export function diasDeAntiguedad(registro, instanteCorte) {
  if (!registro || typeof registro !== 'object') return null

  const fechaSalida = fechaGuatemalaDe(registro.fechaSalida)
  const fechaCorte = fechaGuatemalaDe(instanteCorte)
  if (!fechaSalida || !fechaCorte) return null

  return diasEntreFechasIso(fechaSalida, fechaCorte)
}

/**
 * Clasifica los registros para el reporte de cierre diario.
 *
 * `instanteCorte` es explícito cuando se requiere un corte histórico; si se
 * omite, se usa el último milisegundo del día guatemalteco de `fecha`.
 */
export function clasificarReporteCierre(registros, { fecha, instanteCorte } = {}) {
  const lista = Array.isArray(registros) ? registros : []
  const fechaValida = esFechaIsoValida(fecha) ? fecha.trim() : null

  let corte = null
  if (instanteCorte != null) {
    corte = aInstante(instanteCorte)
  } else if (fechaValida) {
    corte = finDelDiaGuatemala(fechaValida)
  }

  const salidasDelDia = fechaValida
    ? ordenarPorMovimientoReciente(lista.filter((r) => ocurrioEnFecha(r?.fechaSalida, fechaValida)))
    : []
  const devolucionesDelDia = fechaValida
    ? ordenarPorMovimientoReciente(
        lista.filter((r) => ocurrioEnFecha(r?.fechaDevolucion, fechaValida)),
      )
    : []
  const pendientesAlCorte = corte
    ? ordenarPorMovimientoReciente(lista.filter((r) => estabaPendienteAlCorte(r, corte)))
    : []

  return {
    fecha: fechaValida,
    instanteCorte: corte ? corte.toISOString() : null,
    salidasDelDia,
    devolucionesDelDia,
    pendientesAlCorte,
    totales: {
      salidas: salidasDelDia.length,
      devoluciones: devolucionesDelDia.length,
      pendientes: pendientesAlCorte.length,
    },
  }
}
