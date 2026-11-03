import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalConfirmarDepuracion from './ModalConfirmarDepuracion.jsx'

const EXPEDIENTE = {
  numeroExpediente: '927581',
  pacienteNombre: 'Paciente Ficticio Uno',
}

function renderModal(props = {}) {
  return render(
    <ModalConfirmarDepuracion
      abierto
      expediente={EXPEDIENTE}
      onConfirmar={() => {}}
      onCerrar={() => {}}
      {...props}
    />,
  )
}

describe('ModalConfirmarDepuracion', () => {
  it('muestra expediente, paciente, advertencia y confirmación sin motivo', () => {
    renderModal()

    expect(screen.getByRole('heading', { name: 'Confirmar depuración' })).toBeInTheDocument()
    expect(screen.getByText('Paciente Ficticio Uno')).toBeInTheDocument()
    expect(screen.getByText('9275-81')).toBeInTheDocument()
    expect(screen.getByText(/baja lógica/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/motivo/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirmar depuración/i })).toHaveFocus()
  })

  it('confirma y cancela sin ejecutar dos acciones', async () => {
    const onConfirmar = vi.fn()
    const onCerrar = vi.fn()
    const user = userEvent.setup()
    renderModal({ onConfirmar, onCerrar })

    await user.click(screen.getByRole('button', { name: /confirmar depuración/i }))
    expect(onConfirmar).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })

  it('bloquea acciones mientras procesa y muestra el error', () => {
    renderModal({
      procesando: true,
      error: 'No se pudo registrar la depuración. Inténtelo de nuevo.',
    })

    expect(screen.getByRole('button', { name: /depurando/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled()
    expect(screen.getByText(/no se pudo registrar la depuración/i)).toBeInTheDocument()
  })
})
