import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import SeccionUltimosLlamados from './SeccionUltimosLlamados.jsx'

function llamado(id, turnoActual, espacioNumero) {
  return {
    asignacionDiariaEspacioId: id,
    turnoActual,
    espacioNumero,
    completadoEn: 1_700_000_000_000,
  }
}

function filas() {
  return screen.getAllByTestId(/^ultimo-llamado-/)
}

describe('SeccionUltimosLlamados', () => {
  it('muestra el encabezado Últimos llamados', () => {
    render(<SeccionUltimosLlamados ultimosLlamados={[llamado(1, 21, '107')]} />)

    expect(
      screen.getByRole('columnheader', { name: 'Últimos llamados' }),
    ).toBeInTheDocument()
  })

  it('expone la semántica de tabla con caption', () => {
    render(<SeccionUltimosLlamados ultimosLlamados={[llamado(1, 21, '107')]} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByTestId('tablero-ultimos-llamados').querySelector('caption')).toHaveTextContent(
      'Últimos llamados',
    )
  })

  it('muestra turno primero y consultorio segundo', () => {
    render(<SeccionUltimosLlamados ultimosLlamados={[llamado(1, 21, '107')]} />)

    const celdas = within(screen.getByTestId('ultimo-llamado-1-21')).getAllByRole('cell')

    expect(celdas[0]).toHaveTextContent('#021')
    expect(celdas[1]).toHaveTextContent('107')
  })

  it('conserva el orden recibido', () => {
    render(
      <SeccionUltimosLlamados
        ultimosLlamados={[llamado(3, 21, '107'), llamado(2, 14, '101'), llamado(1, 5, '103')]}
      />,
    )

    expect(filas().map((fila) => fila.getAttribute('data-testid'))).toEqual([
      'ultimo-llamado-3-21',
      'ultimo-llamado-2-14',
      'ultimo-llamado-1-5',
    ])
  })

  it('permite dos turnos distintos de la misma asignación sin colisionar', () => {
    const errores = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      errores.push(args.join(' '))
    })

    try {
      render(
        <SeccionUltimosLlamados
          ultimosLlamados={[llamado(1, 6, '103'), llamado(1, 5, '103')]}
        />,
      )

      expect(screen.getByTestId('ultimo-llamado-1-6')).toBeInTheDocument()
      expect(screen.getByTestId('ultimo-llamado-1-5')).toBeInTheDocument()
      expect(filas()).toHaveLength(2)
      expect(errores.filter((m) => /duplicate key|unique "key"/i.test(m))).toEqual([])
    } finally {
      spy.mockRestore()
    }
  })

  it('no muestra clínica, subespecialidad ni nivel', () => {
    render(
      <SeccionUltimosLlamados
        ultimosLlamados={[
          {
            ...llamado(1, 21, '107'),
            subespecialidadNombre: 'Pediatría General',
            nivel: 2,
          },
        ]}
      />,
    )

    expect(screen.queryByText(/Clínica/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Pediatría/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Nivel/)).not.toBeInTheDocument()
  })

  it('no muestra datos personales aunque vengan en el objeto', () => {
    render(
      <SeccionUltimosLlamados
        ultimosLlamados={[
          {
            ...llamado(1, 21, '107'),
            nombrePaciente: 'Juan Perez',
            dpi: '1234567890101',
            expediente: 'HRO-123',
            telefono: '55555555',
          },
        ]}
      />,
    )

    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument()
    expect(screen.queryByText('1234567890101')).not.toBeInTheDocument()
    expect(screen.queryByText('HRO-123')).not.toBeInTheDocument()
    expect(screen.queryByText('55555555')).not.toBeInTheDocument()
  })

  it('conserva la estructura en tema oscuro', () => {
    render(
      <div className="dark">
        <SeccionUltimosLlamados ultimosLlamados={[llamado(1, 21, '107')]} />
      </div>,
    )

    expect(screen.getByTestId('tablero-ultimos-llamados')).toBeInTheDocument()
    expect(screen.getByTestId('ultimo-llamado-1-21')).toHaveTextContent('#021')
  })
})
