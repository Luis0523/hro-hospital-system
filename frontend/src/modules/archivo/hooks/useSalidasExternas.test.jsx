import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

// Se conserva la implementación real de la API; solo se envuelven dos
// funciones para poder inyectar fallos puntuales en las pruebas.
vi.mock('../api/salidasExternasApi', async (importOriginal) => {
  const modulo = await importOriginal()
  return {
    ...modulo,
    listarPendientes: vi.fn(modulo.listarPendientes),
    registrarPrestamo: vi.fn(modulo.registrarPrestamo),
  }
})

vi.mock('../api/verificacionExpedienteApi', async (importOriginal) => {
  const modulo = await importOriginal()
  return {
    ...modulo,
    verificarExistenciaExpediente: vi.fn(modulo.verificarExistenciaExpediente),
  }
})

vi.mock('../api/nombrePacienteExpedienteApi', async (importOriginal) => {
  const modulo = await importOriginal()
  return {
    ...modulo,
    obtenerNombrePacienteDeExpediente: vi.fn(modulo.obtenerNombrePacienteDeExpediente),
  }
})

import { CODIGO_ENTRADA_INVALIDA, CODIGO_YA_DEVUELTO } from '../api/salidasExternasApi'
import {
  CODIGO_EXPEDIENTE_NO_ENCONTRADO,
  CODIGO_VERIFICACION_FALLIDA,
  MODO_VERIFICACION_DESHABILITADA,
  MODO_VERIFICACION_REAL,
  VERIFICACION_DESHABILITADA,
  VERIFICACION_ENCONTRADO,
  VERIFICACION_ERROR_CONEXION,
  VERIFICACION_NO_ENCONTRADO,
  verificarExistenciaExpediente,
} from '../api/verificacionExpedienteApi'
import {
  listarHistorial,
  listarPendientes as listarPendientesMock,
  registrarDevolucion,
  registrarPrestamo,
} from '../api/salidasExternasApi'
import { obtenerNombrePacienteDeExpediente } from '../api/nombrePacienteExpedienteApi'
import { reiniciarSalidasExternasMock } from '../api/salidasExternasMock'
import { useSalidasExternas } from './useSalidasExternas'

// 12:00 en Guatemala del 02/11/2026 (UTC-6).
const HOY = '2026-11-02T18:00:00.000Z'
const HOY_TEMPRANO = '2026-11-02T15:00:00.000Z'
const AYER = '2026-11-01T18:00:00.000Z'

const BASE = {
  personaRetira: 'Ana Ramírez',
  motivo: 'Investigación universitaria',
  registradoPor: 'archivo-01',
}

function sembrar(numeroExpediente, instante = HOY_TEMPRANO, extra = {}) {
  return registrarPrestamo({ ...BASE, numeroExpediente, instante, ...extra })
}

function numeros(lista) {
  return lista.map((registro) => registro.numeroExpediente)
}

function promesaDiferida() {
  let resolver
  const promesa = new Promise((res) => {
    resolver = res
  })
  return { promesa, resolver }
}

function completarPrestamo(result, numero = '927581', persona = 'Ana Ramírez') {
  act(() => {
    result.current.setPersonaRetira(persona)
    result.current.setMotivo('Investigación universitaria')
    result.current.setNumeroPrestamo(numero)
  })
}

function activarVerificacionReal() {
  vi.stubEnv('VITE_VERIFICACION_EXPEDIENTES', 'true')
  vi.stubEnv('VITE_USE_MOCK', 'false')
}

async function montar(opciones) {
  const utilidades = renderHook(() => useSalidasExternas(opciones))
  await waitFor(() => expect(utilidades.result.current.cargando).toBe(false))
  return utilidades
}

