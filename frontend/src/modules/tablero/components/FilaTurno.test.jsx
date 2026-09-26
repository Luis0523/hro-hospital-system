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
  it('muestra subespecialidad, consultorio y turno actual', () => {
    renderFila(ASIGNACION)

    expect(screen.getByText('Pediatría General')).toBeInTheDocument()
    expect(screen.getByText('201')).toBeInTheDocument()
    expect(screen.getByText('#007')).toBeInTheDocument()
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

    expect(screen.getByText('Sin subespecialidad')).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(2)
    expect(screen.queryByText(/Nivel/)).not.toBeInTheDocument()
  })
})
