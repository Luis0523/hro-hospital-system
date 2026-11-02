import { beforeEach, describe, expect, it } from 'vitest'
import { instanteDesdeFechaHoraGuatemala } from '../utils/fechaGuatemala'
import { clasificarReporteCierre, estadoDePrestamo } from '../utils/prestamosExternos'
import { reiniciarSalidasExternasMock } from './salidasExternasMock'
import {
  CODIGO_ENTRADA_INVALIDA,
  CODIGO_FECHA_INVALIDA,
  CODIGO_NADA_QUE_REVERTIR,
  CODIGO_PRESTAMO_DUPLICADO,
  CODIGO_SIN_PRESTAMO_PENDIENTE,
  CODIGO_YA_DEVUELTO,
  USANDO_DATOS_MOCK,
  buscarPendiente,
  listarDevueltos,
  listarHistorial,
  listarHoy,
  listarPendientes,
  obtenerUltimaAccion,
  registrarDevolucion,
  registrarPrestamo,
  registrarRecuperado,
  revertirUltimaAccion,
} from './salidasExternasApi'

// 12:00 en Guatemala del 02/11/2026 (UTC-6).
const HOY_MEDIANOCHE = '2026-11-02T18:00:00.000Z'
const HOY_TEMPRANO = '2026-11-02T15:00:00.000Z'
const HOY_TARDE = '2026-11-02T16:00:00.000Z'
const AYER = '2026-11-01T18:00:00.000Z'

const BASE = {
  personaRetira: 'Ana Ramírez',
  motivo: 'Investigación universitaria',
  registradoPor: 'archivo-01',
}

function prestar(numeroExpediente, instante = HOY_MEDIANOCHE, extra = {}) {
  return registrarPrestamo({ ...BASE, numeroExpediente, instante, ...extra })
}

async function capturarError(promesa) {
  try {
    await promesa
  } catch (error) {
    return error
  }
  throw new Error('Se esperaba un error y la promesa se resolvió.')
}

beforeEach(() => {
  reiniciarSalidasExternasMock()
})

describe('almacén simulado', () => {
  it('expone la bandera de simulación y arranca vacío', async () => {
    expect(USANDO_DATOS_MOCK).toBe(true)
    await expect(listarHoy({ instante: HOY_MEDIANOCHE })).resolves.toEqual([])
    await expect(listarPendientes()).resolves.toEqual([])
    await expect(listarHistorial()).resolves.toEqual([])
  })

  it('se vacía con el reinicio del mock', async () => {
    await prestar('927581')
    expect(await listarHistorial()).toHaveLength(1)

    reiniciarSalidasExternasMock()

    expect(await listarHistorial()).toEqual([])
  })
})

