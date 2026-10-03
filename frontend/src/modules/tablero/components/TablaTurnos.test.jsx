import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import TablaTurnos from './TablaTurnos.jsx'

function asignacion(id) {
  return {
    asignacionDiariaEspacioId: id,
    espacioNumero: String(200 + id),
    nivel: 2,
    subespecialidadNombre: `Clínica ${id}`,
    turnoActual: id,
    turnoSiguiente: id + 1,
    ultimaActualizacion: null,
  }
}

function secciones() {
  return screen.getAllByTestId('tablero-tabla-cuerpo')
}

function filasDeSeccion(indice) {
  return within(secciones()[indice]).getAllByRole('row')
}

function filas() {
  return secciones().flatMap((cuerpo) => within(cuerpo).getAllByRole('row'))
}

describe('TablaTurnos', () => {
  it('renderiza los encabezados de cada columna por sección', () => {
    render(
      <TablaTurnos asignaciones={[asignacion(1), asignacion(2), asignacion(3), asignacion(4)]} />,
    )

    expect(screen.queryByRole('columnheader', { name: /clínica|subespecialidad/i })).toBeNull()
    expect(screen.getAllByRole('columnheader')).toHaveLength(8)
    expect(screen.getAllByRole('columnheader', { name: /turno actual/i })).toHaveLength(2)
    expect(screen.getAllByRole('columnheader', { name: /consultorio/i })).toHaveLength(2)
    expect(screen.getAllByRole('columnheader', { name: /siguiente/i })).toHaveLength(2)
    expect(screen.getAllByRole('columnheader', { name: /en espera/i })).toHaveLength(2)
  })

  it('ordena las columnas turno actual, consultorio, siguiente y en espera', () => {
    render(
      <TablaTurnos asignaciones={[asignacion(1), asignacion(2), asignacion(3), asignacion(4)]} />,
    )

    const encabezados = screen.getAllByRole('columnheader')

    expect(encabezados.map((th) => th.textContent)).toEqual([
      'Turno actual',
      'Consultorio',
      'Siguiente',
      'En espera',
      'Turno actual',
      'Consultorio',
      'Siguiente',
      'En espera',
    ])
  })

  it('con una asignación deja una sola sección', () => {
    render(<TablaTurnos asignaciones={[asignacion(1)]} />)

    expect(secciones()).toHaveLength(1)
    expect(filas()).toHaveLength(1)
  })

  it('con dos asignaciones usa 1 y 1', () => {
    render(<TablaTurnos asignaciones={[asignacion(1), asignacion(2)]} />)
    expect(secciones()).toHaveLength(2)
    expect(secciones().map((_, i) => filasDeSeccion(i).length)).toEqual([1, 1])
  })

  it('con cuatro asignaciones usa 2 y 2', () => {
    render(
      <TablaTurnos asignaciones={[asignacion(1), asignacion(2), asignacion(3), asignacion(4)]} />,
    )
    expect(secciones().map((_, i) => filasDeSeccion(i).length)).toEqual([2, 2])
  })

  it('con cinco asignaciones usa 3 y 2', () => {
    render(<TablaTurnos asignaciones={[1, 2, 3, 4, 5].map((id) => asignacion(id))} />)
    expect(secciones().map((_, i) => filasDeSeccion(i).length)).toEqual([3, 2])
  })

  it('con ocho asignaciones usa 4 y 4', () => {
    render(<TablaTurnos asignaciones={[1, 2, 3, 4, 5, 6, 7, 8].map((id) => asignacion(id))} />)
    expect(secciones().map((_, i) => filasDeSeccion(i).length)).toEqual([4, 4])
  })

  it('mantiene el orden original de las asignaciones', () => {
    render(<TablaTurnos asignaciones={[1, 2, 3, 4, 5].map((id) => asignacion(id))} />)

    const ids = screen
      .getAllByTestId(/^fila-turno-/)
      .map((fila) => fila.getAttribute('data-testid'))

    expect(ids).toEqual([
      'fila-turno-1',
      'fila-turno-2',
      'fila-turno-3',
      'fila-turno-4',
      'fila-turno-5',
    ])
  })

  it('no muestra clínica ni nivel en las filas', () => {
    render(<TablaTurnos asignaciones={[asignacion(1), asignacion(2)]} />)

    expect(screen.queryByText(/Clínica/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Nivel/)).not.toBeInTheDocument()
  })
})

describe('TablaTurnos · últimos llamados', () => {
  function reciente(id, turnoActual, espacioNumero) {
    return { asignacionDiariaEspacioId: id, turnoActual, espacioNumero, completadoEn: 1 }
  }

  it('sin recientes mantiene las dos secciones normales', () => {
    render(<TablaTurnos asignaciones={[1, 2, 3, 4].map((id) => asignacion(id))} />)

    expect(secciones()).toHaveLength(2)
    expect(screen.queryByTestId('tablero-ultimos-llamados')).not.toBeInTheDocument()
  })

  it('con recientes usa la izquierda normal y Últimos llamados a la derecha', () => {
    render(
      <TablaTurnos
        asignaciones={[1, 2, 3, 4].map((id) => asignacion(id))}
        ultimosLlamados={[reciente(3, 21, '107'), reciente(2, 14, '101')]}
      />,
    )

    expect(secciones()).toHaveLength(1)
    expect(screen.getByTestId('tablero-ultimos-llamados')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Últimos llamados' })).toBeInTheDocument()
  })

  it('no renderiza la segunda mitad normal mientras hay recientes', () => {
    render(
      <TablaTurnos
        asignaciones={[1, 2, 3, 4].map((id) => asignacion(id))}
        ultimosLlamados={[reciente(3, 21, '107')]}
      />,
    )

    expect(screen.getByTestId('fila-turno-1')).toBeInTheDocument()
    expect(screen.getByTestId('fila-turno-2')).toBeInTheDocument()
    expect(screen.queryByTestId('fila-turno-3')).not.toBeInTheDocument()
    expect(screen.queryByTestId('fila-turno-4')).not.toBeInTheDocument()
  })

  it('al recibir una lista vacía vuelve la segunda mitad normal', () => {
    const asignaciones = [1, 2, 3, 4].map((id) => asignacion(id))
    const { rerender } = render(
      <TablaTurnos asignaciones={asignaciones} ultimosLlamados={[reciente(3, 21, '107')]} />,
    )

    expect(screen.getByTestId('tablero-ultimos-llamados')).toBeInTheDocument()

    rerender(<TablaTurnos asignaciones={asignaciones} ultimosLlamados={[]} />)

    expect(screen.queryByTestId('tablero-ultimos-llamados')).not.toBeInTheDocument()
    expect(secciones()).toHaveLength(2)
    expect(screen.getByTestId('fila-turno-3')).toBeInTheDocument()
  })
})
