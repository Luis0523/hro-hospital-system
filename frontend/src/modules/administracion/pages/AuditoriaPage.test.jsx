import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import client from '@/shared/api/client'
import AuditoriaPage from './AuditoriaPage.jsx'

describe('AuditoriaPage', () => {
  it('mantiene el encabezado "Auditoría"', () => {
    render(<AuditoriaPage />)

    expect(screen.getByRole('heading', { name: 'Auditoría' })).toBeInTheDocument()
  })

  it('informa que la consulta todavía no está disponible', () => {
    render(<AuditoriaPage />)

    expect(screen.getByRole('alert')).toHaveTextContent(/todavía no se encuentra disponible/i)
  })

  it('muestra las funcionalidades previstas', () => {
    render(<AuditoriaPage />)

    expect(screen.getByRole('heading', { name: 'Consulta de registros' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Filtro por recurso' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Filtro por usuario' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Trazabilidad de cambios' })).toBeInTheDocument()
  })

  it('identifica todas las funcionalidades como pendientes de integración', () => {
    render(<AuditoriaPage />)

    expect(screen.getAllByText('Pendiente de integración')).toHaveLength(4)
  })

  it('no presenta cifras ni datos de ejemplo', () => {
    const { container } = render(<AuditoriaPage />)

    expect(container.textContent).not.toMatch(/\d/)
  })

  it('no ofrece botones funcionales', () => {
    render(<AuditoriaPage />)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('no ofrece campos de texto', () => {
    render(<AuditoriaPage />)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('no ofrece selectores', () => {
    render(<AuditoriaPage />)

    expect(screen.queryAllByRole('combobox')).toHaveLength(0)
  })

  it('no expone detalles técnicos internos del backend', () => {
    const { container } = render(<AuditoriaPage />)

    expect(container.textContent).not.toMatch(/LazyInitializationException/)
    expect(container.textContent).not.toMatch(/Hibernate/)
    expect(container.textContent).not.toMatch(/GET \/auditoria/)
    expect(container.textContent).not.toMatch(/JPA/)
    expect(container.textContent).not.toMatch(/Spring Security/)
  })

  it('no realiza llamadas HTTP reales', () => {
    const getSpy = vi.spyOn(client, 'get')
    const postSpy = vi.spyOn(client, 'post')
    const putSpy = vi.spyOn(client, 'put')
    const deleteSpy = vi.spyOn(client, 'delete')

    render(<AuditoriaPage />)

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
