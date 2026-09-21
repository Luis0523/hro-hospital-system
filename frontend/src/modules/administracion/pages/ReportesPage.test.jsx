import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import client from '@/shared/api/client'
import ReportesPage from './ReportesPage.jsx'

describe('ReportesPage', () => {
  it('mantiene el encabezado "Reportes"', () => {
    render(<ReportesPage />)

    expect(screen.getByRole('heading', { name: 'Reportes' })).toBeInTheDocument()
  })

  it('informa que los reportes todavía no están disponibles', () => {
    render(<ReportesPage />)

    expect(screen.getByRole('alert')).toHaveTextContent(/todavía no se encuentra disponible/i)
  })

  it('muestra los reportes previstos', () => {
    render(<ReportesPage />)

    expect(screen.getByRole('heading', { name: 'Citas por estado' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Inasistencias' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Demanda' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Utilización de cupos' })).toBeInTheDocument()
  })

  it('identifica todos los reportes como pendientes de integración', () => {
    render(<ReportesPage />)

    expect(screen.getAllByText('Pendiente de integración')).toHaveLength(4)
  })

  it('no presenta cifras ni datos de ejemplo', () => {
    const { container } = render(<ReportesPage />)

    expect(container.textContent).not.toMatch(/\d/)
  })

  it('no ofrece acciones de exportación', () => {
    render(<ReportesPage />)

    expect(screen.queryByRole('button', { name: /exportar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pdf/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /excel/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /csv/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /descargar/i })).not.toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('no ofrece filtros funcionales', () => {
    render(<ReportesPage />)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/fecha/i)).not.toBeInTheDocument()
    expect(screen.queryAllByRole('combobox')).toHaveLength(0)
  })

  it('no realiza llamadas HTTP reales', () => {
    const getSpy = vi.spyOn(client, 'get')
    const postSpy = vi.spyOn(client, 'post')
    const putSpy = vi.spyOn(client, 'put')
    const deleteSpy = vi.spyOn(client, 'delete')

    render(<ReportesPage />)

    expect(getSpy).not.toHaveBeenCalled()
    expect(postSpy).not.toHaveBeenCalled()
    expect(putSpy).not.toHaveBeenCalled()
    expect(deleteSpy).not.toHaveBeenCalled()

    getSpy.mockRestore()
    postSpy.mockRestore()
    putSpy.mockRestore()
    deleteSpy.mockRestore()
  })
})
