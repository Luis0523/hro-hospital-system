import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage from './DashboardPage.jsx'

describe('DashboardPage', () => {
  it('muestra las tres tarjetas base del dashboard', () => {
    render(<DashboardPage />)

    expect(screen.getByRole('heading', { name: 'Citas del día' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cupos disponibles' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Alertas administrativas' })).toBeInTheDocument()
  })

  it('no muestra métricas numéricas inventadas', () => {
    const { container } = render(<DashboardPage />)

    expect(container.textContent).not.toMatch(/\d/)
  })
})
