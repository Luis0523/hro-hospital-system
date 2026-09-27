import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FilaTurno from './FilaTurno.jsx'

const ASIGNACION = {
  asignacionDiariaEspacioId: 1,
  espacioNumero: '203',
  subespecialidadNombre: 'Pediatría General',
  turnoActual: 7,
  turnosEnEspera: [9, 8],
  pacienteNombre: 'Juan Perez',
}

function renderFila(asignacion) {
  render(
    <table>
      <tbody>
        <FilaTurno asignacion={asignacion} />
      </tbody>
    </table>,
  )
}

describe('FilaTurno', () => {
  it('muestra el número de clínica y el turno siguiente (el menor en espera)', () => {
    renderFila(ASIGNACION)

    expect(screen.getByText('203')).toBeInTheDocument()
    expect(screen.getByTestId('fila-siguiente-1')).toHaveTextContent('#008')
  })

  it('muestra "—" cuando no hay turnos en espera', () => {
    renderFila({ ...ASIGNACION, turnosEnEspera: [] })

    expect(screen.getByTestId('fila-siguiente-1')).toHaveTextContent('—')
  })

  it('no muestra la subespecialidad ni datos personales', () => {
    renderFila(ASIGNACION)

    expect(screen.queryByText('Pediatría General')).not.toBeInTheDocument()
    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument()
  })

  it('maneja valores nulos o faltantes de forma segura', () => {
    renderFila({ asignacionDiariaEspacioId: 9 })

    expect(screen.getAllByText('—')).toHaveLength(2)
  })
})
