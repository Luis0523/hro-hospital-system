import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import AdministracionLayout from './AdministracionLayout.jsx'

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/administracion']}>
      <AuthProvider>
        <Routes>
          <Route path="/administracion" element={<AdministracionLayout />}>
            <Route index element={<p>Contenido hijo de prueba</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('AdministracionLayout', () => {
  it('renderiza el nombre del panel y la información disponible del usuario', () => {
    renderLayout()

    expect(screen.getByRole('heading', { name: 'Panel de Administración' })).toBeInTheDocument()
    expect(screen.getByText('Lic. Carmen Vega')).toBeInTheDocument()
    expect(screen.getByText('enfermeria')).toBeInTheDocument()
  })

  it('renderiza el contenido hijo mediante Outlet', () => {
    renderLayout()

    expect(screen.getByText('Contenido hijo de prueba')).toBeInTheDocument()
  })

  it('abre el menú móvil desde el botón hamburguesa', async () => {
    renderLayout()

    const boton = screen.getByRole('button', { name: 'Abrir menú de navegación' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(boton)

    expect(
      screen.getByRole('button', { name: 'Abrir menú de navegación', hidden: true }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toBeInTheDocument()
  })

  it('cierra el menú móvil con la tecla Escape', async () => {
    renderLayout()

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }))
    await userEvent.keyboard('{Escape}')

    expect(
      screen.getByRole('button', { name: 'Abrir menú de navegación', hidden: true }),
    ).toHaveAttribute('aria-expanded', 'false')
  })

  it('cierra el menú móvil con el botón Cerrar menú', async () => {
    renderLayout()

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }))

    expect(
      screen.getByRole('button', { name: 'Abrir menú de navegación', hidden: true }),
    ).toHaveAttribute('aria-expanded', 'false')
  })
})
