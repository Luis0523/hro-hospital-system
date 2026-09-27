import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FilaTurno from './FilaTurno.jsx'

const ASIGNACION = {
  asignacionDiariaEspacioId: 1,
  espacioNumero: '201',
  nivel: 2,
  subespecialidadNombre: 'Pediatría General',
  turnoActual: 7,
  turnoSiguiente: 8,
  turnosEnEspera: [9, 8],
  pacienteNombre: 'Juan Perez',
  ultimaActualizacion: '2026-09-20T08:05:32-06:00',
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
  it('muestra la clínica y el turno siguiente (el menor en espera)', () => {
    renderFila(ASIGNACION)

    expect(screen.getByText('Pediatría General')).toBeInTheDocument()
    expect(screen.getByTestId('fila-siguiente-1')).toHaveTextContent('#008')
  })

  it('muestra "—" cuando no hay turnos en espera', () => {
    renderFila({ ...ASIGNACION, turnosEnEspera: [] })

    expect(screen.getByTestId('fila-siguiente-1')).toHaveTextContent('—')
  })

  it('no muestra consultorio, nivel ni datos personales', () => {
    renderFila(ASIGNACION)

    expect(screen.queryByText('201')).not.toBeInTheDocument()
    expect(screen.queryByText(/Nivel/)).not.toBeInTheDocument()
    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument()
  })

  it('maneja valores nulos o faltantes de forma segura', () => {
    renderFila({ asignacionDiariaEspacioId: 9, subespecialidadNombre: null })

    expect(screen.getByText('Sin clínica')).toBeInTheDocument()
    expect(screen.getByTestId('fila-siguiente-9')).toHaveTextContent('—')
  })
})
