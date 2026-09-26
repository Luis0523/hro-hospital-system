import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SelectorEstacion from './SelectorEstacion.jsx'

const ESTACIONES = [
  {
    id: 'box-04',
    terminal: 'BOX-04 Triage',
    clinicaId: 1,
    clinicaNombre: 'Clínica 101 - Medicina General',
    ubicacion: 'Nivel 1',
    estado: 'disponible',
  },
  {
    id: 'box-05',
    terminal: 'BOX-05 Pediatría',
    clinicaId: 2,
    clinicaNombre: 'Clínica 102 - Pediatría',
    ubicacion: 'Nivel 1',
    estado: 'ocupada',
  },
]

describe('SelectorEstacion', () => {
  it('muestra las estaciones y deshabilita confirmar sin selección', () => {
    render(
      <SelectorEstacion estaciones={ESTACIONES} onSeleccionar={() => {}} onConfirmar={() => {}} />,
    )

    expect(screen.getByText('BOX-04 Triage')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar a la estación/i })).toBeDisabled()
  })

  it('selecciona una estación y permite confirmar', async () => {
    const onSeleccionar = vi.fn()
    const onConfirmar = vi.fn()

    const { rerender } = render(
      <SelectorEstacion
        estaciones={ESTACIONES}
        seleccionada={null}
        onSeleccionar={onSeleccionar}
        onConfirmar={onConfirmar}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /BOX-04 Triage/i }))
    expect(onSeleccionar).toHaveBeenCalledWith('box-04')

    rerender(
      <SelectorEstacion
        estaciones={ESTACIONES}
        seleccionada="box-04"
        onSeleccionar={onSeleccionar}
        onConfirmar={onConfirmar}
      />,
    )

    const confirmar = screen.getByRole('button', { name: /entrar a la estación/i })
    expect(confirmar).toBeEnabled()
    await userEvent.click(confirmar)
    expect(onConfirmar).toHaveBeenCalledTimes(1)
  })
})
