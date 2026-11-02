import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TarjetaConfirmacionDepurar from './TarjetaConfirmacionDepurar.jsx'

const NOMBRE_LARGO = 'María Fernanda López García de la Cruz con un nombre extremadamente largo'

const EXPEDIENTE = {
  numeroExpediente: 'EXP-2024-035',
  pacienteNombre: NOMBRE_LARGO,
}

function renderTarjeta(props = {}) {
  return render(
    <TarjetaConfirmacionDepurar
      expediente={EXPEDIENTE}
      motivo=""
      onMotivo={() => {}}
      onConfirmar={() => {}}
      procesando={false}
      {...props}
    />,
  )
}

describe('TarjetaConfirmacionDepurar', () => {
  it('muestra el nombre completo, el expediente y el motivo opcional', () => {
    renderTarjeta()

    expect(screen.getByText(NOMBRE_LARGO)).toBeInTheDocument()
    expect(screen.getByText('EXP-2024-035')).toBeInTheDocument()
    expect(screen.getByLabelText(/motivo \(opcional\)/i)).toBeInTheDocument()
    expect(screen.getByText(/confirmación requerida/i)).toBeInTheDocument()
    expect(screen.getByText(/no existente/i)).toBeInTheDocument()
  })

  it('conserva el botón de confirmación y ejecuta la acción', async () => {
    const onConfirmar = vi.fn()
    const user = userEvent.setup()
    renderTarjeta({ onConfirmar })

    await user.click(screen.getByRole('button', { name: /marcar como depurado/i }))
    expect(onConfirmar).toHaveBeenCalledTimes(1)
  })

  it('propaga el motivo escrito', () => {
    const onMotivo = vi.fn()
    renderTarjeta({ onMotivo })

    fireEvent.change(screen.getByLabelText(/motivo \(opcional\)/i), {
      target: { value: 'Fusionado con otro expediente' },
    })

    expect(onMotivo).toHaveBeenCalledWith('Fusionado con otro expediente')
  })

  it('indica el procesamiento sin cambiar la acción', () => {
    renderTarjeta({ procesando: true })

    const boton = screen.getByRole('button', { name: /marcando/i })
    expect(boton).toBeDisabled()
  })

  it('en la variante ya depurado no ofrece motivo ni confirmación', () => {
    renderTarjeta({ yaDepurado: true })

    expect(screen.getByText(/expediente ya depurado/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como depurado/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/motivo/i)).not.toBeInTheDocument()
    expect(screen.getByText(NOMBRE_LARGO)).toBeInTheDocument()
  })
})