describe('registro de préstamos', () => {
  it('registra un préstamo individual con fecha absoluta', async () => {
    const creado = await prestar('927581')

    expect(creado).toMatchObject({
      numeroExpediente: '927581',
      personaRetira: 'Ana Ramírez',
      motivo: 'Investigación universitaria',
      fechaSalida: HOY_MEDIANOCHE,
      fechaDevolucion: null,
      registradoPor: 'archivo-01',
      recuperadoManualmente: false,
      creadoEn: HOY_MEDIANOCHE,
    })
    expect(creado.id).toBeTruthy()
    expect(estadoDePrestamo(creado)).toBe('pendiente')
  })

  it('registra varios préstamos independientes sin lotes', async () => {
    const primero = await prestar('927581')
    const segundo = await prestar('30954')

    expect(primero.id).not.toBe(segundo.id)
    expect(primero).not.toHaveProperty('loteId')
    expect(await listarHistorial()).toHaveLength(2)
  })

  it('conserva persona y motivo normalizando espacios', async () => {
    const creado = await registrarPrestamo({
      numeroExpediente: '927581',
      personaRetira: '  Ana   María   López ',
      motivo: '  Tesis   de grado ',
      instante: HOY_MEDIANOCHE,
    })

    expect(creado.personaRetira).toBe('Ana María López')
    expect(creado.motivo).toBe('Tesis de grado')
    expect(creado.registradoPor).toBeNull()
  })

  it('normaliza el número y conserva la presentación del ingreso manual', async () => {
    const creado = await registrarPrestamo({
      ...BASE,
      numeroExpediente: '91-1330',
      presentacion: '91-1330',
      instante: HOY_MEDIANOCHE,
    })

    expect(creado.numeroExpediente).toBe('911330')
    expect(creado.numeroExpedientePresentacion).toBe('91-1330')
    await expect(buscarPendiente('911330')).resolves.toMatchObject({ id: creado.id })
  })

  it('rechaza letras y guiones en la captura normal', async () => {
    const conGuion = await capturarError(prestar('9275-81'))
    expect(conGuion.status).toBe(400)
    expect(conGuion.data).toEqual({ campo: 'numeroExpediente', error: 'caracteres_invalidos' })

    const conLetras = await capturarError(prestar('EXP-2024'))
    expect(conLetras.status).toBe(400)
  })

  it('rechaza un préstamo activo duplicado', async () => {
    const creado = await prestar('927581')
    const error = await capturarError(prestar('927581'))

    expect(error.status).toBe(409)
    expect(error.codigo).toBe(CODIGO_PRESTAMO_DUPLICADO)
    expect(error.data.registro.id).toBe(creado.id)
    expect(await listarHistorial()).toHaveLength(1)
  })

  it('permite un nuevo préstamo después de la devolución', async () => {
    const primero = await prestar('927581', HOY_TEMPRANO)
    await registrarDevolucion({ numeroExpediente: '927581', instante: HOY_MEDIANOCHE })
    const segundo = await prestar('927581', HOY_TARDE)

    const historial = await listarHistorial()
    expect(historial).toHaveLength(2)
    expect(segundo.id).not.toBe(primero.id)
    expect(historial.filter((r) => estadoDePrestamo(r) === 'pendiente')).toHaveLength(1)
  })

  it('rechaza entradas inválidas con 400', async () => {
    const sinPersona = await capturarError(
      registrarPrestamo({ numeroExpediente: '927581', motivo: 'Tesis', instante: HOY_MEDIANOCHE }),
    )
    expect(sinPersona.status).toBe(400)
    expect(sinPersona.codigo).toBe(CODIGO_ENTRADA_INVALIDA)
    expect(sinPersona.data).toEqual({ campo: 'personaRetira', error: 'requerido' })
    // Concordancia de género del mensaje (regresión conocida).
    expect(sinPersona.message).toBe('La persona que retira es obligatoria.')

    const sinNumero = await capturarError(
      registrarPrestamo({ ...BASE, numeroExpediente: '   ', instante: HOY_MEDIANOCHE }),
    )
    expect(sinNumero.status).toBe(400)
    expect(sinNumero.data.campo).toBe('numeroExpediente')

    const motivoCorto = await capturarError(
      registrarPrestamo({
        ...BASE,
        numeroExpediente: '927581',
        motivo: 'x',
        instante: HOY_MEDIANOCHE,
      }),
    )
    expect(motivoCorto.data).toEqual({ campo: 'motivo', error: 'muy_corto' })

    const fechaInvalida = await capturarError(prestar('927581', 'no-es-fecha'))
    expect(fechaInvalida.status).toBe(400)
    expect(fechaInvalida.codigo).toBe(CODIGO_FECHA_INVALIDA)
  })
})

