import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ReportesPage from './ReportesPage.jsx'

describe('ReportesPage', () => {
  it('muestra las métricas y la demanda por especialidad', async () => {
    render(<ReportesPage />)

    expect(await screen.findByText(/citas totales/i)).toBeInTheDocument()
    expect(screen.getByText('Medicina Interna')).toBeInTheDocument()
    expect(screen.getAllByText(/utilización de cupos/i).length).toBeGreaterThan(0)
  })
})
