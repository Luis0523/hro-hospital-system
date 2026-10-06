import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { INTERVALO_REFRESCO_MS, useRefrescoAutomaticoCoex } from './useRefrescoAutomaticoCoex'

function fijarVisible(visible) {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => !visible,
  })
}

async function avanzar(ms) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  fijarVisible(true)
})

afterEach(() => {
  vi.useRealTimers()
  fijarVisible(true)
})

describe('useRefrescoAutomaticoCoex - Fase 4 (polling)', () => {
  it('12. dispara el refresco a los 30 s', async () => {
    const refrescar = vi.fn().mockResolvedValue(undefined)
    renderHook(() => useRefrescoAutomaticoCoex({ refrescar }))

    expect(refrescar).not.toHaveBeenCalled()
    await avanzar(INTERVALO_REFRESCO_MS)
    expect(refrescar).toHaveBeenCalledTimes(1)
  })

  it('13. no dispara antes del intervalo', async () => {
    const refrescar = vi.fn().mockResolvedValue(undefined)
    renderHook(() => useRefrescoAutomaticoCoex({ refrescar }))

    await avanzar(INTERVALO_REFRESCO_MS - 1)
    expect(refrescar).not.toHaveBeenCalled()
  })

  it('14. programa el siguiente ciclo después de cada refresco', async () => {
    const refrescar = vi.fn().mockResolvedValue(undefined)
    renderHook(() => useRefrescoAutomaticoCoex({ refrescar }))

    await avanzar(INTERVALO_REFRESCO_MS)
    await avanzar(INTERVALO_REFRESCO_MS)
    await avanzar(INTERVALO_REFRESCO_MS)

    expect(refrescar).toHaveBeenCalledTimes(3)
  })

  it('15. no dispara cuando está `pausado`', async () => {
    const refrescar = vi.fn().mockResolvedValue(undefined)
    renderHook(() => useRefrescoAutomaticoCoex({ refrescar, pausado: true }))

    await avanzar(INTERVALO_REFRESCO_MS * 5)
    expect(refrescar).not.toHaveBeenCalled()
  })

  it('16. no dispara cuando la pestaña está oculta', async () => {
    fijarVisible(false)
    const refrescar = vi.fn().mockResolvedValue(undefined)
    renderHook(() => useRefrescoAutomaticoCoex({ refrescar }))

    await avanzar(INTERVALO_REFRESCO_MS * 3)
    expect(refrescar).not.toHaveBeenCalled()
  })

  it('17. al volver a visible refresca de inmediato y reanuda el ciclo', async () => {
    fijarVisible(false)
    const refrescar = vi.fn().mockResolvedValue(undefined)
    renderHook(() => useRefrescoAutomaticoCoex({ refrescar }))

    await avanzar(INTERVALO_REFRESCO_MS * 2)
    expect(refrescar).not.toHaveBeenCalled()

    fijarVisible(true)
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(refrescar).toHaveBeenCalledTimes(1)

    await avanzar(INTERVALO_REFRESCO_MS)
    expect(refrescar).toHaveBeenCalledTimes(2)
  })

  it('18. no crea temporizadores duplicados al cambiar `pausado`', async () => {
    const refrescar = vi.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(
      ({ pausado }) => useRefrescoAutomaticoCoex({ refrescar, pausado }),
      { initialProps: { pausado: false } },
    )

    rerender({ pausado: true })
    rerender({ pausado: false })

    await avanzar(INTERVALO_REFRESCO_MS)
    expect(refrescar).toHaveBeenCalledTimes(1)
  })

  it('19. el cleanup elimina el temporizador y el listener', async () => {
    const refrescar = vi.fn().mockResolvedValue(undefined)
    const { unmount } = renderHook(() => useRefrescoAutomaticoCoex({ refrescar }))

    unmount()

    await avanzar(INTERVALO_REFRESCO_MS * 4)
    expect(refrescar).not.toHaveBeenCalled()

    fijarVisible(true)
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(refrescar).not.toHaveBeenCalled()
  })
})
