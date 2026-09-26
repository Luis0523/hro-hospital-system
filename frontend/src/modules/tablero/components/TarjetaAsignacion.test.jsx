import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import TarjetaAsignacion from './TarjetaAsignacion.jsx'

const ASIGNACION = {
  asignacionDiariaEspacioId: 1,
  espacioNumero: '201',
  nivel: 2,
  subespecialidadNombre: 'Pediatría General',
  turnoActual: 7,
  turnoSiguiente: 8,
  ultimaActualizacion: '2026-09-20T08:05:32-06:00',
}

describe('TarjetaAsignacion', () => {
  it('muestra subespecialidad, consultorio, nivel y ambos turnos', () => {
    render(<TarjetaAsignacion asignacion={ASIGNACION} />)

    expect(screen.getByText('Pediatría General')).toBeInTheDocument()
    expect(screen.getByText(/Consultorio 201/)).toBeInTheDocument()
    expect(screen.getByText(/Nivel 2/)).toBeInTheDocument()
    expect(screen.getByText('#007')).toBeInTheDocument()
    expect(screen.getByText('#008')).toBeInTheDocument()
  })

  it('no renderiza datos personales aunque el objeto los incluya', () => {
    render(
      <TarjetaAsignacion
        asignacion={{
          ...ASIGNACION,
          nombrePaciente: 'Juan Perez',
          dpi: '1234567890101',
          expediente: 'HRO-123',
          telefono: '55555555',
        }}
      />,
    )

    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument()
    expect(screen.queryByText('1234567890101')).not.toBeInTheDocument()
    expect(screen.queryByText('HRO-123')).not.toBeInTheDocument()
    expect(screen.queryByText('55555555')).not.toBeInTheDocument()
  })
})