describe('consultas y orden', () => {
  it('lista todos los pendientes sin importar la fecha', async () => {
    await prestar('111111', AYER)
    await prestar('222222', HOY_TEMPRANO)

    const pendientes = await listarPendientes()
    expect(pendientes.map((r) => r.numeroExpediente)).toEqual(['222222', '111111'])
  })

  it('la vista Hoy incluye pendientes anteriores y devoluciones del día', async () => {
    await prestar('111111', AYER) // pendiente de ayer
    await prestar('222222', '2026-11-01T15:00:00.000Z')
    await registrarDevolucion({ numeroExpediente: '222222', instante: '2026-11-01T20:00:00.000Z' })
    await prestar('333333', '2026-11-01T16:00:00.000Z')
    await registrarDevolucion({ numeroExpediente: '333333', instante: HOY_MEDIANOCHE })

    const hoy = await listarHoy({ instante: HOY_MEDIANOCHE })
    const numeros = hoy.map((r) => r.numeroExpediente)

    expect(numeros).toContain('333333') // devuelto hoy
    expect(numeros).toContain('111111') // pendiente de ayer
    expect(numeros).not.toContain('222222') // devuelto ayer
  })

  it('acepta una fecha de referencia explícita', async () => {
    await prestar('222222', '2026-11-01T15:00:00.000Z')
    await registrarDevolucion({ numeroExpediente: '222222', instante: '2026-11-01T20:00:00.000Z' })

    const ayer = await listarHoy({ fecha: '2026-11-01' })
    expect(ayer.map((r) => r.numeroExpediente)).toContain('222222')
  })

  it('rechaza referencias de fecha inválidas', async () => {
    const fecha = await capturarError(listarHoy({ fecha: '2026-02-31' }))
    expect(fecha.status).toBe(400)
    expect(fecha.codigo).toBe(CODIGO_FECHA_INVALIDA)

    const instante = await capturarError(listarHoy({ instante: 'x' }))
    expect(instante.status).toBe(400)
  })

  it('ordena por último movimiento, no solo por salida', async () => {
    // a: salió temprano pero se devolvió a las 12:00.
    await prestar('111111', HOY_TEMPRANO)
    await registrarDevolucion({ numeroExpediente: '111111', instante: HOY_MEDIANOCHE })
    // b: salió más tarde (16:00Z) y sigue pendiente.
    await prestar('222222', HOY_TARDE)

    const historial = await listarHistorial()
    expect(historial.map((r) => r.numeroExpediente)).toEqual(['111111', '222222'])
  })

  it('el historial conserva los registros cerrados', async () => {
    await prestar('111111', HOY_TEMPRANO)
    await registrarDevolucion({ numeroExpediente: '111111', instante: HOY_MEDIANOCHE })
    await prestar('222222', HOY_TARDE)

    expect(await listarHistorial()).toHaveLength(2)
  })
})

describe('búsqueda del préstamo pendiente', () => {
  it('devuelve el préstamo pendiente normalizado', async () => {
    const creado = await prestar('927581')
    await expect(buscarPendiente('927581')).resolves.toMatchObject({
      id: creado.id,
      personaRetira: 'Ana Ramírez',
    })
  })

  it('distingue sin pendiente (404) de ya devuelto (409)', async () => {
    const sinPendiente = await capturarError(buscarPendiente('555555'))
    expect(sinPendiente.status).toBe(404)
    expect(sinPendiente.codigo).toBe(CODIGO_SIN_PRESTAMO_PENDIENTE)

    const creado = await prestar('927581', HOY_TEMPRANO)
    await registrarDevolucion({ numeroExpediente: '927581', instante: HOY_MEDIANOCHE })

    const yaDevuelto = await capturarError(buscarPendiente('927581'))
    expect(yaDevuelto.status).toBe(409)
    expect(yaDevuelto.codigo).toBe(CODIGO_YA_DEVUELTO)
    expect(yaDevuelto.data.registro.id).toBe(creado.id)
  })

  it('rechaza números inválidos', async () => {
    const error = await capturarError(buscarPendiente(''))
    expect(error.status).toBe(400)
    expect(error.codigo).toBe(CODIGO_ENTRADA_INVALIDA)
  })
})

