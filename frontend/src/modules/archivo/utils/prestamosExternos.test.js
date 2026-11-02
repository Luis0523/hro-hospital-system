import { describe, expect, it } from 'vitest'
import { formatearExpediente } from '@/shared/utils/expediente'
import {
  buscarPrestamoActivo,
  buscarRegistros,
  clasificarReporteCierre,
  diasDeAntiguedad,
  esDevuelto,
  esPendiente,
  estadoDePrestamo,
  estabaPendienteAlCorte,
  evaluarDevolucion,
  evaluarRegistroPrestamo,
  filtrarVistaDiaria,
  interpretarExpedienteManual,
  normalizarNumeroExpediente,
  normalizarParaBusqueda,
  numeroExpedienteVisible,
  obtenerDevueltos,
  obtenerHistorial,
  obtenerPendientes,
  ordenarPorMovimientoReciente,
  resolverNumeroExpedienteCapturado,
  ultimoMovimientoDe,
  validarMotivo,
  validarNumeroExpediente,
  validarPersonaRetira,
} from './prestamosExternos'

function registro(overrides = {}) {
  return {
    id: 'se-1',
    numeroExpediente: '927581',
    personaRetira: 'Ana Ramírez',
    motivo: 'Tesis',
    fechaSalida: '2026-11-02T15:30:00.000Z', // 09:30 Guatemala, 02/11
    fechaDevolucion: null,
    registradoPor: 'Personal de Archivo',
    recuperadoManualmente: false,
    ...overrides,
  }
}

describe('normalización y validación de expediente', () => {
  it('normaliza espacios y el guion de presentación', () => {
    expect(normalizarNumeroExpediente(' 9275-81 ')).toBe('927581')
    expect(normalizarNumeroExpediente('927 581')).toBe('927581')
    expect(normalizarNumeroExpediente('927581\r\n')).toBe('927581')
    expect(normalizarNumeroExpediente(927581)).toBe('927581')
  })

  it('es coherente con la utilidad de presentación compartida', () => {
    expect(formatearExpediente(normalizarNumeroExpediente('9275-81'))).toBe('9275-81')
    expect(formatearExpediente(normalizarNumeroExpediente('3095-4'))).toBe('3095-4')
  })

  it('conserva códigos no numéricos sin inventar formatos', () => {
    expect(normalizarNumeroExpediente('EXP-2024-035')).toBe('EXP-2024-035')
    expect(normalizarNumeroExpediente('exp-2024-035')).toBe('exp-2024-035')
  })

  it('devuelve cadena vacía con entradas ausentes', () => {
    expect(normalizarNumeroExpediente(null)).toBe('')
    expect(normalizarNumeroExpediente(undefined)).toBe('')
    expect(normalizarNumeroExpediente('   ')).toBe('')
  })

  it('valida requerido y longitud máxima del esquema (30)', () => {
    expect(validarNumeroExpediente('')).toEqual({
      valido: false,
      valor: '',
      error: 'requerido',
    })
    expect(validarNumeroExpediente('9'.repeat(30)).valido).toBe(true)
    expect(validarNumeroExpediente('9'.repeat(31))).toEqual({
      valido: false,
      valor: '9'.repeat(31),
      error: 'muy_largo',
    })
  })
})

describe('validación de persona y motivo', () => {
  it('normaliza espacios internos y extremos', () => {
    expect(validarPersonaRetira('  Ana   María  ')).toEqual({
      valido: true,
      valor: 'Ana María',
      error: null,
    })
    expect(validarMotivo('  Tesis   de grado ')).toEqual({
      valido: true,
      valor: 'Tesis de grado',
      error: null,
    })
  })

  it('exige ambos campos', () => {
    expect(validarPersonaRetira('   ')).toEqual({ valido: false, valor: '', error: 'requerido' })
    expect(validarMotivo(null)).toEqual({ valido: false, valor: '', error: 'requerido' })
  })

  it('rechaza textos demasiado cortos o largos', () => {
    expect(validarPersonaRetira(' Al ').error).toBe('muy_corto')
    expect(validarMotivo('x').error).toBe('muy_corto')
    expect(validarPersonaRetira('A'.repeat(121)).error).toBe('muy_largo')
    expect(validarMotivo('M'.repeat(121)).error).toBe('muy_largo')
  })

  it('no prohíbe caracteres propios de nombres reales', () => {
    const nombre = "O'Brien-Núñez Pérez"
    expect(validarPersonaRetira(nombre)).toEqual({ valido: true, valor: nombre, error: null })
  })
})

