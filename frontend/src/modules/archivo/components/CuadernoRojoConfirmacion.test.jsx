import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import CuadernoRojoConfirmacion from './CuadernoRojoConfirmacion.jsx'

const VALORES = {
  fecha: '2026-11-03',
  egresosHospitalarios: '10',
  sobres: '20',
  sobresSellados: '30',
  tia: '40',
}

function renderModal(extra = {}) {
  return render(
    <CuadernoRojoConfirmacion
      abierto
      fecha={VALORES.fecha}
      valores={VALORES}
      guardando={false}
      onCancelar={vi.fn()}
      onConfirmar={vi.fn()}
      {...extra}
    />,
  )
}

describe('CuadernoRojoConfirmacion', () => {
  it('muestra el título, la fecha y las cuatro cantidades', () => {
    renderModal()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Actualizar registro' })).toBeInTheDocument()
    expect(screen.getByText('03/11/2026')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByText(/se reemplazarán los valores guardados/i)).toBeInTheDocument()
  })

  it('confirma con el botón Confirmar', () => {
    const onConfirmar = vi.fn()
    renderModal({ onConfirmar })

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onConfirmar).toHaveBeenCalledTimes(1)
  })

  it('cancela sin guardar', () => {
    const onCancelar = vi.fn()
    renderModal({ onCancelar })

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancelar).toHaveBeenCalledTimes(1)
  })

  it('no permite cerrar ni confirmar mientras guarda', () => {
    const onCancelar = vi.fn()
    renderModal({ guardando: true, onCancelar })

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled()

    fireEvent.keyDown(document, { key: 'Escape', keyCode: 27 })

    expect(onCancelar).not.toHaveBeenCalled()
  })
})
