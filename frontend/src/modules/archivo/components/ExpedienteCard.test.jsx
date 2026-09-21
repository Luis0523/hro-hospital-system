import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExpedienteCard from './ExpedienteCard.jsx'

const EXPEDIENTE = {
  id: 1,
  pacienteNombre: 'María Fernanda López García',
  numeroExpediente: 'EXP-004521',
  expedienteNuevo: false,
  estado: 'pendiente_localizar',
  clinicaNombre: 'Clínica 01 - Medicina General',
  medicoNombre: 'Dr. Jorge Castillo',
  ubicacion: 'Estante A · Fila 3 · Caja 12',
  horaEstimada: '10:20:00',
}

describe('ExpedienteCard', () => {
  it('muestra el número y la acción de trazabilidad de un expediente existente', () => {
    render(<ExpedienteCard expediente={EXPEDIENTE} />)

    expect(screen.getByText('EXP-004521')).toBeInTheDocument()
    expect(screen.getByText('Ver trazabilidad')).toBeInTheDocument()
    expect(screen.queryByText('Expediente nuevo')).not.toBeInTheDocument()
  })

  it('marca paciente nuevo por el flag', () => {
    render(<ExpedienteCard expediente={{ ...EXPEDIENTE, expedienteNuevo: true }} />)

    expect(screen.getByText('Expediente nuevo')).toBeInTheDocument()
    expect(screen.getByText('Sin expediente físico')).toBeInTheDocument()
    expect(screen.getByText('Preparar expediente')).toBeInTheDocument()
  })

  it('aplica el mismo criterio de paciente nuevo cuando falta el número', () => {
    render(
      <ExpedienteCard
        expediente={{ ...EXPEDIENTE, expedienteNuevo: false, numeroExpediente: null }}
      />,
    )

    expect(screen.getByText('Expediente nuevo')).toBeInTheDocument()
    expect(screen.getByText('Preparar expediente')).toBeInTheDocument()
  })

  it('refleja aria-pressed y notifica la selección', async () => {
    const onSeleccionar = vi.fn()
    const user = userEvent.setup()
    render(<ExpedienteCard expediente={EXPEDIENTE} activo onSeleccionar={onSeleccionar} />)

    const boton = screen.getByRole('button')
    expect(boton).toHaveAttribute('aria-pressed', 'true')

    await user.click(boton)
    expect(onSeleccionar).toHaveBeenCalledWith(EXPEDIENTE)
  })
})
