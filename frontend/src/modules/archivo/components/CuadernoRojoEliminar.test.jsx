import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import CuadernoRojoEliminar from './CuadernoRojoEliminar.jsx'

const REGISTRO = {
  id: 'r-1',
  fecha: '2026-11-03',
  egresosHospitalarios: 1,
  sobresEmergencia: 2,
  sobresSellados: 3,
  tia: 4,
}

function renderModal(extra = {}) {
  return render(
    <CuadernoRojoEliminar
      abierto
      registro={REGISTRO}
      paso={1}
      eliminando={false}
      onContinuar={vi.fn()}
      onCancelar={vi.fn()}
      onConfirmar={vi.fn()}
      {...extra}
    />,
  )
}

describe('CuadernoRojoEliminar', () => {
  it('muestra la primera confirmación con fecha y cantidades', () => {
    renderModal()

    expect(screen.getByRole('heading', { name: 'Eliminar registro' })).toBeInTheDocument()
    expect(screen.getByText(/¿Desea eliminar el registro del/)).toBeInTheDocument()
    expect(screen.getByText('03/11/2026')).toBeInTheDocument()
    expect(screen.getByText('Egresos hospitalarios')).toBeInTheDocument()
    expect(screen.getByText('TIA')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument()
    expect(screen.queryByText('Operación destructiva')).not.toBeInTheDocument()
  })

  it('continúa a la segunda confirmación sin mostrar ambos contenidos', () => {
    const onContinuar = vi.fn()
    const { rerender } = renderModal({ onContinuar })

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onContinuar).toHaveBeenCalledTimes(1)

    rerender(
      <CuadernoRojoEliminar
        abierto
        registro={REGISTRO}
        paso={2}
        eliminando={false}
        onContinuar={onContinuar}
        onCancelar={vi.fn()}
        onConfirmar={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Eliminar registro definitivamente' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Operación destructiva')).toBeInTheDocument()
    expect(screen.queryByText(/¿Desea eliminar el registro del/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /eliminar definitivamente/i })).toBeInTheDocument()
  })

  it('cancela en ambos pasos sin confirmar', () => {
    const onCancelar = vi.fn()
    const { rerender } = renderModal({ onCancelar })

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancelar).toHaveBeenCalledTimes(1)

    rerender(
      <CuadernoRojoEliminar
        abierto
        registro={REGISTRO}
        paso={2}
        eliminando={false}
        onContinuar={vi.fn()}
        onCancelar={onCancelar}
        onConfirmar={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancelar).toHaveBeenCalledTimes(2)
  })

  it('confirma la eliminación y bloquea acciones mientras elimina', () => {
    const onConfirmar = vi.fn()
    const { rerender } = render(
      <CuadernoRojoEliminar
        abierto
        registro={REGISTRO}
        paso={2}
        eliminando={false}
        onContinuar={vi.fn()}
        onCancelar={vi.fn()}
        onConfirmar={onConfirmar}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /eliminar definitivamente/i }))
    expect(onConfirmar).toHaveBeenCalledTimes(1)

    rerender(
      <CuadernoRojoEliminar
        abierto
        registro={REGISTRO}
        paso={2}
        eliminando
        onContinuar={vi.fn()}
        onCancelar={vi.fn()}
        onConfirmar={onConfirmar}
      />,
    )
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /eliminando/i })).toBeDisabled()
  })
})
