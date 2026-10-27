import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ClinicasSeguimiento from './ClinicasSeguimiento.jsx'

describe('ClinicasSeguimiento', () => {
  it('muestra las especialidades fijas asignadas a cada clínica', () => {
    render(
      <ClinicasSeguimiento
        clinicas={[
          {
            id: 'c-1',
            nombre: 'Clínica 9',
            expedientesEnClinica: 0,
            especialidadesFijas: [
              { id: 10, nombre: 'Ginecología' },
              { id: 11, nombre: 'Alto Riesgo' },
            ],
          },
          {
            id: 'c-2',
            nombre: 'Clínica 6',
            expedientesEnClinica: 0,
            especialidadesFijas: [],
          },
        ]}
        onElegir={() => {}}
      />,
    )

    expect(screen.getByText('Ginecología · Alto Riesgo')).toBeInTheDocument()
    expect(screen.queryByText('Ginecología · Alto Riesgo')).not.toBeNull()
  })

  it('no muestra especialidad cuando la clínica no es fija', () => {
    render(
      <ClinicasSeguimiento
        clinicas={[
          {
            id: 'c-2',
            nombre: 'Clínica 6',
            expedientesEnClinica: 0,
            especialidadesFijas: [],
          },
        ]}
        onElegir={() => {}}
      />,
    )

    expect(screen.getByText('Clínica 6')).toBeInTheDocument()
    expect(screen.queryByTitle(/ginecología/i)).not.toBeInTheDocument()
  })
})
