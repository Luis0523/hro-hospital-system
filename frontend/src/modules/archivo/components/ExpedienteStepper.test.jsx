import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ExpedienteStepper from './ExpedienteStepper.jsx'

describe('ExpedienteStepper', () => {
  it('muestra la secuencia normal y marca el estado actual', () => {
    render(<ExpedienteStepper estado="localizado" />)

    expect(screen.getByLabelText('Trazabilidad del expediente')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de localizar')).toBeInTheDocument()
    expect(screen.getByText('Localizado')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
    expect(screen.getByText('Archivado')).toBeInTheDocument()
    expect(screen.getByText('Localizado').closest('li')).toHaveAttribute('aria-current', 'step')
  })

  it('resalta "no localizado" como excepción fuera de la secuencia', () => {
    render(<ExpedienteStepper estado="no_localizado" />)

    expect(screen.getByRole('alert')).toHaveTextContent('No localizado')
    expect(screen.queryByLabelText('Trazabilidad del expediente')).not.toBeInTheDocument()
  })

  it('representa "sin_ciclo" antes del inicio (tracking no iniciado)', () => {
    render(<ExpedienteStepper estado="sin_ciclo" />)

    expect(screen.getByText(/sin ciclo/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Trazabilidad del expediente')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
