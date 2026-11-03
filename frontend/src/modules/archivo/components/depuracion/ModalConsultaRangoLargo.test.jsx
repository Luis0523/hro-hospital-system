import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalConsultaRangoLargo from './ModalConsultaRangoLargo.jsx'

const PERIODO = {
  desde: '2026-01-01',
  hasta: '2026-03-31',
  diasCalendario: 90,
}

function renderModal(props = {}) {
  return render(
    <ModalConsultaRangoLargo
      abierto
      periodo={PERIODO}
      onConfirmar={() => {}}
      onCancelar={() => {}}
      {...props}
    />,
  )
}

describe('ModalConsultaRangoLargo', () => {
  it('muestra el período y la cantidad estimada de consultas diarias', () => {
    renderModal()

    expect(screen.getByRole('heading', { name: 'Confirmar consulta extensa' })).toBeInTheDocument()
    expect(screen.getByText(/1 de enero al 31 de marzo de 2026/i)).toBeInTheDocument()
    expect(screen.getByText('90')).toBeInTheDocument()
    expect(screen.getByText(/90 consultas diarias/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toHaveFocus()
  })

  it('confirma y cancela mediante acciones explícitas', async () => {
    const onConfirmar = vi.fn()
    const onCancelar = vi.fn()
    const user = userEvent.setup()
    renderModal({ onConfirmar, onCancelar })

    await user.click(screen.getByRole('button', { name: /continuar consulta/i }))
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(onConfirmar).toHaveBeenCalledTimes(1)
    expect(onCancelar).toHaveBeenCalledTimes(1)
  })

  it('no renderiza sin período pendiente', () => {
    renderModal({ periodo: null })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
