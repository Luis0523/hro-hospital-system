import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const { listarDepuraciones, listarDepuracionesEnRango } = vi.hoisted(() => ({
  listarDepuraciones: vi.fn(),
  listarDepuracionesEnRango: vi.fn(),
}))

vi.mock('../api/depuracionArchivoApi', () => ({
  USANDO_DATOS_MOCK: true,
  listarDepuraciones,
  listarDepuracionesEnRango,
}))

import { useHistorialDepurados } from './useHistorialDepurados'
import { hoyIsoGuatemala } from '../utils/fechaDepuracionGuatemala'
import { crearPeriodo, etiquetaPeriodo } from '../utils/periodoDepuracion'

function registro(id, fecha, hora = '10:00') {
  return {
    id,
    numeroExpediente: `90${id}`,
    pacienteNombre: `Paciente ${id}`,
    usuarioNombre: 'Archivo Central',
    motivo: null,
    depuradoEn: `${fecha}T${hora}:00-06:00`,
  }
}

function errorCon(status, message = 'fallo') {
  return Object.assign(new Error(message), { status })
}

describe('useHistorialDepurados', () => {
  beforeEach(() => {
    listarDepuraciones.mockReset()
    listarDepuraciones.mockResolvedValue([])
    listarDepuracionesEnRango.mockReset()
    listarDepuracionesEnRango.mockResolvedValue([])
  })

  it('carga Hoy por defecto y expone una fuente válida para reportes', async () => {
    const { result } = renderHook(() => useHistorialDepurados())
    const hoy = hoyIsoGuatemala()

    await waitFor(() => expect(result.current.cargado).toBe(true))

    expect(listarDepuraciones).toHaveBeenCalledWith({ fecha: hoy })
    expect(result.current).toMatchObject({
      filtroActivo: 'hoy',
      fechaInicio: hoy,
      fechaFin: hoy,
      cargando: false,
      completo: true,
      consultaCompleta: true,
      consultaValidaParaReportes: true,
      desactualizado: false,
      error: null,
    })
    expect(result.current.datosHistorial).toMatchObject({
      filtroActivo: 'hoy',
      fechaInicio: hoy,
      fechaFin: hoy,
      total: 0,
      orden: 'desc',
      completo: true,
      validoParaReportes: true,
    })
  })

  it('consulta siete días para la semana y un rango largo en una sola consulta mock', async () => {
    const { result } = renderHook(() => useHistorialDepurados())

    await waitFor(() => expect(result.current.cargado).toBe(true))

    vi.clearAllMocks()
    act(() => result.current.seleccionarPeriodo('semana'))
    await waitFor(() => expect(result.current.filtroActivo).toBe('semana'))
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(listarDepuraciones).toHaveBeenCalledTimes(7)

    vi.clearAllMocks()
    listarDepuracionesEnRango.mockResolvedValueOnce([registro('rango', '2026-02-01')])
    act(() => result.current.seleccionarPeriodo('personalizado'))
    act(() => result.current.cambiarRango('desde', '2026-01-01'))
    act(() => result.current.cambiarRango('hasta', '2026-03-31'))
    act(() => result.current.aplicarRangoPersonalizado())

    await waitFor(() => expect(result.current.filtroActivo).toBe('personalizado'))
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.fechaInicio).toBe('2026-01-01')
    expect(result.current.fechaFin).toBe('2026-03-31')
    expect(result.current.dias).toHaveLength(90)
    expect(listarDepuraciones).not.toHaveBeenCalled()
    expect(listarDepuracionesEnRango).toHaveBeenCalledTimes(1)
    expect(result.current.registros).toHaveLength(1)
  })

  it('acepta 32 días y un rango que cruza de año', async () => {
    const { result } = renderHook(() => useHistorialDepurados())
    await waitFor(() => expect(result.current.cargado).toBe(true))
    vi.clearAllMocks()

    act(() => result.current.seleccionarPeriodo('personalizado'))
    act(() => result.current.cambiarRango('desde', '2026-12-01'))
    act(() => result.current.cambiarRango('hasta', '2027-01-01'))
    act(() => result.current.aplicarRangoPersonalizado())

    await waitFor(() => expect(result.current.filtroActivo).toBe('personalizado'))
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.dias).toHaveLength(32)
    expect(result.current.fechaInicio).toBe('2026-12-01')
    expect(result.current.fechaFin).toBe('2027-01-01')
    expect(result.current.errorRango).toBeNull()
  })

  it('no consulta un rango personalizado hasta aplicarlo y rechaza rangos invertidos', async () => {
    const { result } = renderHook(() => useHistorialDepurados())
    await waitFor(() => expect(result.current.cargado).toBe(true))
    vi.clearAllMocks()

    act(() => result.current.seleccionarPeriodo('personalizado'))
    expect(listarDepuraciones).not.toHaveBeenCalled()

    act(() => result.current.cambiarRango('desde', '2026-11-03'))
    act(() => result.current.cambiarRango('hasta', '2026-11-02'))
    act(() => result.current.aplicarRangoPersonalizado())

    expect(listarDepuraciones).not.toHaveBeenCalled()
    expect(listarDepuracionesEnRango).not.toHaveBeenCalled()
    expect(result.current.errorRango).toMatch(/posterior/i)
    expect(result.current.filtroActivo).toBe('hoy')
  })

  it('aplica un rango inclusivo de 31 días y permite regresar a Hoy', async () => {
    const { result } = renderHook(() => useHistorialDepurados())
    await waitFor(() => expect(result.current.cargado).toBe(true))
    vi.clearAllMocks()

    act(() => result.current.seleccionarPeriodo('personalizado'))
    act(() => result.current.cambiarRango('desde', '2026-01-01'))
    act(() => result.current.cambiarRango('hasta', '2026-01-31'))
    act(() => result.current.aplicarRangoPersonalizado())

    await waitFor(() => expect(result.current.filtroActivo).toBe('personalizado'))
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(listarDepuraciones).toHaveBeenCalledTimes(31)
    expect(result.current).toMatchObject({
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-31',
      completo: true,
      consultaValidaParaReportes: true,
    })

    vi.clearAllMocks()
    act(() => result.current.seleccionarPeriodo('hoy'))
    await waitFor(() => expect(result.current.filtroActivo).toBe('hoy'))
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(listarDepuraciones).toHaveBeenCalledTimes(1)
    expect(result.current.errorRango).toBeNull()
  })

  it('marca la consulta como incompleta si falla un día y permite reintentar', async () => {
    const hoy = hoyIsoGuatemala()
    const semana = crearPeriodo('semana', { hoy })
    listarDepuraciones.mockImplementation(({ fecha }) =>
      fecha === semana.dias[2]
        ? Promise.reject(errorCon(500))
        : Promise.resolve([registro(fecha, fecha)]),
    )

    const { result } = renderHook(() => useHistorialDepurados())
    await waitFor(() => expect(result.current.cargado).toBe(true))
    vi.clearAllMocks()

    act(() => result.current.seleccionarPeriodo('semana'))
    await waitFor(() => expect(result.current.filtroActivo).toBe('semana'))
    await waitFor(() => expect(result.current.error).toBeTruthy())

    expect(result.current).toMatchObject({
      completo: false,
      consultaCompleta: false,
      consultaValidaParaReportes: false,
      desactualizado: false,
    })
    expect(result.current.registros).toHaveLength(6)

    listarDepuraciones.mockReset()
    listarDepuraciones.mockResolvedValue([])
    act(() => {
      result.current.reintentar()
    })
    await waitFor(() => expect(result.current.error).toBeNull())

    expect(result.current).toMatchObject({
      completo: true,
      consultaCompleta: true,
      consultaValidaParaReportes: true,
    })
  })

  it('conserva los datos previos y los marca como desactualizados si falla la actualización', async () => {
    const hoy = hoyIsoGuatemala()
    const anterior = registro('previo', hoy)
    listarDepuraciones.mockResolvedValueOnce([anterior])

    const { result } = renderHook(() => useHistorialDepurados())
    await waitFor(() => expect(result.current.cargado).toBe(true))

    listarDepuraciones.mockRejectedValueOnce(errorCon(500))
    act(() => {
      result.current.reintentar()
    })
    await waitFor(() => expect(result.current.error).toBeTruthy())

    expect(result.current.registros).toEqual([anterior])
    expect(result.current).toMatchObject({
      completo: false,
      consultaCompleta: false,
      consultaValidaParaReportes: false,
      desactualizado: true,
    })
  })

  it('ignora la respuesta de un filtro anterior cuando el usuario cambia rápido', async () => {
    const hoy = hoyIsoGuatemala()
    const semana = crearPeriodo('semana', { hoy })
    let resolverAnterior

    listarDepuraciones.mockResolvedValueOnce([])

    const { result } = renderHook(() => useHistorialDepurados())
    await waitFor(() => expect(result.current.cargado).toBe(true))

    listarDepuraciones.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolverAnterior = resolve
        }),
    )
    listarDepuraciones.mockImplementation(() => Promise.resolve([registro('nuevo', hoy, '11:00')]))

    act(() => result.current.seleccionarPeriodo('semana'))
    act(() => result.current.seleccionarPeriodo('hoy'))

    await waitFor(() => expect(result.current.filtroActivo).toBe('hoy'))
    await waitFor(() => expect(result.current.registros[0]?.id).toBe('nuevo'))

    await act(async () => {
      resolverAnterior([registro('viejo', semana.dias[0], '09:00')])
    })

    expect(result.current.filtroActivo).toBe('hoy')
    expect(result.current.registros[0]?.id).toBe('nuevo')
  })

  it('invalida un registro revertido y conserva la consulta del período', async () => {
    const hoy = hoyIsoGuatemala()
    const anterior = registro('a', hoy)
    const restante = registro('b', hoy)
    listarDepuraciones.mockResolvedValueOnce([anterior, restante])

    const { result } = renderHook(() => useHistorialDepurados())
    await waitFor(() => expect(result.current.cargado).toBe(true))

    act(() => result.current.invalidarRegistro('a'))

    expect(result.current.registros).toEqual([restante])
    expect(result.current.total).toBe(1)
    expect(result.current).toMatchObject({
      completo: false,
      consultaValidaParaReportes: false,
      desactualizado: true,
      filtroActivo: 'hoy',
    })

    listarDepuraciones.mockResolvedValueOnce([restante])
    await act(async () => {
      await result.current.reintentar()
    })

    expect(result.current.registros).toEqual([restante])
    expect(result.current).toMatchObject({
      completo: true,
      consultaValidaParaReportes: true,
      desactualizado: false,
      filtroActivo: 'hoy',
    })
  })

  it('calcula la etiqueta del período aplicado', async () => {
    const { result } = renderHook(() => useHistorialDepurados())
    const hoy = hoyIsoGuatemala()

    await waitFor(() => expect(result.current.cargado).toBe(true))
    expect(result.current.etiquetaPeriodo).toBe(etiquetaPeriodo(crearPeriodo('hoy', { hoy })))

    act(() => result.current.seleccionarPeriodo('semana'))
    await waitFor(() => expect(result.current.filtroActivo).toBe('semana'))
    expect(result.current.etiquetaPeriodo).toBe(etiquetaPeriodo(crearPeriodo('semana', { hoy })))
  })
})
