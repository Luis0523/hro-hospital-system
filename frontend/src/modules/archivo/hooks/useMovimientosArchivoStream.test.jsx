import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  TOPIC_ARCHIVO_MOVIMIENTOS,
  useMovimientosArchivoStream,
} from './useMovimientosArchivoStream'

describe('useMovimientosArchivoStream (mock)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('usa el topic confirmado de movimientos de Archivo', () => {
    expect(TOPIC_ARCHIVO_MOVIMIENTOS).toBe('/topic/archivo/movimientos')
  })

  it('arranca en estado simulado y emite eventos con el tiempo', () => {
    const { result } = renderHook(() => useMovimientosArchivoStream())

    expect(result.current.estado).toBe('simulado')
    expect(result.current.eventos).toHaveLength(0)

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(result.current.eventos.length).toBeGreaterThan(0)
    expect(result.current.eventos[0]).toHaveProperty('estadoNuevo')
  })

  it('no emite si está deshabilitado', () => {
    const { result } = renderHook(() => useMovimientosArchivoStream({ habilitado: false }))

    expect(result.current.estado).toBe('detenido')
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(result.current.eventos).toHaveLength(0)
  })

  it('limpia el temporizador al desmontar', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = renderHook(() => useMovimientosArchivoStream())

    unmount()

    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })
})
