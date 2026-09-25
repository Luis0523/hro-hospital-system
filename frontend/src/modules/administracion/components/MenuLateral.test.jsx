import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MenuLateral, { ITEMS_ADMINISTRACION } from './MenuLateral.jsx'

function renderMenu(initialEntries = ['/administracion'], props = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <MenuLateral {...props} />
    </MemoryRouter>,
  )
}

describe('MenuLateral', () => {
  it('contiene las siete opciones con sus URLs', () => {
    renderMenu()

    expect(ITEMS_ADMINISTRACION).toHaveLength(7)

    for (const item of ITEMS_ADMINISTRACION) {
      expect(screen.getByRole('link', { name: item.etiqueta })).toHaveAttribute('href', item.to)
    }
  })

  it('no enlaza a estaciones de otros módulos', () => {
    renderMenu()

    expect(screen.queryByRole('link', { name: /enfermería/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /archivo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /tablero de turnos/i })).not.toBeInTheDocument()
  })

  it('identifica la ruta activa', () => {
    renderMenu(['/administracion/usuarios'])

    expect(screen.getByRole('link', { name: 'Usuarios y roles' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current')
  })

  it('notifica la navegación para cerrar el menú móvil', async () => {
    const onNavegar = vi.fn()
    renderMenu(['/administracion'], { onNavegar })

    await userEvent.click(screen.getByRole('link', { name: 'Reportes' }))

    expect(onNavegar).toHaveBeenCalledTimes(1)
  })
})
