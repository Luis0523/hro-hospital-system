import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UltimaDepuracionPanel from './UltimaDepuracionPanel.jsx'

const DEPURACION = {
  id: 'dep-1',
  numeroExpediente: '927581',
  pacienteNombre: 'Paciente Ficticio Uno',
}

describe('UltimaDepuracionPanel', () => {
  it('no muestra nada sin una operación reversible', () => {
    const { container } = render(<UltimaDepuracionPanel depuracion={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('muestra el expediente, paciente y la acción Deshacer', () => {
    render(<UltimaDepuracionPanel depuracion={DEPURACION} />)

    expect(
      screen.getByRole('heading', { name: /última depuración de la sesión/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/9275-81/)).toBeInTheDocument()
    expect(screen.getByText(/paciente ficticio uno/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /deshacer/i })).toBeEnabled()
  })

  it('notifica la solicitud de deshacer', async () => {
    const onDeshacer = vi.fn()
    const user = userEvent.setup()
    render(<UltimaDepuracionPanel depuracion={DEPURACION} onDeshacer={onDeshacer} />)

    await user.click(screen.getByRole('button', { name: /deshacer/i }))

    expect(onDeshacer).toHaveBeenCalledTimes(1)
  })

  it('deshabilita la acción mientras se procesa', () => {
    render(<UltimaDepuracionPanel depuracion={DEPURACION} deshaciendo />)

    expect(screen.getByRole('button', { name: /deshacer/i })).toBeDisabled()
  })
})
