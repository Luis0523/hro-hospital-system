import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SimuladorLlamado, { simuladorHabilitado } from './SimuladorLlamado.jsx'

describe('simuladorHabilitado', () => {
  it('exige DEV + mock + flag', () => {
    expect(
      simuladorHabilitado({
        DEV: false,
        VITE_USE_MOCK: 'true',
        VITE_TABLERO_SIMULADOR_LLAMADO: 'true',
      }),
    ).toBe(false)

    expect(
      simuladorHabilitado({
        DEV: true,
        VITE_USE_MOCK: 'false',
        VITE_TABLERO_SIMULADOR_LLAMADO: 'true',
      }),
    ).toBe(false)

    expect(
      simuladorHabilitado({
        DEV: true,
        VITE_USE_MOCK: 'true',
        VITE_TABLERO_SIMULADOR_LLAMADO: 'false',
      }),
    ).toBe(false)

    expect(
      simuladorHabilitado({
        DEV: true,
        VITE_USE_MOCK: 'true',
        VITE_TABLERO_SIMULADOR_LLAMADO: 'true',
      }),
    ).toBe(true)
  })
})

describe('SimuladorLlamado', () => {
  it('no renderiza controles cuando está deshabilitado', () => {
    render(<SimuladorLlamado habilitado={false} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('muestra Simular llamado y Re-llamar', () => {
    render(<SimuladorLlamado habilitado />)

    expect(screen.getByRole('button', { name: 'Simular llamado' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Re-llamar' })).toBeInTheDocument()
  })

  it('deshabilita los botones cuando no hay asignación', () => {
    render(<SimuladorLlamado habilitado hayAsignacion={false} />)

    expect(screen.getByRole('button', { name: 'Simular llamado' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Re-llamar' })).toBeDisabled()
  })

  it('Re-llamar está deshabilitado antes del primer llamado', () => {
    render(<SimuladorLlamado habilitado puedeRellamar={false} />)

    expect(screen.getByRole('button', { name: 'Re-llamar' })).toBeDisabled()
  })

  it('invoca los callbacks al hacer clic', async () => {
    const onSimular = vi.fn()
    const onRellamar = vi.fn()
    render(
      <SimuladorLlamado habilitado puedeRellamar onSimular={onSimular} onRellamar={onRellamar} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Simular llamado' }))
    await userEvent.click(screen.getByRole('button', { name: 'Re-llamar' }))

    expect(onSimular).toHaveBeenCalledTimes(1)
    expect(onRellamar).toHaveBeenCalledTimes(1)
  })
})
