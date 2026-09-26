import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FichaPaciente from './FichaPaciente.jsx'

const PACIENTE = {
  nombres: 'María Fernanda',
  apellidos: 'López García',
  dpi: '2456789010101',
  numeroExpediente: 'EXP-004521',
  fechaNacimiento: '1989-04-12',
  sexo: 'F',
  telefono: '5555-1234',
  direccion: 'Zona 3, Quetzaltenango',
}

describe('FichaPaciente', () => {
  it('muestra el expediente y los datos del paciente', () => {
    render(<FichaPaciente paciente={PACIENTE} />)

    expect(screen.getByText('María Fernanda López García')).toBeInTheDocument()
    expect(screen.getByText(/EXP-004521/)).toBeInTheDocument()
    expect(screen.getByText('2456789010101')).toBeInTheDocument()
  })

  it('muestra la cita del día cuando existe', () => {
    render(
      <FichaPaciente
        paciente={PACIENTE}
        cita={{
          clinicaNombre: 'Clínica 101 - Medicina General',
          medicoNombre: 'Dr. Jorge Castillo',
          fechaCita: '2026-09-23',
          horaEstimada: '10:20:00',
        }}
      />,
    )

    expect(screen.getByText('Cita del día')).toBeInTheDocument()
    expect(screen.getByText(/Clínica 101/)).toBeInTheDocument()
    expect(screen.getByText(/10:20/)).toBeInTheDocument()
  })
})