describe('devoluciones', () => {
  it('registra la devolución conservando los datos originales', async () => {
    const creado = await prestar('927581', HOY_TEMPRANO)
    const devuelto = await registrarDevolucion({
      numeroExpediente: '927581',
      instante: HOY_MEDIANOCHE,
    })

    expect(devuelto.id).toBe(creado.id)
    expect(devuelto.numeroExpediente).toBe('927581')
    expect(devuelto.personaRetira).toBe('Ana Ramírez')
    expect(devuelto.motivo).toBe('Investigación universitaria')
    expect(devuelto.fechaSalida).toBe(HOY_TEMPRANO)
    expect(devuelto.fechaDevolucion).toBe(HOY_MEDIANOCHE)
    expect(estadoDePrestamo(devuelto)).toBe('devuelto')
  })

  it('rechaza la doble devolución sin alterar la primera', async () => {
    await prestar('927581', HOY_TEMPRANO)
    await registrarDevolucion({ numeroExpediente: '927581', instante: HOY_MEDIANOCHE })

    const error = await capturarError(
      registrarDevolucion({ numeroExpediente: '927581', instante: '2026-11-02T20:00:00.000Z' }),
    )

    expect(error.status).toBe(409)
    expect(error.codigo).toBe(CODIGO_YA_DEVUELTO)
    const [registro] = await listarHistorial()
    expect(registro.fechaDevolucion).toBe(HOY_MEDIANOCHE)
  })

  it('rechaza devolver sin préstamo pendiente', async () => {
    const error = await capturarError(registrarDevolucion({ numeroExpediente: '555555' }))
    expect(error.status).toBe(404)
    expect(error.codigo).toBe(CODIGO_SIN_PRESTAMO_PENDIENTE)
  })

  it('rechaza una devolución anterior a la salida', async () => {
    await prestar('927581', HOY_TEMPRANO)
    const error = await capturarError(
      registrarDevolucion({ numeroExpediente: '927581', instante: AYER }),
    )

    expect(error.status).toBe(400)
    expect(error.codigo).toBe(CODIGO_FECHA_INVALIDA)
  })
})

describe('recuperación manual', () => {
  it('conserva la fecha y hora originales de salida', async () => {
    const recuperado = await registrarRecuperado({
      ...BASE,
      numeroExpediente: '927581',
      fechaSalida: '2026-10-30',
      horaSalida: '09:15',
      instanteRecuperacion: HOY_MEDIANOCHE,
    })

    const salidaEsperada = instanteDesdeFechaHoraGuatemala('2026-10-30', '09:15').toISOString()
    expect(recuperado.fechaSalida).toBe(salidaEsperada)
    expect(recuperado.fechaSalida).toBe('2026-10-30T15:15:00.000Z')
    expect(recuperado.creadoEn).toBe(HOY_MEDIANOCHE)
    expect(recuperado.fechaDevolucion).toBeNull()
    expect(estadoDePrestamo(recuperado)).toBe('pendiente')
  })

  it('marca el registro como recuperado y no como préstamo normal', async () => {
    const recuperado = await registrarRecuperado({
      ...BASE,
      numeroExpediente: '927581',
      fechaSalida: '2026-10-30',
      horaSalida: '09:15',
      instanteRecuperacion: HOY_MEDIANOCHE,
    })
    const normal = await prestar('30954')

    expect(recuperado.recuperadoManualmente).toBe(true)
    expect(normal.recuperadoManualmente).toBe(false)
  })

  it('usa medianoche de Guatemala cuando no se indica hora', async () => {
    const recuperado = await registrarRecuperado({
      ...BASE,
      numeroExpediente: '927581',
      fechaSalida: '2026-10-30',
      instanteRecuperacion: HOY_MEDIANOCHE,
    })

    expect(recuperado.fechaSalida).toBe('2026-10-30T06:00:00.000Z')
  })

  it('no lo contabiliza como salida del día de recuperación', async () => {
    const recuperado = await registrarRecuperado({
      ...BASE,
      numeroExpediente: '927581',
      fechaSalida: '2026-10-30',
      horaSalida: '09:15',
      instanteRecuperacion: HOY_MEDIANOCHE,
    })

    const reporte = clasificarReporteCierre(await listarHistorial(), { fecha: '2026-11-02' })

    expect(reporte.salidasDelDia).toHaveLength(0)
    expect(reporte.pendientesAlCorte.map((r) => r.id)).toContain(recuperado.id)
  })

  it('rechaza el duplicado activo durante la recuperación', async () => {
    const creado = await prestar('927581')
    const error = await capturarError(
      registrarRecuperado({
        ...BASE,
        numeroExpediente: '927581',
        fechaSalida: '2026-10-30',
        horaSalida: '09:15',
        instanteRecuperacion: HOY_MEDIANOCHE,
      }),
    )

    expect(error.status).toBe(409)
    expect(error.codigo).toBe(CODIGO_PRESTAMO_DUPLICADO)
    expect(error.data.registro.id).toBe(creado.id)
  })

  it('rechaza fechas y horas imposibles', async () => {
    const fechaImposible = await capturarError(
      registrarRecuperado({
        ...BASE,
        numeroExpediente: '927581',
        fechaSalida: '2026-02-31',
        instanteRecuperacion: HOY_MEDIANOCHE,
      }),
    )
    expect(fechaImposible.status).toBe(400)
    expect(fechaImposible.codigo).toBe(CODIGO_FECHA_INVALIDA)

    const horaImposible = await capturarError(
      registrarRecuperado({
        ...BASE,
        numeroExpediente: '927581',
        fechaSalida: '2026-10-30',
        horaSalida: '24:00',
        instanteRecuperacion: HOY_MEDIANOCHE,
      }),
    )
    expect(horaImposible.status).toBe(400)

    const futura = await capturarError(
      registrarRecuperado({
        ...BASE,
        numeroExpediente: '927581',
        fechaSalida: '2026-11-05',
        horaSalida: '09:00',
        instanteRecuperacion: HOY_MEDIANOCHE,
      }),
    )
    expect(futura.status).toBe(400)
    expect(futura.codigo).toBe(CODIGO_FECHA_INVALIDA)
  })
})

