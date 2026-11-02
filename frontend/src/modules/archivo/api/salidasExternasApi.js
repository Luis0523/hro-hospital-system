// API simulada de Salidas Externas (préstamos de expedientes a personas).
//
// Es la ÚNICA capa que la pantalla debe consumir. Hoy responde con datos en
// memoria (ver `salidasExternasMock.js`); cuando exista backend real se
// sustituye el cuerpo de cada función sin cambiar los contratos.
//
// NO se inventan rutas HTTP ni DTO institucionales: los únicos códigos de error
// son internos de esta simulación (prefijo `SALIDAS_EXTERNAS_`).

import { formatearExpediente } from '@/shared/utils/expediente'
import {
  aInstante,
  esFechaIsoValida,
  fechaGuatemalaDe,
  formatearFechaHoraGuatemala,
  instanteDesdeFechaHoraGuatemala,
} from '../utils/fechaGuatemala'
import {
  MOTIVO_YA_DEVUELTO,
  evaluarDevolucion,
  evaluarRegistroPrestamo,
  filtrarVistaDiaria,
  interpretarExpedienteManual,
  limpiarEntradaCodigo,
  numeroExpedienteVisible,
  obtenerDevueltos,
  obtenerHistorial,
  obtenerPendientes,
  validarMotivo,
  validarNumeroExpediente,
  validarPersonaRetira,
} from '../utils/prestamosExternos'
import {
  actualizarRegistroMock,
  crearRegistroMock,
  eliminarRegistroMock,
  limpiarOperacionMock,
  listarRegistrosMock,
  obtenerOperacionMock,
  registrarOperacionMock,
  registrarReversionMock,
} from './salidasExternasMock'

export const USANDO_DATOS_MOCK = true

// Códigos internos de la simulación. NO son códigos oficiales del backend.
export const CODIGO_ENTRADA_INVALIDA = 'SALIDAS_EXTERNAS_ENTRADA_INVALIDA'
export const CODIGO_PRESTAMO_DUPLICADO = 'SALIDAS_EXTERNAS_PRESTAMO_DUPLICADO'
export const CODIGO_SIN_PRESTAMO_PENDIENTE = 'SALIDAS_EXTERNAS_SIN_PRESTAMO_PENDIENTE'
export const CODIGO_YA_DEVUELTO = 'SALIDAS_EXTERNAS_YA_DEVUELTO'
export const CODIGO_FECHA_INVALIDA = 'SALIDAS_EXTERNAS_FECHA_INVALIDA'
export const CODIGO_NADA_QUE_REVERTIR = 'SALIDAS_EXTERNAS_NADA_QUE_REVERTIR'
export const CODIGO_REGISTRO_CAMBIADO = 'SALIDAS_EXTERNAS_REGISTRO_CAMBIADO'

// Latencia simulada para ejercitar estados de carga. En tests es 0 para no
// volver la suite lenta ni inestable.
const LATENCIA_SIMULADA_MS = import.meta.env.MODE === 'test' ? 0 : 120

const ETIQUETAS_CAMPO = {
  numeroExpediente: 'El número de expediente',
  personaRetira: 'La persona que retira',
  motivo: 'El motivo',
}

const DETALLE_VALIDACION = {
  requerido: 'es obligatorio.',
  muy_corto: 'es demasiado corto.',
  muy_largo: 'es demasiado largo.',
  caracteres_invalidos: 'contiene caracteres no permitidos.',
  guion_invalido: 'debe tener un único guion entre grupos de dígitos.',
}

// "La persona" es femenino: concordancia propia para ese campo.
const DETALLE_VALIDACION_PERSONA = {
  requerido: 'es obligatoria.',
  muy_corto: 'es demasiado corta.',
  muy_largo: 'es demasiado larga.',
  caracteres_invalidos: 'solo puede contener letras, espacios, guiones y apóstrofos.',
  guion_invalido: 'solo puede contener letras, espacios, guiones y apóstrofos.',
}

function mensajeValidacion(campo, error) {
  const detalles = campo === 'personaRetira' ? DETALLE_VALIDACION_PERSONA : DETALLE_VALIDACION
  return `${ETIQUETAS_CAMPO[campo]} ${detalles[error] ?? 'no es válido.'}`
}

