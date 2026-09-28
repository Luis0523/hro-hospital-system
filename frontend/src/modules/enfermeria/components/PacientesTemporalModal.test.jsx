import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PacientesTemporalModal from './PacientesTemporalModal.jsx'

describe('PacientesTemporalModal', () => {
  it('muestra los registros de pacientes cargados', async () => {
    const onCargarPacientes = vi.fn().mockResolvedValue([
      {
        id: 1,
        nombres: 'María Fernanda',
        apellidos: 'López García',
        dpi: '2456789010101',
        numeroExpediente: 'EXP-004521',
      },
    ])

    render(
      <PacientesTemporalModal
        abierto
        onCerrar={() => {}}
        onCargarPacientes={onCargarPacientes}
        onSeleccionarPaciente={() => {}}
      />,
    )

    expect(await screen.findByText('María Fernanda López García')).toBeInTheDocument()
    expect(screen.getByText(/EXP-004521/)).toBeInTheDocument()
  })
})
