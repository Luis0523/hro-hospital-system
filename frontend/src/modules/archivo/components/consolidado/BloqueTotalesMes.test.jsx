import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import BloqueTotalesMes from './BloqueTotalesMes.jsx'

const TOTALES = {
  totalCarnets: 210,
  totalDepurados: 9,
  porEspecialidad: [{ especialidadId: 1, especialidadNombre: 'Medicina Interna', total: 120 }],
}

describe('BloqueTotalesMes', () => {
  it('muestra los acumulados del mes', () => {
    render(<BloqueTotalesMes totales={TOTALES} informe={[{ dia: '2026-10-01', hdc: 10, hd: 2 }]} />)

    expect(screen.getByText('210')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
    // Trabajo contabilizado con lo capturado: HDC 10 + HD 2 = 12.
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('marca como pendiente de captura los campos no capturados', () => {
    render(<BloqueTotalesMes totales={TOTALES} informe={[]} />)

    expect(screen.getAllByText(/pendiente de captura/i).length).toBeGreaterThanOrEqual(3)
  })

  it('lista el acumulado por especialidad', () => {
    render(<BloqueTotalesMes totales={TOTALES} informe={[]} />)

    expect(
      screen.getByRole('img', { name: /Medicina Interna: 120 expedientes/ }),
    ).toBeInTheDocument()
  })
})
