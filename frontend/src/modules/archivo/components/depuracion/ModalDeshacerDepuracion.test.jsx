import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalDeshacerDepuracion from './ModalDeshacerDepuracion.jsx'

const DEPURACION = {
  id: 'dep-1',
  numeroExpediente: '927581',
  pacienteNombre: 'Paciente Ficticio Uno',
}

function renderModal(props = {}) {
  return render(
    <ModalDeshacerDepuracion
      abierto
      depuracion={DEPURACION}
      onConfirmar={() => {}}
      onCerrar={() => {}}
      deshaciendo={false}
      error={null}
      {...props}
    />,
  )
}

describe('ModalDeshacerDepuracion', () => {
  it('muestra expediente, paciente y advertencia de reversión simulada', () => {
    renderModal()

    expect(screen.getByRole('heading', { name: 'Deshacer última depuración' })).toBeInTheDocument()
    expect(screen.getByText('9275-81')).toBeInTheDocument()
    expect(screen.getByText('Paciente Ficticio Uno')).toBeInTheDocument()
    expect(screen.getByText('Reversión simulada')).toBeInTheDocument()
    expect(screen.getByText(/no se modifica una depuración real/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirmar reversión/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toHaveFocus()
  })

  it('no renderiza el diálogo sin depuración', () => {
    renderModal({ depuracion: null })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cancela sin confirmar', async () => {
    const onCerrar = vi.fn()
    const onConfirmar = vi.fn()
    const user = userEvent.setup()
    renderModal({ onCerrar, onConfirmar })

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(onCerrar).toHaveBeenCalledTimes(1)
    expect(onConfirmar).not.toHaveBeenCalled()
  })

  it('confirma una sola vez desde el modal', async () => {
    const onConfirmar = vi.fn()
    const user = userEvent.setup()
    renderModal({ onConfirmar })

    await user.click(screen.getByRole('button', { name: /confirmar reversión/i }))

    expect(onConfirmar).toHaveBeenCalledTimes(1)
  })

  it('bloquea acciones y cierre lógico mientras revierte', () => {
    const onCerrar = vi.fn()
    renderModal({ deshaciendo: true, onCerrar })

    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /revirtiendo/i })).toBeDisabled()
  })

  it('muestra el error conservando el expediente', () => {
    renderModal({ error: 'No se pudo deshacer la depuración simulada.' })

    expect(screen.getByText(/no se pudo deshacer la depuración simulada/i)).toBeInTheDocument()
    expect(screen.getByText('9275-81')).toBeInTheDocument()
  })

  it('cierra con Escape cuando no está procesando', async () => {
    const onCerrar = vi.fn()
    const user = userEvent.setup()
    renderModal({ onCerrar })

    await user.keyboard('{Escape}')

    expect(onCerrar).toHaveBeenCalled()
  })
})
