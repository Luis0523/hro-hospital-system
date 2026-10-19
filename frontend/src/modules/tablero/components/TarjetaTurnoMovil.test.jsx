import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import TarjetaTurnoMovil, { ListaTurnosMovil } from './TarjetaTurnoMovil.jsx'

function asignacion(overrides = {}) {
  return {
    asignacionDiariaEspacioId: 1,
    espacioNumero: '6A',
    turnoActual: 7,
    turnoSiguiente: 8,
    turnosEnEspera: [9, 10],
    ...overrides,
  }
}

describe('TarjetaTurnoMovil', () => {
  it('muestra turno actual, consultorio, siguiente y en espera', () => {
    render(<TarjetaTurnoMovil asignacion={asignacion()} />)

    const tarjeta = screen.getByTestId('tarjeta-turno-1')

    expect(within(tarjeta).getByText('Turno actual')).toBeInTheDocument()
    expect(within(tarjeta).getByText('#007')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Consultorio')).toBeInTheDocument()
    expect(within(tarjeta).getByText('6A')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Siguiente')).toBeInTheDocument()
    expect(within(tarjeta).getByText('#008')).toBeInTheDocument()
    expect(within(tarjeta).getByText('En espera')).toBeInTheDocument()
    expect(within(tarjeta).getByText('#009')).toBeInTheDocument()
    expect(within(tarjeta).getByText('#010')).toBeInTheDocument()
  })

  it('maneja turnos nulos y cola vacía', () => {
    render(
      <TarjetaTurnoMovil
        asignacion={asignacion({
          turnoActual: null,
          turnoSiguiente: null,
          turnosEnEspera: [],
        })}
      />,
    )

    const tarjeta = screen.getByTestId('tarjeta-turno-1')

    expect(within(tarjeta).getAllByText('—')).toHaveLength(3)
  })

  it('ListaTurnosMovil renderiza una tarjeta por asignación y muestra 6A/6B', () => {
    render(
      <ListaTurnosMovil
        asignaciones={[
          asignacion({ asignacionDiariaEspacioId: 1, espacioNumero: '6A' }),
          asignacion({ asignacionDiariaEspacioId: 2, espacioNumero: '6B' }),
        ]}
      />,
    )

    expect(screen.getByTestId('tablero-turnos-movil')).toBeInTheDocument()
    expect(screen.getAllByTestId(/^tarjeta-turno-/)).toHaveLength(2)
    expect(screen.getByText('6A')).toBeInTheDocument()
    expect(screen.getByText('6B')).toBeInTheDocument()
  })
})