describe('aislamiento y concurrencia', () => {
  it('las lecturas devuelven copias que no alteran el almacén', async () => {
    await prestar('927581')

    const lista = await listarHistorial()
    lista[0].personaRetira = 'Alterado'
    lista.push({ id: 'intruso' })

    const [registro] = await listarHistorial()
    expect(registro.personaRetira).toBe('Ana Ramírez')
    expect(await listarHistorial()).toHaveLength(1)
  })

  it('el registro devuelto por el alta es una copia', async () => {
    const creado = await prestar('927581')
    creado.motivo = 'Alterado'

    const [registro] = await listarHistorial()
    expect(registro.motivo).toBe('Investigación universitaria')
  })

  it('dos intentos concurrentes no crean dos préstamos activos', async () => {
    const resultados = await Promise.allSettled([prestar('927581'), prestar('927581')])

    const cumplidos = resultados.filter((r) => r.status === 'fulfilled')
    const rechazados = resultados.filter((r) => r.status === 'rejected')

    expect(cumplidos).toHaveLength(1)
    expect(rechazados).toHaveLength(1)
    expect(rechazados[0].reason.status).toBe(409)
    expect(rechazados[0].reason.codigo).toBe(CODIGO_PRESTAMO_DUPLICADO)
    expect(await listarHistorial()).toHaveLength(1)
  })
})

describe('vista de devueltos', () => {
  it('lista solo los devueltos, de cualquier fecha', async () => {
    await prestar('111111', AYER)
    await registrarDevolucion({ numeroExpediente: '111111', instante: HOY_TEMPRANO })
    await prestar('222222', HOY_TARDE)

    const devueltos = await listarDevueltos()

    expect(devueltos.map((r) => r.numeroExpediente)).toEqual(['111111'])
  })
})

