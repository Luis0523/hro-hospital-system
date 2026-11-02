import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PanelUltimaAccion from './PanelUltimaAccion.jsx'

function accion(overrides = {}) {
  return {
    tipo: 'prestamo',
    registro: {
      id: 'se-1',
      numeroExpediente: '927581',
      personaRetira: 'Ana Ramírez',
      motivo: 'Tesis',
      fechaSalida: '2026-11-02T15:00:00.000Z',
      fechaDevolucion: null,
      creadoEn: '2026-11-02T15:00:00.000Z',
      recuperadoManualmente: false,
      ...overrides,
    },
  }
}

describe('PanelUltimaAccion', () => {
  it('no se muestra sin una acción registrada', () => {
    render(<PanelUltimaAccion accion={null} onRevertir={vi.fn()} />)
    expect(screen.queryByText('Última acción realizada')).not.toBeInTheDocument()
  })

  it('muestra el préstamo registrado', () => {
    render(<PanelUltimaAccion accion={accion()} onRevertir={vi.fn()} />)

    expect(screen.getByText('Última acción realizada')).toBeInTheDocument()
    expect(screen.getByText('Préstamo registrado')).toBeInTheDocument()
    expect(screen.getByText('9275-81')).toBeInTheDocument()
    expect(screen.getByText(/Ana Ramírez/)).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('respeta la presentación del ingreso manual', () => {
    render(
      <PanelUltimaAccion
        accion={accion({
          numeroExpediente: '911330',
          numeroExpedientePresentacion: '91-1330',
        })}
        onRevertir={vi.fn()}
      />,
    )

    expect(screen.getByText('91-1330')).toBeInTheDocument()
  })

  it('muestra una devolución con su estado', () => {
    render(
      <PanelUltimaAccion
        accion={{
          tipo: 'devolucion',
          registro: accion({ fechaDevolucion: '2026-11-02T18:00:00.000Z' }).registro,
        }}
        onRevertir={vi.fn()}
      />,
    )

    expect(screen.getByText('Devolución registrada')).toBeInTheDocument()
    expect(screen.getByText('Devuelto')).toBeInTheDocument()
    expect(screen.getByText(/02\/11\/2026 12:00/)).toBeInTheDocument()
  })

  it('muestra una recuperación', () => {
    render(
      <PanelUltimaAccion
        accion={{
          tipo: 'recuperacion',
          registro: accion({ recuperadoManualmente: true }).registro,
        }}
        onRevertir={vi.fn()}
      />,
    )

    expect(screen.getByText('Préstamo recuperado')).toBeInTheDocument()
  })

  it('solicita revertir la acción', async () => {
    const onRevertir = vi.fn()
    const usuario = userEvent.setup()
    render(<PanelUltimaAccion accion={accion()} onRevertir={onRevertir} />)

    await usuario.click(screen.getByRole('button', { name: 'Revertir última acción' }))

    expect(onRevertir).toHaveBeenCalledTimes(1)
  })

  it('bloquea el botón mientras revierte', async () => {
    const onRevertir = vi.fn()
    const usuario = userEvent.setup()
    render(<PanelUltimaAccion accion={accion()} onRevertir={onRevertir} revirtiendo />)

    const boton = screen.getByRole('button', { name: 'Revirtiendo…' })
    expect(boton).toBeDisabled()

    await usuario.click(boton)
    expect(onRevertir).not.toHaveBeenCalled()
  })
})
