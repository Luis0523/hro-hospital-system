import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDiaOperativo } from './useDiaOperativo'

// 23:30 en Guatemala del 01/11/2026 (UTC-6).
const ANTES_DE_MEDIANOCHE = '2026-11-02T05:30:00.000Z'

describe('useDiaOperativo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(ANTES_DE_MEDIANOCHE))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('inicia con la fecha de Guatemala, no con la del dispositivo', () => {
    const { result } = renderHook(() => useDiaOperativo())
    expect(result.current.hoy).toBe('2026-11-01')
  })

  it('cambia la fecha al pasar la medianoche sin recargar', () => {
    vi.setSystemTime(new Date('2026-11-02T05:59:40.000Z'))
    const { result } = renderHook(() => useDiaOperativo())
    expect(result.current.hoy).toBe('2026-11-01')

    act(() => {
      vi.advanceTimersByTime(30 * 1000)
    })

    expect(result.current.hoy).toBe('2026-11-02')
  })

  it('se actualiza al recuperar el foco de la ventana', () => {
    const { result } = renderHook(() => useDiaOperativo())
    vi.setSystemTime(new Date('2026-11-03T15:00:00.000Z'))

    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(result.current.hoy).toBe('2026-11-03')
  })

  it('se actualiza cuando la pestaña vuelve a estar visible', () => {
    const { result } = renderHook(() => useDiaOperativo())
    vi.setSystemTime(new Date('2026-11-04T15:00:00.000Z'))

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current.hoy).toBe('2026-11-04')
  })

  it('se actualiza con pageshow', () => {
    const { result } = renderHook(() => useDiaOperativo())
    vi.setSystemTime(new Date('2026-11-05T15:00:00.000Z'))

    act(() => {
      window.dispatchEvent(new Event('pageshow'))
    })

    expect(result.current.hoy).toBe('2026-11-05')
  })

  it('no genera actualizaciones cuando el día no cambió', () => {
    let renders = 0
    const { result } = renderHook(() => {
      renders += 1
      return useDiaOperativo()
    })
    const rendersIniciales = renders

    act(() => {
      window.dispatchEvent(new Event('focus'))
      document.dispatchEvent(new Event('visibilitychange'))
      window.dispatchEvent(new Event('pageshow'))
      vi.advanceTimersByTime(30 * 1000)
    })

    expect(renders).toBe(rendersIniciales)
    expect(result.current.hoy).toBe('2026-11-01')
  })

  it('limpia el intervalo y los listeners al desmontar', () => {
    const { unmount } = renderHook(() => useDiaOperativo())
    expect(vi.getTimerCount()).toBe(1)

    unmount()

    expect(vi.getTimerCount()).toBe(0)

    // Sin listeners registrados, los eventos no deben provocar errores.
    vi.setSystemTime(new Date('2026-11-10T15:00:00.000Z'))
    expect(() => {
      window.dispatchEvent(new Event('focus'))
      document.dispatchEvent(new Event('visibilitychange'))
      window.dispatchEvent(new Event('pageshow'))
    }).not.toThrow()
  })
})