describe('estado del préstamo', () => {
  it('se deriva de la fecha de devolución', () => {
    expect(estadoDePrestamo(registro())).toBe('pendiente')
    expect(estadoDePrestamo(registro({ fechaDevolucion: '2026-11-03T15:00:00.000Z' }))).toBe(
      'devuelto',
    )
    expect(esPendiente(registro())).toBe(true)
    expect(esDevuelto(registro())).toBe(false)
  })

  it('no crea estados adicionales para registros recuperados', () => {
    const recuperado = registro({ recuperadoManualmente: true })
    expect(estadoDePrestamo(recuperado)).toBe('pendiente')
  })

  it('devuelve null con registros inválidos', () => {
    expect(estadoDePrestamo(null)).toBeNull()
    expect(estadoDePrestamo('x')).toBeNull()
  })
})

describe('duplicados', () => {
  const activo = registro({ id: 'activo' })
  const devuelto = registro({
    id: 'devuelto',
    fechaSalida: '2026-10-20T15:00:00.000Z',
    fechaDevolucion: '2026-10-21T15:00:00.000Z',
  })

  it('detecta un préstamo activo comparando números normalizados', () => {
    expect(buscarPrestamoActivo([activo], '9275-81')?.id).toBe('activo')
    expect(buscarPrestamoActivo([devuelto], '927581')).toBeNull()
    expect(buscarPrestamoActivo([], '927581')).toBeNull()
  })

  it('bloquea un segundo préstamo mientras el anterior está activo', () => {
    const resultado = evaluarRegistroPrestamo([activo], '927581')
    expect(resultado).toMatchObject({
      permitido: false,
      motivo: 'duplicado_activo',
      numeroExpediente: '927581',
    })
    expect(resultado.registro?.id).toBe('activo')
  })

  it('permite un nuevo préstamo cuando el anterior ya fue devuelto', () => {
    expect(evaluarRegistroPrestamo([devuelto], '927581')).toMatchObject({
      permitido: true,
      motivo: null,
      registro: null,
    })
  })

  it('detecta entradas inválidas', () => {
    expect(evaluarRegistroPrestamo([], '   ')).toMatchObject({
      permitido: false,
      motivo: 'invalido',
      error: 'requerido',
    })
    expect(evaluarDevolucion([], '')).toMatchObject({
      permitido: false,
      motivo: 'invalido',
      error: 'requerido',
    })
  })

  it('distingue devolución posible, ya devuelto y sin pendiente', () => {
    expect(evaluarDevolucion([activo], '927581')).toMatchObject({
      permitido: true,
      registro: { id: 'activo' },
    })
    expect(evaluarDevolucion([devuelto], '927581')).toMatchObject({
      permitido: false,
      motivo: 'ya_devuelto',
      registro: { id: 'devuelto' },
    })
    expect(evaluarDevolucion([], '555555')).toMatchObject({
      permitido: false,
      motivo: 'sin_pendiente',
      registro: null,
    })
  })
})