function esperarLatencia() {
  return new Promise((resolver) => {
    setTimeout(resolver, LATENCIA_SIMULADA_MS)
  })
}

/** Error con la forma que ya interpreta el frontend: { status, codigo, message }. */
function crearError(status, codigo, message, data = null) {
  const error = new Error(message)
  error.status = status
  error.codigo = codigo
  if (data != null) error.data = data
  return error
}

function errorValidacion(campo, codigoError) {
  return crearError(400, CODIGO_ENTRADA_INVALIDA, mensajeValidacion(campo, codigoError), {
    campo,
    error: codigoError,
  })
}

function exigirValidacion(campo, resultado) {
  if (resultado.valido) return resultado.valor
  throw errorValidacion(campo, resultado.error)
}

function exigirInstante(valor, etiqueta) {
  const instante = valor == null ? new Date() : aInstante(valor)
  if (!instante) {
    throw crearError(400, CODIGO_FECHA_INVALIDA, `${etiqueta} no es una fecha válida.`)
  }
  return instante
}

function resolverOperador(valor) {
  if (valor == null) return null
  return limpiarEntradaCodigo(valor) || null
}

function numeroVisible(registro, numeroExpediente) {
  return registro ? numeroExpedienteVisible(registro) : formatearExpediente(numeroExpediente)
}

function mensajeDuplicado(numeroExpediente, registro) {
  return `El expediente ${numeroVisible(registro, numeroExpediente)} ya tiene un préstamo pendiente.`
}

function errorDuplicado(registro, numeroExpediente) {
  return crearError(409, CODIGO_PRESTAMO_DUPLICADO, mensajeDuplicado(numeroExpediente, registro), {
    registro,
  })
}

function errorYaDevuelto(registro, numeroExpediente) {
  const fecha = formatearFechaHoraGuatemala(registro?.fechaDevolucion)
  const detalle = fecha ? ` Fue devuelto el ${fecha}.` : ''
  return crearError(
    409,
    CODIGO_YA_DEVUELTO,
    `El expediente ${numeroVisible(registro, numeroExpediente)} ya fue devuelto.${detalle}`,
    { registro },
  )
}

function errorSinPendiente(numeroExpediente) {
  return crearError(
    404,
    CODIGO_SIN_PRESTAMO_PENDIENTE,
    `No hay un préstamo pendiente para el expediente ${formatearExpediente(numeroExpediente)}.`,
  )
}

/**
 * Resuelve el número de expediente según el mecanismo de captura:
 * - con `presentacion`: ingreso manual, admite un único guion interno y
 *   conserva la representación elegida;
 * - sin ella: teclado/escáner, solo dígitos.
 */
function resolverNumeroExpediente(datos) {
  const presentacion = datos.presentacion == null ? '' : limpiarEntradaCodigo(datos.presentacion)

  if (!presentacion) {
    return {
      numeroExpediente: exigirValidacion(
        'numeroExpediente',
        validarNumeroExpediente(datos.numeroExpediente),
      ),
      presentacion: null,
    }
  }

  const manual = interpretarExpedienteManual(presentacion)
  if (!manual.valido) {
    throw errorValidacion('numeroExpediente', manual.error)
  }
  return { numeroExpediente: manual.numero, presentacion: manual.presentacion }
}

/** Valida y normaliza los campos comunes de persona/motivo/expediente. */
function prepararDatos(datos) {
  const { numeroExpediente, presentacion } = resolverNumeroExpediente(datos)
  return {
    numeroExpediente,
    presentacion,
    personaRetira: exigirValidacion('personaRetira', validarPersonaRetira(datos.personaRetira)),
    motivo: exigirValidacion('motivo', validarMotivo(datos.motivo)),
  }
}

/** Fecha operativa de referencia: explícita (`fecha`) o derivada de un instante. */
function resolverFechaReferencia({ fecha, instante } = {}) {
  if (fecha != null) {
    if (!esFechaIsoValida(fecha)) {
      throw crearError(400, CODIGO_FECHA_INVALIDA, 'La fecha de referencia no es válida.')
    }
    return fecha.trim()
  }

  const referencia = instante == null ? new Date() : aInstante(instante)
  const fechaCalculada = referencia ? fechaGuatemalaDe(referencia) : null
  if (!fechaCalculada) {
    throw crearError(400, CODIGO_FECHA_INVALIDA, 'El instante de referencia no es válido.')
  }
  return fechaCalculada
}

