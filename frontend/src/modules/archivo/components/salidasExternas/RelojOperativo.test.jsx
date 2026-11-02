import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import RelojOperativo from './RelojOperativo.jsx'

describe('RelojOperativo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-02T15:30:45.000Z')) // 09:30:45 en Guatemala
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('muestra la fecha larga y la hora de Guatemala con segundos', () => {
    render(<RelojOperativo />)

    expect(screen.getByLabelText('Hora actual')).toHaveTextContent('09:30:45')
    const fecha = screen.getByText(/noviembre de 2026/)
    expect(fecha).toHaveTextContent('Lunes')
    expect(fecha).toHaveTextContent('2 de noviembre de 2026')
  })

  it('actualiza la hora cada segundo', () => {
    render(<RelojOperativo />)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByLabelText('Hora actual')).toHaveTextContent('09:30:46')
  })

  it('limpia el intervalo al desmontar', () => {
    const { unmount } = render(<RelojOperativo />)
    expect(vi.getTimerCount()).toBe(1)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