describe('última acción y reversión', () => {
  it('expone la última acción exitosa', async () => {
    expect(await obtenerUltimaAccion()).toBeNull()

    const creado = await prestar('927581')
    const accion = await obtenerUltimaAccion()

    expect(accion.tipo).toBe('prestamo')
    expect(accion.registro.id).toBe(creado.id)
  })

  it('revierte un préstamo recién registrado', async () => {
    const creado = await prestar('927581')

    const resultado = await revertirUltimaAccion()

    expect(resultado.tipo).toBe('prestamo')
    expect(resultado.registro.id).toBe(creado.id)
    expect(await listarHistorial()).toEqual([])
    expect(await obtenerUltimaAccion()).toBeNull()
  })

  it('revierte una devolución y restaura el pendiente', async () => {
    const creado = await prestar('927581', HOY_TEMPRANO)
    await registrarDevolucion({ numeroExpediente: '927581', instante: HOY_MEDIANOCHE })

    const resultado = await revertirUltimaAccion()

    expect(resultado.tipo).toBe('devolucion')
    expect(resultado.registro.fechaDevolucion).toBeNull()

    const [registro] = await listarHistorial()
    expect(registro.id).toBe(creado.id)
    expect(registro.fechaDevolucion).toBeNull()
    expect(registro.personaRetira).toBe('Ana Ramírez')
    expect(registro.fechaSalida).toBe(HOY_TEMPRANO)
  })

  it('revierte una recuperación manual', async () => {
    const recuperado = await registrarRecuperado({
      ...BASE,
      numeroExpediente: '927581',
      fechaSalida: '2026-10-30',
      horaSalida: '09:15',
      instanteRecuperacion: HOY_MEDIANOCHE,
    })

    const resultado = await revertirUltimaAccion()

    expect(resultado.tipo).toBe('recuperacion')
    expect(resultado.registro.id).toBe(recuperado.id)
    expect(await listarHistorial()).toEqual([])
  })

  it('solo permite revertir la última acción', async () => {
    await prestar('111111', HOY_TEMPRANO)
    await prestar('222222', HOY_TARDE)

    const resultado = await revertirUltimaAccion()

    expect(resultado.registro.numeroExpediente).toBe('222222')
    expect((await listarHistorial()).map((r) => r.numeroExpediente)).toEqual(['111111'])
  })

  it('rechaza la doble reversión', async () => {
    await prestar('927581')
    await revertirUltimaAccion()

    const error = await capturarError(revertirUltimaAccion())

    expect(error.status).toBe(409)
    expect(error.codigo).toBe(CODIGO_NADA_QUE_REVERTIR)
  })

  it('permite devolver de nuevo después de revertir la devolución', async () => {
    await prestar('927581', HOY_TEMPRANO)
    await registrarDevolucion({ numeroExpediente: '927581', instante: HOY_TARDE })
    await revertirUltimaAccion()

    const devuelto = await registrarDevolucion({
      numeroExpediente: '927581',
      instante: HOY_MEDIANOCHE,
    })

    expect(devuelto.fechaDevolucion).toBe(HOY_MEDIANOCHE)
  })
})

describe('efecto de la reversión en el reporte', () => {
  it('un préstamo revertido no aparece en el reporte', async () => {
    await prestar('927581', HOY_TEMPRANO)
    await revertirUltimaAccion()

    const reporte = clasificarReporteCierre(await listarHistorial(), {
      fecha: '2026-11-02',
      instanteCorte: HOY_MEDIANOCHE,
    })

    expect(reporte.salidasDelDia).toEqual([])
    expect(reporte.pendientesAlCorte).toEqual([])
  })

  it('una devolución revertida vuelve a contar como pendiente', async () => {
    await prestar('927581', HOY_TEMPRANO)
    await registrarDevolucion({ numeroExpediente: '927581', instante: HOY_TARDE })
    await revertirUltimaAccion()

    const reporte = clasificarReporteCierre(await listarHistorial(), {
      fecha: '2026-11-02',
      instanteCorte: HOY_MEDIANOCHE,
    })

    expect(reporte.devolucionesDelDia).toEqual([])
    expect(reporte.pendientesAlCorte).toHaveLength(1)
  })
})

describe('identidad normalizada del ingreso manual', () => {
  it('detecta duplicados aunque el guion esté en otra posición', async () => {
    await registrarPrestamo({
      ...BASE,
      numeroExpediente: '91-1330',
      presentacion: '91-1330',
      instante: HOY_MEDIANOCHE,
    })

    const error = await capturarError(
      registrarPrestamo({
        ...BASE,
        numeroExpediente: '9113-30',
        presentacion: '9113-30',
        instante: HOY_MEDIANOCHE,
      }),
    )

    expect(error.status).toBe(409)
    expect(error.codigo).toBe(CODIGO_PRESTAMO_DUPLICADO)
    expect(await listarHistorial()).toHaveLength(1)
  })
})
