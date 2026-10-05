import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const { cerrarSesionMock } = vi.hoisted(() => ({ cerrarSesionMock: vi.fn() }))

vi.mock('@/shared/context/AuthContext.jsx', () => ({
  useAuth: () => ({ cerrarSesion: cerrarSesionMock, usuario: null }),
  AuthProvider: ({ children }) => children,
}))

import LibroCitasNavbar from './LibroCitasNavbar.jsx'

function renderNavbar() {
  return render(
    <MemoryRouter initialEntries={['/libro-citas']}>
      <Routes>
        <Route path="/libro-citas" element={<LibroCitasNavbar />} />
        <Route path="/sesion-cerrada" element={<p>Sesión cerrada</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LibroCitasNavbar', () => {
  beforeEach(() => {
    cerrarSesionMock.mockClear()
  })

  it('muestra el enlace "Libro de Citas"', () => {
    renderNavbar()

    expect(screen.getByRole('link', { name: /libro de citas/i })).toHaveAttribute(
      'href',
      '/libro-citas',
    )
  })

  it('muestra el botón "Cerrar sesión"', () => {
    renderNavbar()

    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument()
  })

  it('no incluye enlaces de otros módulos', () => {
    renderNavbar()

    const enlaces = screen.getAllByRole('link')
    expect(enlaces).toHaveLength(1)
    expect(enlaces[0]).toHaveAccessibleName('Libro de Citas')
    expect(
      screen.queryByRole('link', {
        name: /archivo|depuraci|salidas|enfermer|administraci|tablero|jefe/i,
      }),
    ).not.toBeInTheDocument()
  })

  it('cerrar sesión llama a cerrarSesion y navega a /sesion-cerrada', async () => {
    const user = userEvent.setup()
    renderNavbar()

    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }))

    expect(cerrarSesionMock).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Sesión cerrada')).toBeInTheDocument()
  })
})
