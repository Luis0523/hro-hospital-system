import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { COOLDOWN_MS } from '../api/doctorAcciones'
import { useCooldown } from './useCooldown'

describe('useCooldown', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('cuenta el cooldown y vuelve a cero al vencer', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)

    const { result } = renderHook(() => useCooldown(1_000_000))
    expect(result.current.restanteSegundos).toBe(10)

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.restanteSegundos).toBe(8)

    act(() => {
      vi.advanceTimersByTime(COOLDOWN_MS)
    })
    expect(result.current.restanteSegundos).toBe(0)
    expect(result.current.restanteMs).toBe(0)
  })
})
