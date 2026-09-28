import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import LlamadoGrande from './LlamadoGrande.jsx'

const ASIGNACION = {
  asignacionDiariaEspacioId: 1,
  espacioNumero: '103',
  nivel: 2,
  subespecialidadNombre: 'Pediatría General',
  turnoActual: 14,
  turnoSiguiente: 15,
  ultimaActualizacion: '2026-09-20T08:05:32-06:00',
}

describe('LlamadoGrande', () => {
  it('expone aria-label de llamado de turno', () => {
    render(<LlamadoGrande asignacion={ASIGNACION} />)

    expect(screen.getByLabelText('Llamado de turno')).toBeInTheDocument()
  })

  it('muestra el turno actual en grande y formateado como #NNN', () => {
    render(<LlamadoGrande asignacion={ASIGNACION} />)

    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('#014')
  })

  it('muestra el consultorio', () => {
    render(<LlamadoGrande asignacion={ASIGNACION} />)

    expect(screen.getByTestId('llamado-consultorio')).toHaveTextContent('103')
  })

  it('no muestra la subespecialidad', () => {
    render(<LlamadoGrande asignacion={ASIGNACION} />)

    expect(screen.queryByText('Pediatría General')).not.toBeInTheDocument()
    expect(screen.queryByText(/Pediatría/)).not.toBeInTheDocument()
  })

  it('no muestra "Sin subespecialidad" con valores faltantes', () => {
    render(<LlamadoGrande asignacion={{ asignacionDiariaEspacioId: 9, nivel: 2 }} />)

    expect(screen.queryByText('Sin subespecialidad')).not.toBeInTheDocument()
    expect(screen.queryByText(/subespecialidad/i)).not.toBeInTheDocument()
  })

  it('no muestra clínica ni nivel aunque vengan en el objeto', () => {
    render(
      <LlamadoGrande
        asignacion={{ ...ASIGNACION, clinicaNombre: 'Consulta Externa', nivel: 2 }}
      />,
    )

    expect(screen.queryByText('Consulta Externa')).not.toBeInTheDocument()
    expect(screen.queryByText(/Nivel/)).not.toBeInTheDocument()
  })

  it('no muestra el siguiente turno', () => {
    render(<LlamadoGrande asignacion={ASIGNACION} />)

    expect(screen.queryByText('Siguiente turno')).not.toBeInTheDocument()
    expect(screen.queryByText('#015')).not.toBeInTheDocument()
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

    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('—')
    expect(screen.getByTestId('llamado-consultorio')).toHaveTextContent('—')
  })

  it('no falla si la asignación no existe', () => {
    render(<LlamadoGrande asignacion={null} />)

    expect(screen.getByTestId('llamado-grande')).toBeInTheDocument()
    expect(screen.getByTestId('llamado-turno')).toHaveTextContent('—')
  })
})
