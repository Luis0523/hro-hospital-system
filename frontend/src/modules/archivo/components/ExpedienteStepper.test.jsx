import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ExpedienteStepper from './ExpedienteStepper.jsx'

describe('ExpedienteStepper', () => {
  it('muestra los pasos de la secuencia normal', () => {
    render(<ExpedienteStepper estado="localizado" />)

    expect(screen.getByLabelText('Trazabilidad del expediente')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de localizar')).toBeInTheDocument()
    expect(screen.getByText('Localizado en archivo')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('resalta "no localizado" como excepción fuera de la secuencia', () => {
    render(<ExpedienteStepper estado="no_localizado" />)

    expect(screen.getByRole('alert')).toHaveTextContent('No localizado')
    expect(screen.queryByLabelText('Trazabilidad del expediente')).not.toBeInTheDocument()
  })
})
