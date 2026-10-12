import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import TablaDetalleConsulta from './TablaDetalleConsulta.jsx'

const DETALLE = [
  {
    dia: '2026-10-01',
    total: 5,
    porEspecialidad: [
      { especialidadId: 1, especialidadNombre: 'Medicina Interna', total: 3 },
      { especialidadId: 2, especialidadNombre: 'Pediatría', total: 2 },
    ],
  },
]

describe('TablaDetalleConsulta', () => {
  it('renderiza columnas dinámicas por especialidad y el TOTAL del día', () => {
    render(<TablaDetalleConsulta detalle={DETALLE} />)

    expect(screen.getByRole('columnheader', { name: 'Medicina Interna' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Pediatría' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'TOTAL' })).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('muestra solo el encabezado sin filas si no hay detalle', () => {
    render(<TablaDetalleConsulta detalle={[]} />)

    expect(screen.getByRole('columnheader', { name: 'DÍA' })).toBeInTheDocument()
    expect(screen.queryByText('2026-10-01')).not.toBeInTheDocument()
  })
})
