import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TarjetaConfirmacionDepurar from './TarjetaConfirmacionDepurar.jsx'

const NOMBRE_LARGO = 'María Fernanda López García de la Cruz con un nombre extremadamente largo'

const EXPEDIENTE = {
  numeroExpediente: '927581',
  pacienteNombre: NOMBRE_LARGO,
}

function renderTarjeta(props = {}) {
  return render(
    <TarjetaConfirmacionDepurar
      expediente={EXPEDIENTE}
      onSolicitarDepuracion={() => {}}
      {...props}
    />,
  )
}

describe('TarjetaConfirmacionDepurar', () => {
  it('muestra el nombre completo, el expediente formateado y el estado vigente', () => {
    renderTarjeta()

    expect(screen.getByText(NOMBRE_LARGO)).toBeInTheDocument()
    expect(screen.getByText('9275-81')).toBeInTheDocument()
    expect(screen.getByText(/vigente/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/motivo/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar depuración/i })).not.toBeInTheDocument()
  })

  it('solicita la confirmación sin ejecutar la baja', async () => {
    const onSolicitarDepuracion = vi.fn()
    const user = userEvent.setup()
    renderTarjeta({ onSolicitarDepuracion })

    await user.click(screen.getByRole('button', { name: /depurar expediente/i }))

    expect(onSolicitarDepuracion).toHaveBeenCalledTimes(1)
  })

  it('en la variante ya depurado no ofrece iniciar otra baja', () => {
    renderTarjeta({ yaDepurado: true })

    expect(screen.getByText(/expediente ya depurado/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /depurar expediente/i })).not.toBeInTheDocument()
    expect(screen.getByText(NOMBRE_LARGO)).toBeInTheDocument()
    expect(screen.getByText('9275-81')).toBeInTheDocument()
  })
})
