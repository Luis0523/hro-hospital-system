import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import TablaTurnos from './TablaTurnos.jsx'

const ASIGNACION = {
  asignacionDiariaEspacioId: 1,
  espacioNumero: '201',
  nivel: 2,
  subespecialidadNombre: 'Pediatría General',
  turnoActual: 7,
  turnoSiguiente: 8,
  ultimaActualizacion: null,
}

function filas() {
  return within(screen.getByTestId('tablero-tabla-cuerpo')).getAllByRole('row')
}

describe('TablaTurnos', () => {
  it('renderiza los encabezados de la tabla', () => {
    render(<TablaTurnos asignaciones={[ASIGNACION]} />)

    expect(
      screen.getByRole('columnheader', { name: /clínica \/ subespecialidad/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /consultorio/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /turno actual/i })).toBeInTheDocument()
  })

  it('renderiza una fila para una sola asignación', () => {
    render(<TablaTurnos asignaciones={[ASIGNACION]} />)

    expect(filas()).toHaveLength(1)
    expect(screen.getByText('Pediatría General')).toBeInTheDocument()
    expect(screen.getByText('#007')).toBeInTheDocument()
  })

  it('renderiza varias asignaciones', () => {
    render(
      <TablaTurnos
        asignaciones={[
          ASIGNACION,
          { ...ASIGNACION, asignacionDiariaEspacioId: 2, espacioNumero: '202', turnoActual: 14 },
          { ...ASIGNACION, asignacionDiariaEspacioId: 3, espacioNumero: '301', turnoActual: 3 },
        ]}
      />,
    )

    expect(filas()).toHaveLength(3)
    expect(screen.getByText('202')).toBeInTheDocument()
    expect(screen.getByText('301')).toBeInTheDocument()
    expect(screen.getByTestId('fila-turno-3')).toBeInTheDocument()
  })

  it('acepta una cantidad dinámica de filas', () => {
    const { rerender } = render(<TablaTurnos asignaciones={[ASIGNACION]} />)
    expect(filas()).toHaveLength(1)

    rerender(
      <TablaTurnos
        asignaciones={[
          ASIGNACION,
          { ...ASIGNACION, asignacionDiariaEspacioId: 2 },
          { ...ASIGNACION, asignacionDiariaEspacioId: 3 },
          { ...ASIGNACION, asignacionDiariaEspacioId: 4 },
          { ...ASIGNACION, asignacionDiariaEspacioId: 5 },
        ]}
      />,
    )

    expect(filas()).toHaveLength(5)
  })

  it('no muestra el siguiente turno en ninguna fila', () => {
    render(<TablaTurnos asignaciones={[ASIGNACION]} />)

    expect(screen.queryByText('#008')).not.toBeInTheDocument()
    expect(screen.queryByText('Siguiente turno')).not.toBeInTheDocument()
  })
})