describe('useSalidasExternas', () => {
  beforeEach(() => {
    // Solo se falsifica Date: los timers reales mantienen ágil la API y RTL.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(HOY))
    vi.clearAllMocks()
    reiniciarSalidasExternasMock()

    // Por defecto la verificación está deshabilitada: los casos reales se
    // activan explícitamente con `vi.stubEnv` y su propio mock.
    verificarExistenciaExpediente.mockReset()
    verificarExistenciaExpediente.mockResolvedValue({
      estado: VERIFICACION_DESHABILITADA,
      modo: MODO_VERIFICACION_DESHABILITADA,
      expediente: null,
    })

    obtenerNombrePacienteDeExpediente.mockReset()
    obtenerNombrePacienteDeExpediente.mockResolvedValue({ estado: 'no_verificado', nombre: null })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('inicia en modo préstamo, vista Todos y sin registros', async () => {
    const { result } = await montar()

    expect(result.current.modo).toBe('prestamo')
    expect(result.current.vista).toBe('todos')
    expect(result.current.hoy).toBe('2026-11-02')
    expect(result.current.registros).toEqual([])
    expect(result.current.errorCarga).toBeNull()
  })

  it('carga los movimientos del día operativo', async () => {
    await sembrar('927581')

    const { result } = await montar()
    await waitFor(() => expect(result.current.registros).toHaveLength(1))
    expect(result.current.registros[0].numeroExpediente).toBe('927581')
  })

  it('el cambio de modo conserva lo que el operador escribió', async () => {
    const { result } = await montar()

    act(() => {
      result.current.setPersonaRetira('Ana Ramírez')
      result.current.setMotivo('Tesis')
      result.current.setNumeroPrestamo('927581')
    })

    act(() => {
      result.current.cambiarModo('devolucion')
    })

    expect(result.current.modo).toBe('devolucion')
    expect(result.current.personaRetira).toBe('Ana Ramírez')
    expect(result.current.motivo).toBe('Tesis')
    expect(result.current.numeroPrestamo).toBe('927581')

    act(() => {
      result.current.cambiarModo('prestamo')
    })

    expect(result.current.motivo).toBe('Tesis')
  })

  it('ignora un modo inválido', async () => {
    const { result } = await montar()
    act(() => {
      result.current.cambiarModo('otro')
    })
    expect(result.current.modo).toBe('prestamo')
  })

  it('registra un préstamo y solo limpia el número', async () => {
    const { result } = await montar({ operador: 'archivo-01' })

    act(() => {
      result.current.setPersonaRetira('Ana Ramírez')
      result.current.setMotivo('Investigación universitaria')
      result.current.setNumeroPrestamo('927581')
    })

    await act(async () => {
      await result.current.guardarPrestamo()
    })

    expect(result.current.numeroPrestamo).toBe('')
    expect(result.current.personaRetira).toBe('Ana Ramírez')
    expect(result.current.motivo).toBe('Investigación universitaria')
    expect(result.current.errorPrestamo).toBeNull()
    expect(result.current.exitoPrestamo).toContain('9275-81')
    expect(result.current.guardandoPrestamo).toBe(false)

    await waitFor(() => expect(result.current.registros).toHaveLength(1))
    expect(result.current.registros[0]).toMatchObject({
      numeroExpediente: '927581',
      personaRetira: 'Ana Ramírez',
      registradoPor: 'archivo-01',
    })
  })

  it('conserva los campos cuando el préstamo falla', async () => {
    await sembrar('927581')
    const { result } = await montar()

    act(() => {
      result.current.setPersonaRetira('Otra Persona')
      result.current.setMotivo('Revisión administrativa')
      result.current.setNumeroPrestamo('927581')
    })

    await act(async () => {
      await result.current.guardarPrestamo()
    })

    expect(result.current.errorPrestamo.codigo).toBe('SALIDAS_EXTERNAS_PRESTAMO_DUPLICADO')
    expect(result.current.errorPrestamo.registro).not.toBeNull()
    expect(result.current.numeroPrestamo).toBe('927581')
    expect(result.current.personaRetira).toBe('Otra Persona')
    expect(result.current.motivo).toBe('Revisión administrativa')
  })

  it('expone el código de entrada inválida con su campo', async () => {
    const { result } = await montar()

    act(() => {
      result.current.setMotivo('Revisión administrativa')
      result.current.setNumeroPrestamo('927581')
    })

    await act(async () => {
      await result.current.guardarPrestamo()
    })

    expect(result.current.errorPrestamo.codigo).toBe(CODIGO_ENTRADA_INVALIDA)
    expect(result.current.errorPrestamo.campo).toBe('personaRetira')
    expect(result.current.registros).toEqual([])
  })

  it('no permite un segundo registro mientras el primero se guarda', async () => {
    const { result } = await montar()

    act(() => {
      result.current.setPersonaRetira('Ana Ramírez')
      result.current.setMotivo('Investigación universitaria')
      result.current.setNumeroPrestamo('927581')
    })

    await act(async () => {
      const primero = result.current.guardarPrestamo()
      const segundo = result.current.guardarPrestamo()
      await Promise.all([primero, segundo])
    })

    expect(await listarHistorial()).toHaveLength(1)
  })

  it('busca el préstamo pendiente sin modificarlo', async () => {
    await sembrar('927581')
    const { result } = await montar()

    act(() => {
      result.current.setNumeroDevolucion('927581')
    })

    await act(async () => {
      await result.current.buscarParaDevolucion()
    })

    expect(result.current.busqueda.estado).toBe('encontrado')
    expect(result.current.busqueda.registro.personaRetira).toBe('Ana Ramírez')
    expect(result.current.buscando).toBe(false)

    const [registro] = await listarHistorial()
    expect(registro.fechaDevolucion).toBeNull()
  })

  it('distingue sin pendiente, ya devuelto e inválido', async () => {
    await sembrar('927581')
    await registrarDevolucion({ numeroExpediente: '927581', instante: HOY })
    const { result } = await montar()

    act(() => {
      result.current.setNumeroDevolucion('927581')
    })
    await act(async () => {
      await result.current.buscarParaDevolucion()
    })
    expect(result.current.busqueda.estado).toBe('ya_devuelto')
    expect(result.current.busqueda.codigo).toBe(CODIGO_YA_DEVUELTO)
    expect(result.current.busqueda.registro).not.toBeNull()

    act(() => {
      result.current.setNumeroDevolucion('555555')
    })
    await act(async () => {
      await result.current.buscarParaDevolucion()
    })
    expect(result.current.busqueda.estado).toBe('sin_pendiente')

    act(() => {
      result.current.setNumeroDevolucion('9'.repeat(31))
    })
    await act(async () => {
      await result.current.buscarParaDevolucion()
    })
    expect(result.current.busqueda.estado).toBe('invalido')
  })

  it('sin número no busca nada', async () => {
    const { result } = await montar()

    act(() => {
      result.current.setNumeroDevolucion('   ')
    })
    await act(async () => {
      await result.current.buscarParaDevolucion()
    })

    expect(result.current.busqueda.estado).toBe('inicial')
    expect(result.current.buscando).toBe(false)
  })

  it('confirma la devolución y limpia la captura', async () => {
    await sembrar('927581')
    const { result } = await montar()

    act(() => {
      result.current.setNumeroDevolucion('927581')
    })
    await act(async () => {
      await result.current.buscarParaDevolucion()
    })
    await act(async () => {
      await result.current.confirmarDevolucion()
    })

    expect(result.current.busqueda.estado).toBe('inicial')
    expect(result.current.numeroDevolucion).toBe('')
    expect(result.current.exitoDevolucion).toContain('9275-81')
    expect(result.current.errorDevolucion).toBeNull()

    const [registro] = await listarHistorial()
    expect(registro.fechaDevolucion).toBe(HOY)

    await waitFor(() => expect(result.current.registros[0].fechaDevolucion).toBe(HOY))
  })

  it('cancelar no registra la devolución', async () => {
    await sembrar('927581')
    const { result } = await montar()

    act(() => {
      result.current.setNumeroDevolucion('927581')
    })
    await act(async () => {
      await result.current.buscarParaDevolucion()
    })
    act(() => {
      result.current.cancelarDevolucion()
    })

    expect(result.current.busqueda.estado).toBe('inicial')
    expect(result.current.buscando).toBe(false)

    const [registro] = await listarHistorial()
    expect(registro.fechaDevolucion).toBeNull()
  })

  it('no registra dos veces la misma devolución', async () => {
    await sembrar('927581')
    const { result } = await montar()

    act(() => {
      result.current.setNumeroDevolucion('927581')
    })
    await act(async () => {
      await result.current.buscarParaDevolucion()
    })
    await act(async () => {
      await result.current.confirmarDevolucion()
      await result.current.confirmarDevolucion()
    })

    const [registro] = await listarHistorial()
    expect(registro.fechaDevolucion).toBe(HOY)
    expect(result.current.errorDevolucion).toBeNull()
  })

  it('ordena por el último movimiento', async () => {
    await sembrar('111111', HOY_TEMPRANO)
    await registrarDevolucion({ numeroExpediente: '111111', instante: HOY })
    await sembrar('222222', '2026-11-02T16:00:00.000Z')

    const { result } = await montar()

    await waitFor(() => expect(result.current.registros).toHaveLength(2))
    expect(numeros(result.current.registros)).toEqual(['111111', '222222'])
  })

  it('filtra por Todos, Pendientes y Devueltos', async () => {
    await sembrar('111111', AYER) // pendiente de ayer
    await sembrar('222222', '2026-11-01T15:00:00.000Z')
    await registrarDevolucion({ numeroExpediente: '222222', instante: '2026-11-01T20:00:00.000Z' })
    await sembrar('333333', HOY_TEMPRANO)

    const { result } = await montar()
    await waitFor(() => expect(result.current.registros).toHaveLength(2))
    expect(numeros(result.current.registros)).toContain('111111')
    expect(numeros(result.current.registros)).toContain('333333')
    expect(numeros(result.current.registros)).not.toContain('222222')

    act(() => {
      result.current.cambiarVista('pendientes')
    })
    await waitFor(() => expect(result.current.vista).toBe('pendientes'))
    await waitFor(() => expect(numeros(result.current.registros)).toEqual(['333333', '111111']))

    act(() => {
      result.current.cambiarVista('devueltos')
    })
    await waitFor(() => expect(numeros(result.current.registros)).toEqual(['222222']))
  })

  it('filtra localmente por expediente, persona o motivo', async () => {
    await sembrar('927581', HOY_TEMPRANO, { personaRetira: 'Ana Ramírez' })
    await sembrar('30954', HOY_TEMPRANO, { personaRetira: 'Luis Pérez', motivo: 'Tesis' })

    const { result } = await montar()
    await waitFor(() => expect(result.current.registros).toHaveLength(2))

    act(() => {
      result.current.cambiarBusquedaLocal('luis')
    })
    expect(numeros(result.current.registros)).toEqual(['30954'])

    act(() => {
      result.current.cambiarBusquedaLocal('9275-81')
    })
    expect(numeros(result.current.registros)).toEqual(['927581'])

    act(() => {
      result.current.cambiarBusquedaLocal('')
    })
    expect(result.current.registros).toHaveLength(2)
  })

  it('mantiene los pendientes antiguos al cambiar el día operativo', async () => {
    await sembrar('111111', AYER) // pendiente de ayer
    await sembrar('222222', '2026-11-01T15:00:00.000Z')
    await registrarDevolucion({ numeroExpediente: '222222', instante: '2026-11-01T20:00:00.000Z' })

    const { result } = await montar()
    await waitFor(() => expect(numeros(result.current.registros)).toContain('111111'))
    expect(numeros(result.current.registros)).not.toContain('222222')

    vi.setSystemTime(new Date('2026-11-03T15:00:00.000Z'))
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    await waitFor(() => expect(result.current.hoy).toBe('2026-11-03'))
    await waitFor(() => expect(numeros(result.current.registros)).toContain('111111'))
    // La devolución de anteayer no reaparece en la vista del nuevo día.
    expect(numeros(result.current.registros)).not.toContain('222222')
    // El historial no se borra.
    expect(await listarHistorial()).toHaveLength(2)
  })

  it('recupera un pendiente conservando la fecha original', async () => {
    const { result } = await montar()

    let creado
    await act(async () => {
      creado = await result.current.recuperarPrestamo({
        numeroExpediente: '927581',
        personaRetira: 'Ana Ramírez',
        motivo: 'Tesis',
        fechaSalida: '2026-10-30',
        horaSalida: '09:15',
      })
    })

    expect(creado.fechaSalida).toBe('2026-10-30T15:15:00.000Z')
    expect(creado.recuperadoManualmente).toBe(true)
    expect(result.current.exitoRecuperacion).toContain('9275-81')
    expect(result.current.errorRecuperacion).toBeNull()

    await waitFor(() => expect(numeros(result.current.registros)).toContain('927581'))
  })

  it('rechaza la recuperación de un expediente ya activo', async () => {
    await sembrar('927581')
    const { result } = await montar()

    let creado
    await act(async () => {
      creado = await result.current.recuperarPrestamo({
        numeroExpediente: '927581',
        personaRetira: 'Ana Ramírez',
        motivo: 'Tesis',
        fechaSalida: '2026-10-30',
      })
    })

    expect(creado).toBeNull()
    expect(result.current.errorRecuperacion.codigo).toBe('SALIDAS_EXTERNAS_PRESTAMO_DUPLICADO')
  })

  it('informa el error de carga y se recupera con reintento', async () => {
    listarPendientesMock.mockRejectedValueOnce(new Error('Falla simulada'))

    const { result } = await montar()
    act(() => {
      result.current.cambiarVista('pendientes')
    })

    await waitFor(() => expect(result.current.errorCarga).not.toBeNull())
    expect(result.current.errorCarga.mensaje).toBe('Falla simulada')
    expect(result.current.registros).toEqual([])

    await act(async () => {
      await result.current.recargar()
    })

    expect(result.current.errorCarga).toBeNull()
  })

  it('descarta el resultado de una búsqueda que quedó obsoleta', async () => {
    await sembrar('927581')
    const { result } = await montar()

    act(() => {
      result.current.setNumeroDevolucion('927581')
    })

    await act(async () => {
      const busquedaEnCurso = result.current.buscarParaDevolucion()
      // El operador corrige el número antes de que llegue la respuesta.
      result.current.setNumeroDevolucion('999999')
      await busquedaEnCurso
    })

    expect(result.current.busqueda.estado).toBe('inicial')
    expect(result.current.busqueda.registro).toBeNull()
    expect(result.current.buscando).toBe(false)
  })

  it('expone el historial completo para el reporte sin alterar la vista', async () => {
    await sembrar('111111', HOY_TEMPRANO)
    await sembrar('222222', '2026-11-02T16:00:00.000Z')
    await registrarDevolucion({ numeroExpediente: '222222', instante: HOY })

    const { result } = await montar()
    act(() => {
      result.current.cambiarVista('pendientes')
    })
    await waitFor(() => expect(result.current.vista).toBe('pendientes'))
    await waitFor(() => expect(result.current.registros).toHaveLength(1))

    const historial = await result.current.obtenerHistorialCompleto()

    expect(historial).toHaveLength(2)
    expect(result.current.vista).toBe('pendientes')
    expect(result.current.registros).toHaveLength(1)
  })

  it('limpia los avisos de los tres flujos', async () => {
    await sembrar('927581')
    const { result } = await montar()

    act(() => {
      result.current.setPersonaRetira('Ana Ramírez')
      result.current.setMotivo('Tesis')
      result.current.setNumeroPrestamo('927581')
    })
    await act(async () => {
      await result.current.guardarPrestamo()
    })
    expect(result.current.errorPrestamo).not.toBeNull()

    act(() => {
      result.current.limpiarAvisos()
    })

    expect(result.current.errorPrestamo).toBeNull()
    expect(result.current.exitoPrestamo).toBeNull()
    expect(result.current.errorDevolucion).toBeNull()
    expect(result.current.errorRecuperacion).toBeNull()
  })

  it('registra una devolución directa en una sola operación', async () => {
    await sembrar('927581', HOY_TEMPRANO)
    const { result } = await montar()

    act(() => {
      result.current.setNumeroDevolucion('927581')
    })

    await act(async () => {
      await result.current.registrarDevolucionDirecta()
    })

    expect(result.current.numeroDevolucion).toBe('')
    expect(result.current.exitoDevolucion).toContain('9275-81')
    expect(result.current.errorDevolucion).toBeNull()
    expect(result.current.ultimaAccion.tipo).toBe('devolucion')

    const [registro] = await listarHistorial()
    expect(registro.fechaDevolucion).toBe(HOY)
  })

  it('conserva la presentación del ingreso manual', async () => {
    const { result } = await montar()

    act(() => {
      result.current.setPersonaRetira('Ana Ramírez')
      result.current.setMotivo('Tesis')
      result.current.setNumeroPrestamo('91-1330', '91-1330')
    })

    await act(async () => {
      await result.current.guardarPrestamo()
    })

    expect(result.current.errorPrestamo).toBeNull()
    expect(result.current.exitoPrestamo).toContain('91-1330')

    const [registro] = await listarHistorial()
    expect(registro.numeroExpediente).toBe('911330')
    expect(registro.numeroExpedientePresentacion).toBe('91-1330')
  })

  it('revierte la última acción y limpia el panel', async () => {
    const { result } = await montar()
    await act(async () => {
      result.current.setPersonaRetira('Ana Ramírez')
      result.current.setMotivo('Tesis')
      result.current.setNumeroPrestamo('927581')
    })
    await act(async () => {
      await result.current.guardarPrestamo()
    })
    await waitFor(() => expect(result.current.ultimaAccion).not.toBeNull())

    await act(async () => {
      await result.current.revertirAccion()
    })

    expect(result.current.ultimaAccion).toBeNull()
    expect(result.current.exitoReversion).toContain('Préstamo revertido')
    expect(await listarHistorial()).toEqual([])
  })

  it('revierte una devolución y deja el expediente pendiente', async () => {
    await sembrar('927581', HOY_TEMPRANO)
    const { result } = await montar()
    act(() => {
      result.current.setNumeroDevolucion('927581')
    })
    await act(async () => {
      await result.current.registrarDevolucionDirecta()
    })

    await act(async () => {
      await result.current.revertirAccion()
    })

    expect(result.current.exitoReversion).toContain('Devolución revertida')
    const [registro] = await listarHistorial()
    expect(registro.fechaDevolucion).toBeNull()
  })

  it('rechaza revertir dos veces la misma acción', async () => {
    await sembrar('927581', HOY_TEMPRANO)
    const { result } = await montar()
    act(() => {
      result.current.setNumeroDevolucion('927581')
    })
    await act(async () => {
      await result.current.registrarDevolucionDirecta()
    })
    await act(async () => {
      await result.current.revertirAccion()
    })

    await act(async () => {
      await result.current.revertirAccion()
    })

    expect(result.current.errorReversion.codigo).toBe('SALIDAS_EXTERNAS_NADA_QUE_REVERTIR')
  })

  it('mantiene la última acción al cambiar de modo', async () => {
    await sembrar('927581', HOY_TEMPRANO)
    const { result } = await montar()
    await waitFor(() => expect(result.current.ultimaAccion).not.toBeNull())

    act(() => {
      result.current.cambiarModo('devolucion')
    })

    expect(result.current.ultimaAccion.tipo).toBe('prestamo')
  })

  it('en modo simulación registra sin bloquear y deja constancia de que no verificó', async () => {
    const { result } = await montar()

    expect(result.current.modoVerificacion).toBe(MODO_VERIFICACION_DESHABILITADA)

    completarPrestamo(result)
    await act(async () => {
      await result.current.guardarPrestamo()
    })

    expect(result.current.errorPrestamo).toBeNull()
    expect(result.current.registros).toHaveLength(1)
    // Tras el registro la captura se limpia y con ella la constancia anterior.
    expect(result.current.verificacionPrestamo).toBeNull()
    expect(result.current.verificandoPrestamo).toBe(false)
    expect(verificarExistenciaExpediente).toHaveBeenCalledTimes(1)
    expect(verificarExistenciaExpediente).toHaveBeenCalledWith('927581')
  })

  it('con verificación real y expediente existente registra el préstamo', async () => {
    activarVerificacionReal()
    verificarExistenciaExpediente.mockResolvedValue({
      estado: VERIFICACION_ENCONTRADO,
      modo: MODO_VERIFICACION_REAL,
      expediente: { numeroExpediente: '927581' },
    })

    const { result } = await montar()
    expect(result.current.modoVerificacion).toBe(MODO_VERIFICACION_REAL)

    completarPrestamo(result)
    await act(async () => {
      await result.current.guardarPrestamo()
    })

    expect(verificarExistenciaExpediente).toHaveBeenCalledWith('927581')
    expect(result.current.errorPrestamo).toBeNull()
    expect(result.current.exitoPrestamo).toContain('9275-81')
    expect(result.current.registros).toHaveLength(1)
  })

  it('no registra cuando el expediente no existe en el sistema', async () => {
    activarVerificacionReal()
    verificarExistenciaExpediente.mockResolvedValue({
      estado: VERIFICACION_NO_ENCONTRADO,
      modo: MODO_VERIFICACION_REAL,
      expediente: null,
    })

    const { result } = await montar()
    completarPrestamo(result)
    await act(async () => {
      await result.current.guardarPrestamo()
    })

    expect(result.current.errorPrestamo.codigo).toBe(CODIGO_EXPEDIENTE_NO_ENCONTRADO)
    expect(result.current.registros).toEqual([])
    expect(await listarHistorial()).toHaveLength(0)
    // Se conserva la captura para corregir el número.
    expect(result.current.numeroPrestamo).toBe('927581')
  })

  it('no registra si el servidor no pudo verificar el expediente', async () => {
    activarVerificacionReal()
    verificarExistenciaExpediente.mockResolvedValue({
      estado: VERIFICACION_ERROR_CONEXION,
      modo: MODO_VERIFICACION_REAL,
      expediente: null,
      status: null,
    })

    const { result } = await montar()
    completarPrestamo(result)
    await act(async () => {
      await result.current.guardarPrestamo()
    })

    expect(result.current.errorPrestamo.codigo).toBe(CODIGO_VERIFICACION_FALLIDA)
    expect(result.current.errorPrestamo.motivo).toBe('conexion')
    expect(result.current.registros).toEqual([])
  })

  it('descarta la respuesta de verificación de un número que ya cambió', async () => {
    activarVerificacionReal()
    const diferida = promesaDiferida()
    verificarExistenciaExpediente.mockReturnValueOnce(diferida.promesa)

    const { result } = await montar()
    completarPrestamo(result, '927581')

    let registrando
    act(() => {
      registrando = result.current.guardarPrestamo()
    })

    await waitFor(() => expect(verificarExistenciaExpediente).toHaveBeenCalledTimes(1))

    // El operador cambia de expediente mientras la verificación está en curso.
    act(() => {
      result.current.setNumeroPrestamo('111111')
    })

    await act(async () => {
      diferida.resolver({
        estado: VERIFICACION_ENCONTRADO,
        modo: MODO_VERIFICACION_REAL,
        expediente: { numeroExpediente: '927581' },
      })
      await registrando
    })

    expect(result.current.registros).toEqual([])
    expect(result.current.errorPrestamo).toBeNull()
    expect(result.current.verificandoPrestamo).toBe(false)
  })

  it('un doble Enter ejecuta una sola verificación y un solo registro', async () => {
    activarVerificacionReal()
    verificarExistenciaExpediente.mockResolvedValue({
      estado: VERIFICACION_ENCONTRADO,
      modo: MODO_VERIFICACION_REAL,
      expediente: { numeroExpediente: '927581' },
    })

    const { result } = await montar()
    completarPrestamo(result)

    await act(async () => {
      await Promise.all([result.current.guardarPrestamo(), result.current.guardarPrestamo()])
    })

    expect(verificarExistenciaExpediente).toHaveBeenCalledTimes(1)
    expect(result.current.registros).toHaveLength(1)
  })

  it('agrega el nombre del paciente cuando la consulta complementaria responde', async () => {
    activarVerificacionReal()
    verificarExistenciaExpediente.mockResolvedValue({
      estado: VERIFICACION_ENCONTRADO,
      modo: MODO_VERIFICACION_REAL,
      expediente: { numeroExpediente: '927581', pacienteId: 'uuid-paciente' },
    })
    obtenerNombrePacienteDeExpediente.mockResolvedValue({
      estado: 'disponible',
      nombre: 'María Ejemplo López',
    })

    const { result } = await montar()
    completarPrestamo(result)
    await act(async () => {
      await result.current.guardarPrestamo()
    })

    expect(result.current.errorPrestamo).toBeNull()
    expect(result.current.registros).toHaveLength(1)
    expect(obtenerNombrePacienteDeExpediente).toHaveBeenCalledWith('927581', 'uuid-paciente')

    await waitFor(() =>
      expect(result.current.nombresPacientes['927581']?.nombre).toBe('María Ejemplo López'),
    )
  })

  it('no bloquea el préstamo si falla la consulta del nombre', async () => {
    activarVerificacionReal()
    verificarExistenciaExpediente.mockResolvedValue({
      estado: VERIFICACION_ENCONTRADO,
      modo: MODO_VERIFICACION_REAL,
      expediente: { numeroExpediente: '927581', pacienteId: 'uuid-paciente' },
    })
    obtenerNombrePacienteDeExpediente.mockRejectedValue(new Error('fallo del nombre'))

    const { result } = await montar()
    completarPrestamo(result)
    await act(async () => {
      await result.current.guardarPrestamo()
    })

    expect(result.current.errorPrestamo).toBeNull()
    expect(result.current.registros).toHaveLength(1)
    await waitFor(() => expect(obtenerNombrePacienteDeExpediente).toHaveBeenCalled())
    expect(result.current.nombresPacientes).toEqual({})
  })

  it('en simulación no consulta el nombre del paciente', async () => {
    const { result } = await montar()
    completarPrestamo(result)
    await act(async () => {
      await result.current.guardarPrestamo()
    })

    expect(result.current.registros).toHaveLength(1)
    expect(obtenerNombrePacienteDeExpediente).not.toHaveBeenCalled()
    expect(result.current.nombresPacientes).toEqual({})
  })
})
