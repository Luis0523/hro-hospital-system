import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ColaPanel from './ColaPanel.jsx'

const TURNOS = [
  { id: 1, numeroTurno: 43, estado: 'en_espera', pacienteNombre: 'Ana Pérez' },
  { id: 2, numeroTurno: 42, estado: 'llamado', pacienteNombre: 'Carlos Mendoza' },
]

const NO_RESPONDIDOS = [
  { id: 3, numeroTurno: 41, estado: 'no_responde', pacienteNombre: 'Rosa Chávez' },
]

describe('ColaPanel', () => {
  it('muestra el tiempo de gracia del turno llamado', () => {
    render(<ColaPanel turnos={TURNOS} turnoEnGraciaId={2} segundosRestantes={125} />)
    expect(screen.getByText('Tiempo de gracia: 2:05')).toBeInTheDocument()
  })

  it('permite reintegrar a un no respondido', async () => {
    const onReintegrar = vi.fn()
    render(<ColaPanel turnos={[]} noRespondidos={NO_RESPONDIDOS} onReintegrar={onReintegrar} />)

    await userEvent.click(screen.getByRole('button', { name: /reintegrar/i }))

    expect(onReintegrar).toHaveBeenCalledWith(NO_RESPONDIDOS[0])
  })

  it('permite marcar no responde cuando el turno está llamado', async () => {
    const onNoResponde = vi.fn()
    render(<ColaPanel turnos={TURNOS} onNoResponde={onNoResponde} />)

    await userEvent.click(screen.getByRole('button', { name: /no responde/i }))

    expect(onNoResponde).toHaveBeenCalledWith(TURNOS[1])
  })
})
