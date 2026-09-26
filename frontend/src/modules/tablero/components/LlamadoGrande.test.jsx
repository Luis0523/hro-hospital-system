import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import LlamadoGrande from './LlamadoGrande.jsx'

const ASIGNACION = {
  asignacionDiariaEspacioId: 1,
  espacioNumero: '201',
  nivel: 2,
  subespecialidadNombre: 'Pediatría General',
  turnoActual: 8,
  turnoSiguiente: 9,
  ultimaActualizacion: '2026-09-20T08:05:32-06:00',
}

describe('LlamadoGrande', () => {
  it('muestra la subespecialidad', () => {
    render(<LlamadoGrande asignacion={ASIGNACION} />)

    expect(screen.getByText('Pediatría General')).toBeInTheDocument()
  })

  it('muestra el turno actual en grande y formateado', () => {
    render(<LlamadoGrande asignacion={ASIGNACION} />)

    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('#008')
  })

  it('muestra el consultorio', () => {
    render(<LlamadoGrande asignacion={ASIGNACION} />)

    expect(screen.getByTestId('llamado-consultorio')).toHaveTextContent('201')
  })

  it('no muestra el nivel aunque venga en el objeto', () => {
    render(<LlamadoGrande asignacion={ASIGNACION} />)

    expect(screen.queryByText(/Nivel/)).not.toBeInTheDocument()
    expect(screen.queryByText('Nivel 2')).not.toBeInTheDocument()
  })

  it('no muestra el siguiente turno', () => {
    render(<LlamadoGrande asignacion={ASIGNACION} />)

    expect(screen.queryByText('Siguiente turno')).not.toBeInTheDocument()
    expect(screen.queryByText('#009')).not.toBeInTheDocument()
  })

  it('no renderiza datos personales aunque el objeto los incluya', () => {
    render(
      <LlamadoGrande
        asignacion={{
          ...ASIGNACION,
          nombrePaciente: 'Juan Perez',
          dpi: '1234567890101',
          expediente: 'HRO-123',
          telefono: '55555555',
          direccion: 'Zona 1',
          correo: 'juan@example.com',
        }}
      />,
    )

    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument()
    expect(screen.queryByText('1234567890101')).not.toBeInTheDocument()
    expect(screen.queryByText('HRO-123')).not.toBeInTheDocument()
    expect(screen.queryByText('55555555')).not.toBeInTheDocument()
    expect(screen.queryByText('Zona 1')).not.toBeInTheDocument()
    expect(screen.queryByText('juan@example.com')).not.toBeInTheDocument()
  })

  it('maneja valores faltantes de forma segura', () => {
    render(<LlamadoGrande asignacion={{ asignacionDiariaEspacioId: 9, nivel: 2 }} />)

    expect(screen.getByText('Sin subespecialidad')).toBeInTheDocument()
    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('—')
    expect(screen.getByTestId('llamado-consultorio')).toHaveTextContent('—')
    expect(screen.queryByText(/Nivel/)).not.toBeInTheDocument()
  })

  it('no falla si la asignación no existe', () => {
    render(<LlamadoGrande asignacion={null} />)

    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('—')
  })
})