/**
 * Vista del día operativo: salidas del día + devoluciones del día + pendientes
 * de cualquier fecha (ordenadas por último movimiento, descendente).
 */
export async function listarHoy(opciones = {}) {
  const fecha = resolverFechaReferencia(opciones)
  const lista = filtrarVistaDiaria(listarRegistrosMock(), fecha)
  await esperarLatencia()
  return lista
}

/** Todos los préstamos todavía prestados, sin importar la fecha de salida. */
export async function listarPendientes() {
  const lista = obtenerPendientes(listarRegistrosMock())
  await esperarLatencia()
  return lista
}

/** Todos los registros de la sesión (incluidos los ya devueltos). */
export async function listarHistorial() {
  const lista = obtenerHistorial(listarRegistrosMock())
  await esperarLatencia()
  return lista
}

/**
 * Localiza el préstamo pendiente de un expediente.
 * 404 si no hay pendiente; 409 si el expediente ya fue devuelto.
 */
export async function buscarPendiente(numeroExpediente) {
  const numero = exigirValidacion('numeroExpediente', validarNumeroExpediente(numeroExpediente))
  const evaluacion = evaluarDevolucion(listarRegistrosMock(), numero)

  if (evaluacion.permitido) {
    await esperarLatencia()
    return evaluacion.registro
  }

  if (evaluacion.motivo === MOTIVO_YA_DEVUELTO) {
    throw errorYaDevuelto(evaluacion.registro, numero)
  }
  throw errorSinPendiente(numero)
}

/**
 * Registra un préstamo individual.
 * `instante` es opcional y sirve para pruebas/demostración (por defecto, ahora).
 */
export async function registrarPrestamo(datos = {}) {
  const { numeroExpediente, presentacion, personaRetira, motivo } = prepararDatos(datos)
  const salida = exigirInstante(datos.instante, 'La fecha de salida')

  // Validación de duplicado + inserción SIN `await` intermedio: dentro del
  // mismo store dos intentos concurrentes no pueden crear dos préstamos
  // activos del mismo expediente.
  const evaluacion = evaluarRegistroPrestamo(listarRegistrosMock(), numeroExpediente)
  if (!evaluacion.permitido) {
    throw errorDuplicado(evaluacion.registro, numeroExpediente)
  }

  const creado = crearRegistroMock({
    numeroExpediente,
    numeroExpedientePresentacion: presentacion,
    personaRetira,
    motivo,
    fechaSalida: salida.toISOString(),
    fechaDevolucion: null,
    registradoPor: resolverOperador(datos.registradoPor),
    recuperadoManualmente: false,
    creadoEn: salida.toISOString(),
  })

  registrarOperacionMock({ tipo: 'prestamo', registroId: creado.id })

  await esperarLatencia()
  return creado
}

/**
 * Registra la devolución del préstamo pendiente de un expediente.
 * Conserva persona, motivo y fecha/hora originales de salida.
 */
export async function registrarDevolucion(datos = {}) {
  const { numeroExpediente: numero } = resolverNumeroExpediente(datos)
  const evaluacion = evaluarDevolucion(listarRegistrosMock(), numero)

  if (!evaluacion.permitido) {
    if (evaluacion.motivo === MOTIVO_YA_DEVUELTO) {
      throw errorYaDevuelto(evaluacion.registro, numero)
    }
    throw errorSinPendiente(numero)
  }

  const devolucion = exigirInstante(datos.instante, 'La fecha de devolución')
  const salida = aInstante(evaluacion.registro.fechaSalida)
  if (!salida) {
    throw crearError(400, CODIGO_FECHA_INVALIDA, 'El préstamo no tiene una fecha de salida válida.')
  }
  if (devolucion.getTime() < salida.getTime()) {
    throw crearError(
      400,
      CODIGO_FECHA_INVALIDA,
      'La fecha de devolución no puede ser anterior a la fecha de salida.',
    )
  }

  const actualizado = actualizarRegistroMock(evaluacion.registro.id, {
    fechaDevolucion: devolucion.toISOString(),
  })
  if (!actualizado) {
    throw errorSinPendiente(numero)
  }

  registrarOperacionMock({
    tipo: 'devolucion',
    registroId: actualizado.id,
    fechaDevolucion: actualizado.fechaDevolucion,
  })

  await esperarLatencia()
  return actualizado
}

