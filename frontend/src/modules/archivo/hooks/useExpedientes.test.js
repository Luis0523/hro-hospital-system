import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { listarJornadaArchivo, listarSubespecialidades } from '../api/archivoApi'
import { useExpedientes } from './useExpedientes'

vi.mock('../api/archivoApi', () => ({
  listarSubespecialidades: vi.fn(),
  listarJornadaArchivo: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  listarSubespecialidades.mockResolvedValue([])
  listarJornadaArchivo.mockResolvedValue([])
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useExpedientes', () => {
  it('usa la fecha de HOY en horario local (YYYY-MM-DD)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 9, 6, 15, 30, 0))

    renderHook(() => useExpedientes())

    await waitFor(() =>
      expect(listarJornadaArchivo).toHaveBeenCalledWith({
        fecha: '2026-10-06',
        subespecialidadId: '',
      }),
    )
  })

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

  it('permite recargar la jornada manualmente', async () => {
    const { result } = renderHook(() => useExpedientes())
    await waitFor(() => expect(result.current.cargando).toBe(false))

    listarJornadaArchivo.mockClear()
    await act(async () => {
      await result.current.recargar()
    })

    expect(listarJornadaArchivo).toHaveBeenCalledTimes(1)
  })
})
