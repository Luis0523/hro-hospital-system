import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import TurnoGigante from './TurnoGigante.jsx'

describe('TurnoGigante', () => {
  it('muestra el turno actual con relleno de tres dígitos', () => {
    render(<TurnoGigante etiqueta="Turno actual" valor={7} variante="actual" />)

    expect(screen.getByText('Turno actual')).toBeInTheDocument()
    expect(screen.getByText('#007')).toBeInTheDocument()
  })

  it('muestra el siguiente turno', () => {
    render(<TurnoGigante etiqueta="Siguiente turno" valor={8} />)

    expect(screen.getByText('Siguiente turno')).toBeInTheDocument()
    expect(screen.getByText('#008')).toBeInTheDocument()
  })

  it('muestra un guion cuando no hay turno', () => {
    const { rerender } = render(
      <TurnoGigante etiqueta="Turno actual" valor={0} variante="actual" />,
    )
    expect(screen.getByText('—')).toBeInTheDocument()

    rerender(<TurnoGigante etiqueta="Turno actual" valor={null} variante="actual" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
