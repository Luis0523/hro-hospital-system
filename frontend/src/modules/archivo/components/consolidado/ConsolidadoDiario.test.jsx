import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConsolidadoDiario from './ConsolidadoDiario.jsx'

const CONSOLIDADO = {
  fecha: '2026-10-07',
  total: 10,
  totalDepurados: 2,
  porEspecialidad: [
    { especialidadId: 1, especialidadNombre: 'Medicina General', total: 8 },
    { especialidadId: 2, especialidadNombre: 'Pediatría', total: 2 },
  ],
}

describe('ConsolidadoDiario', () => {
  it('muestra el total del día y los depurados', () => {
    render(<ConsolidadoDiario consolidado={CONSOLIDADO} />)

    expect(screen.getByText('Total del día')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('Depurados del día')).toBeInTheDocument()
  })

  it('renderiza una barra accesible por especialidad', () => {
    render(<ConsolidadoDiario consolidado={CONSOLIDADO} />)

    expect(screen.getByRole('img', { name: /Medicina General: 8 expedientes/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Pediatría: 2 expedientes/ })).toBeInTheDocument()
  })

  it('muestra estado vacío sin especialidades', () => {
    render(
      <ConsolidadoDiario
        consolidado={{ fecha: '2026-10-07', total: 0, totalDepurados: 0, porEspecialidad: [] }}
      />,
    )

    expect(screen.getByText(/sin movimientos/i)).toBeInTheDocument()
  })

  it('no renderiza nada sin datos', () => {
    const { container } = render(<ConsolidadoDiario consolidado={null} />)

    expect(container).toBeEmptyDOMElement()
  })
})