describe('orden de movimientos', () => {
  it('usa la devolución cuando existe y la salida cuando no', () => {
    expect(ultimoMovimientoDe(registro())).toBe(Date.parse('2026-11-02T15:30:00.000Z'))
    expect(ultimoMovimientoDe(registro({ fechaDevolucion: '2026-11-04T15:00:00.000Z' }))).toBe(
      Date.parse('2026-11-04T15:00:00.000Z'),
    )
  })

  it('coloca el préstamo más reciente primero', () => {
    const viejo = registro({ id: 'viejo', fechaSalida: '2026-11-01T15:00:00.000Z' })
    const nuevo = registro({ id: 'nuevo', fechaSalida: '2026-11-02T12:00:00.000Z' })

    expect(ordenarPorMovimientoReciente([viejo, nuevo]).map((r) => r.id)).toEqual([
      'nuevo',
      'viejo',
    ])
  })

  it('sube al inicio una devolución reciente', () => {
    const devueltoHoy = registro({
      id: 'devuelto-hoy',
      fechaSalida: '2026-11-01T15:00:00.000Z',
      fechaDevolucion: '2026-11-02T16:00:00.000Z',
    })
    const prestadoHoy = registro({ id: 'prestado-hoy', fechaSalida: '2026-11-02T15:00:00.000Z' })

    expect(ordenarPorMovimientoReciente([prestadoHoy, devueltoHoy]).map((r) => r.id)).toEqual([
      'devuelto-hoy',
      'prestado-hoy',
    ])
  })

  it('desempata de forma determinista por expediente', () => {
    const mismoInstante = '2026-11-02T15:00:00.000Z'
    const b = registro({ id: 'b', numeroExpediente: '888888', fechaSalida: mismoInstante })
    const a = registro({ id: 'a', numeroExpediente: '111111', fechaSalida: mismoInstante })

    expect(ordenarPorMovimientoReciente([b, a]).map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('no muta el arreglo original', () => {
    const viejo = registro({ id: 'viejo', fechaSalida: '2026-11-01T15:00:00.000Z' })
    const nuevo = registro({ id: 'nuevo', fechaSalida: '2026-11-02T15:00:00.000Z' })
    const original = [viejo, nuevo]

    const resultado = ordenarPorMovimientoReciente(original)

    expect(original.map((r) => r.id)).toEqual(['viejo', 'nuevo'])
    expect(resultado).not.toBe(original)
    expect(resultado.map((r) => r.id)).toEqual(['nuevo', 'viejo'])
  })
})

describe('vista diaria, pendientes e historial', () => {
  const salidaHoy = registro({ id: 'salida-hoy', fechaSalida: '2026-11-02T15:30:00.000Z' })
  const devueltoHoy = registro({
    id: 'devuelto-hoy',
    fechaSalida: '2026-11-01T15:00:00.000Z',
    fechaDevolucion: '2026-11-02T16:00:00.000Z',
  })
  const pendienteAyer = registro({ id: 'pendiente-ayer', fechaSalida: '2026-10-30T14:00:00.000Z' })
  const devueltoAyer = registro({
    id: 'devuelto-ayer',
    fechaSalida: '2026-11-01T14:00:00.000Z',
    fechaDevolucion: '2026-11-01T20:00:00.000Z',
  })
  const todos = [devueltoAyer, salidaHoy, pendienteAyer, devueltoHoy]

  it('incluye salidas del día, devoluciones del día y pendientes antiguos', () => {
    expect(filtrarVistaDiaria(todos, '2026-11-02').map((r) => r.id)).toEqual([
      'devuelto-hoy',
      'salida-hoy',
      'pendiente-ayer',
    ])
  })

  it('excluye los devueltos de días anteriores', () => {
    expect(filtrarVistaDiaria(todos, '2026-11-02').map((r) => r.id)).not.toContain('devuelto-ayer')
  })

  it('permite calcular la vista para otra fecha', () => {
    // El 01/11 también incluye los pendientes de cualquier fecha.
    expect(filtrarVistaDiaria(todos, '2026-11-01').map((r) => r.id)).toEqual([
      'devuelto-hoy',
      'salida-hoy',
      'devuelto-ayer',
      'pendiente-ayer',
    ])
  })

  it('devuelve vacío con fecha inválida o sin registros', () => {
    expect(filtrarVistaDiaria(todos, '31-12-2026')).toEqual([])
    expect(filtrarVistaDiaria([], '2026-11-02')).toEqual([])
    expect(filtrarVistaDiaria(null, '2026-11-02')).toEqual([])
  })

  it('selecciona pendientes e historial completo', () => {
    expect(obtenerPendientes(todos).map((r) => r.id)).toEqual(['salida-hoy', 'pendiente-ayer'])
    expect(obtenerHistorial(todos)).toHaveLength(4)
    expect(obtenerPendientes([])).toEqual([])
    expect(obtenerHistorial(null)).toEqual([])
  })

  it('busca por expediente formateado, persona sin acentos y motivo', () => {
    expect(buscarRegistros(todos, '9275-81').length).toBe(4)
    expect(buscarRegistros(todos, 'ramirez').map((r) => r.id)).toContain('salida-hoy')
    expect(buscarRegistros(todos, 'tesis').length).toBe(4)
    expect(buscarRegistros(todos, '  ').length).toBe(4)
    expect(buscarRegistros(todos, 'no-existe')).toEqual([])
    expect(normalizarParaBusqueda('Oncología')).toBe('oncologia')
  })
})

describe('reporte de cierre', () => {
  const prestadoHoy = registro({ id: 'prestado-hoy', fechaSalida: '2026-11-02T15:30:00.000Z' })
  const devueltoHoy = registro({
    id: 'devuelto-hoy',
    fechaSalida: '2026-11-01T15:00:00.000Z',
    fechaDevolucion: '2026-11-02T16:00:00.000Z',
  })
  const pendienteAntiguo = registro({
    id: 'pendiente-antiguo',
    fechaSalida: '2026-10-30T14:00:00.000Z',
  })
  const devueltoAlDiaSiguiente = registro({
    id: 'devuelto-al-dia-siguiente',
    fechaSalida: '2026-11-02T18:00:00.000Z',
    fechaDevolucion: '2026-11-03T15:00:00.000Z',
  })
  const devueltoAntes = registro({
    id: 'devuelto-antes',
    fechaSalida: '2026-11-01T14:00:00.000Z',
    fechaDevolucion: '2026-11-01T20:00:00.000Z',
  })
  const todos = [prestadoHoy, devueltoHoy, pendienteAntiguo, devueltoAlDiaSiguiente, devueltoAntes]

  it('separa salidas y devoluciones del día con totales', () => {
    const reporte = clasificarReporteCierre(todos, { fecha: '2026-11-02' })

    expect(reporte.fecha).toBe('2026-11-02')
    expect(reporte.instanteCorte).toBe('2026-11-03T05:59:59.999Z')
    expect(reporte.salidasDelDia.map((r) => r.id)).toEqual([
      'devuelto-al-dia-siguiente',
      'prestado-hoy',
    ])
    expect(reporte.devolucionesDelDia.map((r) => r.id)).toEqual(['devuelto-hoy'])
    expect(reporte.totales).toEqual({ salidas: 2, devoluciones: 1, pendientes: 3 })
  })

  it('incluye al cierre los pendientes de días anteriores', () => {
    const reporte = clasificarReporteCierre(todos, { fecha: '2026-11-02' })

    expect(reporte.pendientesAlCorte.map((r) => r.id)).toEqual([
      'devuelto-al-dia-siguiente',
      'prestado-hoy',
      'pendiente-antiguo',
    ])
  })

  it('trata como pendiente al cierre lo devuelto al día siguiente', () => {
    const reporte = clasificarReporteCierre(todos, { fecha: '2026-11-02' })

    expect(reporte.pendientesAlCorte.map((r) => r.id)).toContain('devuelto-al-dia-siguiente')
    expect(reporte.devolucionesDelDia.map((r) => r.id)).not.toContain('devuelto-al-dia-siguiente')
  })

  it('calcula correctamente un reporte histórico posterior', () => {
    const reporte = clasificarReporteCierre(todos, { fecha: '2026-11-03' })

    expect(reporte.salidasDelDia).toEqual([])
    expect(reporte.devolucionesDelDia.map((r) => r.id)).toEqual(['devuelto-al-dia-siguiente'])
    expect(reporte.pendientesAlCorte.map((r) => r.id)).toEqual([
      'prestado-hoy',
      'pendiente-antiguo',
    ])
    expect(reporte.totales).toEqual({ salidas: 0, devoluciones: 1, pendientes: 2 })
  })

  it('respeta un instante de corte explícito', () => {
    const reporte = clasificarReporteCierre(todos, {
      fecha: '2026-11-02',
      instanteCorte: '2026-11-02T16:30:00.000Z',
    })

    expect(reporte.instanteCorte).toBe('2026-11-02T16:30:00.000Z')
    expect(reporte.pendientesAlCorte.map((r) => r.id)).toEqual([
      'prestado-hoy',
      'pendiente-antiguo',
    ])
  })

  it('evalúa pendientes por fechas y no por el estado actual', () => {
    const corte = '2026-11-02T16:30:00.000Z'

    expect(estabaPendienteAlCorte(devueltoAntes, corte)).toBe(false)
    expect(estabaPendienteAlCorte(prestadoHoy, corte)).toBe(true)
    expect(estabaPendienteAlCorte(devueltoAlDiaSiguiente, corte)).toBe(false)
    expect(estabaPendienteAlCorte(null, corte)).toBe(false)
  })

  it('no considera pendiente una devolución exactamente en el corte', () => {
    const registroJusto = registro({
      id: 'justo',
      fechaSalida: '2026-10-30T14:00:00.000Z',
      fechaDevolucion: '2026-11-02T16:30:00.000Z',
    })

    expect(estabaPendienteAlCorte(registroJusto, '2026-11-02T16:30:00.000Z')).toBe(false)
  })

  it('calcula la antigüedad del préstamo respecto al corte', () => {
    expect(diasDeAntiguedad(pendienteAntiguo, '2026-11-02T18:00:00.000Z')).toBe(3)
    expect(diasDeAntiguedad(prestadoHoy, '2026-11-02T18:00:00.000Z')).toBe(0)
    expect(diasDeAntiguedad(null, '2026-11-02T18:00:00.000Z')).toBeNull()
    expect(diasDeAntiguedad(registro({ fechaSalida: 'x' }), '2026-11-02T18:00:00.000Z')).toBeNull()
  })

  it('devuelve un reporte vacío sin fecha válida', () => {
    expect(clasificarReporteCierre(todos, { fecha: '2026-02-31' })).toEqual({
      fecha: null,
      instanteCorte: null,
      salidasDelDia: [],
      devolucionesDelDia: [],
      pendientesAlCorte: [],
      totales: { salidas: 0, devoluciones: 0, pendientes: 0 },
    })
    expect(clasificarReporteCierre(todos).totales).toEqual({
      salidas: 0,
      devoluciones: 0,
      pendientes: 0,
    })
  })
})

describe('captura y presentación del expediente', () => {
  it('acepta solo dígitos en la captura por teclado o escáner', () => {
    expect(validarNumeroExpediente('927581')).toEqual({
      valido: true,
      valor: '927581',
      error: null,
    })
    expect(validarNumeroExpediente('9275-81').error).toBe('caracteres_invalidos')
    expect(validarNumeroExpediente('EXP-2024').error).toBe('caracteres_invalidos')
    expect(validarNumeroExpediente('927 581').error).toBe('caracteres_invalidos')
  })

  it('interpreta el ingreso manual con un único guion', () => {
    expect(interpretarExpedienteManual('91-1330')).toEqual({
      valido: true,
      numero: '911330',
      presentacion: '91-1330',
      error: null,
    })
  })

  it('no considera distintos dos números con el guion en otra posición', () => {
    const primero = interpretarExpedienteManual('91-1330')
    const segundo = interpretarExpedienteManual('9113-30')
    expect(primero.numero).toBe(segundo.numero)
    expect(primero.presentacion).not.toBe(segundo.presentacion)
  })

  it('rechaza guiones inválidos', () => {
    expect(interpretarExpedienteManual('-911330').error).toBe('guion_invalido')
    expect(interpretarExpedienteManual('911330-').error).toBe('guion_invalido')
    expect(interpretarExpedienteManual('91-13-30').error).toBe('guion_invalido')
    expect(interpretarExpedienteManual('91a1330').error).toBe('caracteres_invalidos')
    expect(interpretarExpedienteManual('').error).toBe('requerido')
  })

  it('muestra la presentación manual y, si no existe, el formato estándar', () => {
    expect(
      numeroExpedienteVisible({
        numeroExpediente: '911330',
        numeroExpedientePresentacion: '91-1330',
      }),
    ).toBe('91-1330')
    expect(numeroExpedienteVisible({ numeroExpediente: '927581' })).toBe('9275-81')
    expect(numeroExpedienteVisible(null)).toBe('')
  })

  it('resuelve la captura para consultar la existencia del expediente', () => {
    // Teclado/escáner: solo dígitos.
    expect(resolverNumeroExpedienteCapturado('927581')).toBe('927581')
    expect(resolverNumeroExpedienteCapturado(' 927581 ')).toBe('927581')
    expect(resolverNumeroExpedienteCapturado('9275-81')).toBeNull()
    expect(resolverNumeroExpedienteCapturado('')).toBeNull()

    // Ingreso manual: se conserva el guion solo para mostrar; se consulta sin él.
    expect(resolverNumeroExpedienteCapturado('91-1330', '91-1330')).toBe('911330')
    expect(resolverNumeroExpedienteCapturado('911330', '9113-30')).toBe('911330')
    expect(resolverNumeroExpedienteCapturado('91-13-30', '91-13-30')).toBeNull()
    expect(resolverNumeroExpedienteCapturado('911330', '911330-')).toBeNull()
  })

  it('rechaza números en la persona y acepta signos de nombres reales', () => {
    expect(validarPersonaRetira('Ana 123').error).toBe('caracteres_invalidos')
    expect(validarPersonaRetira('Ana 1').error).toBe('caracteres_invalidos')
    expect(validarPersonaRetira("O'Brien-Núñez Pérez").valido).toBe(true)
    expect(validarPersonaRetira('María José de la Cruz').valido).toBe(true)
  })
})

describe('vista de devueltos', () => {
  it('incluye solo devueltos de cualquier fecha, ordenados por último movimiento', () => {
    const devueltoAyer = registro({
      id: 'a',
      numeroExpediente: '111111',
      fechaSalida: '2026-11-01T15:00:00.000Z',
      fechaDevolucion: '2026-11-01T20:00:00.000Z',
    })
    const devueltoHoy = registro({
      id: 'b',
      numeroExpediente: '222222',
      fechaSalida: '2026-10-30T15:00:00.000Z',
      fechaDevolucion: '2026-11-02T16:00:00.000Z',
    })
    const pendiente = registro({ id: 'c', numeroExpediente: '333333' })

    expect(obtenerDevueltos([devueltoAyer, pendiente, devueltoHoy]).map((r) => r.id)).toEqual([
      'b',
      'a',
    ])
    expect(obtenerDevueltos(null)).toEqual([])
  })
})