/**
 * Recupera manualmente un préstamo de una sesión anterior (captura desde el
 * reporte impreso). Conserva la fecha/hora original de salida y marca el
 * registro con `recuperadoManualmente = true`; el estado sigue siendo pendiente.
 * No cuenta como una salida nueva del día de recuperación.
 */
export async function registrarRecuperado(datos = {}) {
  const { numeroExpediente, personaRetira, motivo } = prepararDatos(datos)

  const salida = instanteDesdeFechaHoraGuatemala(datos.fechaSalida, datos.horaSalida ?? '00:00')
  if (!salida) {
    throw crearError(400, CODIGO_FECHA_INVALIDA, 'La fecha u hora original de salida no es válida.')
  }

  const recuperacion = exigirInstante(datos.instanteRecuperacion, 'La fecha de recuperación')
  if (salida.getTime() > recuperacion.getTime()) {
    throw crearError(
      400,
      CODIGO_FECHA_INVALIDA,
      'La fecha original de salida no puede ser posterior a la recuperación.',
    )
  }

  const evaluacion = evaluarRegistroPrestamo(listarRegistrosMock(), numeroExpediente)
  if (!evaluacion.permitido) {
    throw errorDuplicado(evaluacion.registro, numeroExpediente)
  }

  const creado = crearRegistroMock({
    numeroExpediente,
    numeroExpedientePresentacion: null,
    personaRetira,
    motivo,
    fechaSalida: salida.toISOString(),
    fechaDevolucion: null,
    registradoPor: resolverOperador(datos.registradoPor),
    recuperadoManualmente: true,
    creadoEn: recuperacion.toISOString(),
  })

  registrarOperacionMock({ tipo: 'recuperacion', registroId: creado.id })

  await esperarLatencia()
  return creado
}

/** Préstamos ya devueltos de cualquier fecha (vista "Devueltos"). */
export async function listarDevueltos() {
  const lista = obtenerDevueltos(listarRegistrosMock())
  await esperarLatencia()
  return lista
}

/**
 * Última operación exitosa (para el panel de última acción).
 * Devuelve `{ tipo, registro }` o null. No es un sistema de auditoría.
 */
export async function obtenerUltimaAccion() {
  const operacion = obtenerOperacionMock()
  if (!operacion) return null

  const registro = listarRegistrosMock().find((item) => item.id === operacion.registroId)
  if (!registro) return null

  await esperarLatencia()
  return { tipo: operacion.tipo, registro }
}

/**
 * Revierte la última operación exitosa:
 * - préstamo/recuperación → elimina el registro (con bitácora local);
 * - devolución → restaura `fechaDevolucion = null`.
 * Solo una vez: tras revertir no queda acción pendiente.
 */
export async function revertirUltimaAccion() {
  const operacion = obtenerOperacionMock()
  if (!operacion) {
    throw crearError(409, CODIGO_NADA_QUE_REVERTIR, 'No hay una acción reciente que revertir.')
  }

  if (operacion.tipo === 'devolucion') {
    const registro = listarRegistrosMock().find((item) => item.id === operacion.registroId)
    if (!registro || registro.fechaDevolucion !== operacion.fechaDevolucion) {
      throw crearError(
        409,
        CODIGO_REGISTRO_CAMBIADO,
        'El registro cambió después de la devolución; no se puede revertir.',
      )
    }

    const actualizado = actualizarRegistroMock(registro.id, { fechaDevolucion: null })
    registrarReversionMock({
      tipo: 'devolucion',
      registroId: registro.id,
      fechaDevolucion: operacion.fechaDevolucion,
    })
    limpiarOperacionMock()

    await esperarLatencia()
    return { tipo: 'devolucion', registro: actualizado }
  }

  const eliminado = eliminarRegistroMock(operacion.registroId)
  if (!eliminado) {
    throw crearError(
      409,
      CODIGO_REGISTRO_CAMBIADO,
      'El registro ya no existe; no se puede revertir.',
    )
  }

  registrarReversionMock({
    tipo: operacion.tipo,
    registroId: operacion.registroId,
    registro: eliminado,
  })
  limpiarOperacionMock()

  await esperarLatencia()
  return { tipo: operacion.tipo, registro: eliminado }
}
