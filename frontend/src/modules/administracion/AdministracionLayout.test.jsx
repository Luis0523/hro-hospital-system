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

  it('el botón móvil alterna el estado del menú', async () => {
    renderLayout()

    const boton = screen.getByRole('button', { name: 'Abrir menú de navegación' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(boton)
    expect(boton).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(boton)
    expect(boton).toHaveAttribute('aria-expanded', 'false')
  })
})
