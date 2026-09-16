import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AgendaPanel from './AgendaPanel.jsx'

const CUPOS = [
  {
    id: 1,
    clinicaNombre: 'Clínica 01 - Medicina General',
    medicoNombre: 'Dr. Jorge Castillo',
    horaInicio: '07:00:00',
    horaFin: '12:00:00',
    cuposDisponibles: 5,
    disponible: true,
  },
  {
    id: 2,
    clinicaNombre: 'Clínica 04 - Cardiología',
    medicoNombre: 'Dr. Manuel Ortiz',
    horaInicio: '07:00:00',
    horaFin: '11:00:00',
    cuposDisponibles: 0,
    disponible: false,
  },
]

describe('AgendaPanel', () => {
  it('no renderiza nada si está cerrado', () => {
    const { container } = render(<AgendaPanel abierto={false} fecha="2026-09-20" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra los cupos del día y deshabilita los que no tienen cupo', () => {
    render(<AgendaPanel abierto fecha="2026-09-20" cupos={CUPOS} onCerrar={() => {}} />)

    expect(screen.getByText('Clínica 01 - Medicina General')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cardiología/ })).toBeDisabled()
  })

  it('deshabilita "Agendar cita" sin paciente ni cupo seleccionado', () => {
    render(<AgendaPanel abierto fecha="2026-09-20" cupos={CUPOS} onCerrar={() => {}} />)

    expect(screen.getByRole('button', { name: /agendar cita/i })).toBeDisabled()
  })
})
