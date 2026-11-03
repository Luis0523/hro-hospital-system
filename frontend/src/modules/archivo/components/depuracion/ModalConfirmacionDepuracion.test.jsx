import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalConfirmacionDepuracion from './ModalConfirmacionDepuracion.jsx'

const NOMBRE_LARGO = 'María Fernanda López García de la Cruz con un nombre extremadamente largo'

const EXPEDIENTE = {
  numeroExpediente: '927581',
  pacienteNombre: NOMBRE_LARGO,
}

function renderModal(props = {}) {
  return render(
    <ModalConfirmacionDepuracion
      abierto
      expediente={EXPEDIENTE}
      motivo=""
      onMotivo={() => {}}
      onConfirmar={() => {}}
      onCerrar={() => {}}
      procesando={false}
      error={null}
      {...props}
    />,
  )
}

describe('ModalConfirmacionDepuracion', () => {
  it('muestra el diálogo, paciente, expediente y advertencia de baja lógica', () => {
    renderModal()

    const dialogo = screen.getByRole('dialog')
    expect(dialogo).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Confirmar depuración' })).toBeInTheDocument()
    expect(screen.getByText(NOMBRE_LARGO)).toBeInTheDocument()
    expect(screen.getByText('9275-81')).toBeInTheDocument()
    expect(screen.getByText(/no se elimina físicamente/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/motivo \(opcional\)/i)).toBeInTheDocument()
  })

  it('no renderiza diálogo cuando está cerrado', () => {
    renderModal({ abierto: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('coloca el foco inicial en el motivo', () => {
    renderModal()

    expect(screen.getByLabelText(/motivo \(opcional\)/i)).toHaveFocus()
  })

  it('propaga el motivo escrito', () => {
    const onMotivo = vi.fn()
    renderModal({ onMotivo })

    fireEvent.change(screen.getByLabelText(/motivo \(opcional\)/i), {
      target: { value: 'Fusionado con otro expediente' },
    })

    expect(onMotivo).toHaveBeenCalledWith('Fusionado con otro expediente')
  })

  it('cancelar cierra sin confirmar', async () => {
    const onCerrar = vi.fn()
    const onConfirmar = vi.fn()
    const user = userEvent.setup()
    renderModal({ onCerrar, onConfirmar })

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(onCerrar).toHaveBeenCalledTimes(1)
    expect(onConfirmar).not.toHaveBeenCalled()
  })

  it('confirmar ejecuta la acción una vez desde el modal', async () => {
    const onConfirmar = vi.fn()
    const user = userEvent.setup()
    renderModal({ onConfirmar })

    await user.click(screen.getByRole('button', { name: /confirmar depuración/i }))

    expect(onConfirmar).toHaveBeenCalledTimes(1)
  })

  it('bloquea Cancelar y Confirmar mientras procesa', () => {
    renderModal({ procesando: true })

    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /depurando/i })).toBeDisabled()
    expect(screen.getByLabelText(/motivo \(opcional\)/i)).toBeDisabled()
  })

  it('muestra el error de confirmación conservando el contexto', () => {
    renderModal({ error: 'No se pudo registrar la depuración. Inténtelo de nuevo.' })

    expect(screen.getByText(/no se pudo registrar la depuración/i)).toBeInTheDocument()
    expect(screen.getByText('9275-81')).toBeInTheDocument()
  })

  it('permite cerrar con Escape cuando no está procesando', async () => {
    const onCerrar = vi.fn()
    const user = userEvent.setup()
    renderModal({ onCerrar })

    await user.keyboard('{Escape}')

    expect(onCerrar).toHaveBeenCalled()
  })
})
