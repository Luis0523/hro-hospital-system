import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import {
  avanzarEstado,
  crearExpediente,
  listarJornadaArchivo,
  listarSubespecialidades,
  marcarNoLocalizado,
} from '../api/archivoApi'
import { useExpedientes } from './useExpedientes'

vi.mock('../api/archivoApi', () => ({
  listarSubespecialidades: vi.fn(),
  listarJornadaArchivo: vi.fn(),
  avanzarEstado: vi.fn(),
  marcarNoLocalizado: vi.fn(),
  crearExpediente: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  listarSubespecialidades.mockResolvedValue([])
  listarJornadaArchivo.mockResolvedValue([])
})

describe('useExpedientes', () => {
  it('inicia en carga y la desactiva al resolver', async () => {
    let resolver
    listarJornadaArchivo.mockReturnValueOnce(
      new Promise((res) => {
        resolver = res
      }),
    )

    const { result } = renderHook(() => useExpedientes())
    expect(result.current.cargando).toBe(true)

    await act(async () => {
      resolver([])
    })

    expect(result.current.cargando).toBe(false)
  })

  it('expone el error y deja la lista vacía si falla la carga', async () => {
    listarJornadaArchivo.mockRejectedValue(new Error('fallo de red'))

    const { result } = renderHook(() => useExpedientes())

    await waitFor(() => expect(result.current.error).toBeTruthy())
    expect(result.current.error.message).toBe('fallo de red')
    expect(result.current.expedientes).toEqual([])
    expect(result.current.cargando).toBe(false)
  })

  it('recarga con los filtros seleccionados', async () => {
    const { result } = renderHook(() => useExpedientes())
    await waitFor(() => expect(result.current.cargando).toBe(false))

    act(() => result.current.setSubespecialidadId(1))
    await waitFor(() =>
      expect(listarJornadaArchivo).toHaveBeenLastCalledWith(
        expect.objectContaining({ subespecialidadId: 1 }),
      ),
    )

    act(() => result.current.setFecha('2026-09-21'))
    await waitFor(() =>
      expect(listarJornadaArchivo).toHaveBeenLastCalledWith(
        expect.objectContaining({ fecha: '2026-09-21' }),
      ),
    )
  })

  it('expone las subespecialidades cargadas', async () => {
    listarSubespecialidades.mockResolvedValue([{ id: 1, nombre: 'Medicina General' }])

    const { result } = renderHook(() => useExpedientes())

    await waitFor(() => expect(result.current.subespecialidades).toHaveLength(1))
    expect(result.current.subespecialidades[0]).toMatchObject({ id: 1 })
  })

  it('calcula el resumen por estado incluida la excepción', async () => {
    listarJornadaArchivo.mockResolvedValue([
      { id: 1, estado: 'pendiente_localizar' },
      { id: 2, estado: 'entregado' },
      { id: 3, estado: 'no_localizado' },
    ])

    const { result } = renderHook(() => useExpedientes())
    await waitFor(() => expect(result.current.total).toBe(3))

    expect(result.current.resumen.pendiente_localizar).toBe(1)
    expect(result.current.resumen.entregado).toBe(1)
    expect(result.current.resumen.no_localizado).toBe(1)
  })

  it('actualiza el expediente en la lista tras avanzar', async () => {
    listarJornadaArchivo.mockResolvedValue([{ id: 1, estado: 'pendiente_localizar' }])
    avanzarEstado.mockResolvedValue({ id: 1, estado: 'en_busqueda' })

    const { result } = renderHook(() => useExpedientes())
    await waitFor(() => expect(result.current.total).toBe(1))

    await act(async () => {
      await result.current.avanzar(1)
    })

    expect(result.current.expedientes[0].estado).toBe('en_busqueda')
  })

  it('reemplaza el expediente nuevo tras crearlo', async () => {
    listarJornadaArchivo.mockResolvedValue([
      { id: 7, pacienteId: 7, estado: 'pendiente_localizar', expedienteNuevo: true },
    ])
    crearExpediente.mockResolvedValue({
      id: 7,
      pacienteId: 7,
      estado: 'pendiente_localizar',
      expedienteNuevo: false,
      numeroExpediente: 'EXP-000707',
    })

    const { result } = renderHook(() => useExpedientes())
    await waitFor(() => expect(result.current.total).toBe(1))

    await act(async () => {
      await result.current.crear(7)
    })

    expect(result.current.expedientes[0].numeroExpediente).toBe('EXP-000707')
    expect(result.current.expedientes[0].expedienteNuevo).toBe(false)
  })

  it('marca no localizado y reemplaza el expediente', async () => {
    listarJornadaArchivo.mockResolvedValue([{ id: 3, estado: 'pendiente_localizar' }])
    marcarNoLocalizado.mockResolvedValue({ id: 3, estado: 'no_localizado' })

    const { result } = renderHook(() => useExpedientes())
    await waitFor(() => expect(result.current.total).toBe(1))

    await act(async () => {
      await result.current.marcarNoLocalizado(3)
    })

    expect(result.current.expedientes[0].estado).toBe('no_localizado')
  })
})
