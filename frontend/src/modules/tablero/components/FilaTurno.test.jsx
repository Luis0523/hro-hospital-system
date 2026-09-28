import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import FilaTurno from './FilaTurno.jsx'

const ASIGNACION = {
  asignacionDiariaEspacioId: 1,
  espacioNumero: '201',
  nivel: 2,
  subespecialidadNombre: 'Pediatría General',
  turnoActual: 7,
  turnoSiguiente: 8,
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

function celdas() {
  return within(screen.getByTestId(`fila-turno-${ASIGNACION.asignacionDiariaEspacioId}`)).getAllByRole(
    'cell',
  )
}

describe('FilaTurno', () => {
  it('muestra turno actual y consultorio en ese orden', () => {
    renderFila(ASIGNACION)

    const [turno, consultorio] = celdas()

    expect(turno).toHaveTextContent('#007')
    expect(consultorio).toHaveTextContent('201')
  })

  it('no muestra la subespecialidad aunque venga en el objeto', () => {
    renderFila(ASIGNACION)

    expect(screen.queryByText('Pediatría General')).not.toBeInTheDocument()
    expect(celdas()).toHaveLength(2)
  })

  it('no muestra el nivel aunque venga en el objeto', () => {
    renderFila(ASIGNACION)

    expect(screen.queryByText(/Nivel/)).not.toBeInTheDocument()
    expect(screen.queryByText('Nivel 2')).not.toBeInTheDocument()
  })

  it('no muestra el siguiente turno en la vista normal', () => {
    renderFila(ASIGNACION)

    expect(screen.queryByText('Siguiente turno')).not.toBeInTheDocument()
    expect(screen.queryByText('#008')).not.toBeInTheDocument()
  })

  it('no renderiza datos personales aunque el objeto los incluya', () => {
    renderFila({
      ...ASIGNACION,
      nombrePaciente: 'Juan Perez',
      dpi: '1234567890101',
      expediente: 'HRO-123',
      telefono: '55555555',
      direccion: 'Zona 1',
      correo: 'juan@example.com',
    })

    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument()
    expect(screen.queryByText('1234567890101')).not.toBeInTheDocument()
    expect(screen.queryByText('HRO-123')).not.toBeInTheDocument()
    expect(screen.queryByText('55555555')).not.toBeInTheDocument()
    expect(screen.queryByText('Zona 1')).not.toBeInTheDocument()
    expect(screen.queryByText('juan@example.com')).not.toBeInTheDocument()
  })

  it('maneja valores nulos o faltantes de forma segura', () => {
    renderFila({
      asignacionDiariaEspacioId: 9,
      espacioNumero: null,
      nivel: 2,
      subespecialidadNombre: null,
      turnoActual: null,
    })

    const [turno, consultorio] = within(screen.getByTestId('fila-turno-9')).getAllByRole('cell')

    expect(turno).toHaveTextContent('—')
    expect(consultorio).toHaveTextContent('—')
    expect(screen.queryByText(/Nivel/)).not.toBeInTheDocument()
  })
})
