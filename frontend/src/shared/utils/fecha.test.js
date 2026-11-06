import { afterEach, describe, expect, it, vi } from 'vitest'
import { hoyIsoGuatemala } from './fecha'

afterEach(() => {
  vi.useRealTimers()
})

describe('hoyIsoGuatemala', () => {
  it('devuelve el día de Guatemala cuando en UTC ya cambió el día', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-04T02:30:00Z'))

    expect(hoyIsoGuatemala()).toBe('2026-11-03')
  })

  it('devuelve el día de Guatemala al iniciar el día guatemalteco', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-04T07:00:00Z'))

    expect(hoyIsoGuatemala()).toBe('2026-11-04')
  })

  it('mantiene el formato ISO YYYY-MM-DD', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-02T18:00:00Z'))

    expect(hoyIsoGuatemala()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
