import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'

const { cerrarSesionMock } = vi.hoisted(() => ({ cerrarSesionMock: vi.fn() }))

vi.mock('@/shared/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    cerrarSesion: cerrarSesionMock,
    rutaLogin: '/sesion-cerrada',
    usuario: null,
  }),
  AuthProvider: ({ children }) => children,
}))

import LibroCitasHeader from './LibroCitasHeader.jsx'

function renderHeader() {
  return render(
    <MemoryRouter initialEntries={['/libro-citas']}>
      <ThemeProvider>
        <Routes>
          <Route path="/libro-citas" element={<LibroCitasHeader />} />
          <Route path="/sesion-cerrada" element={<p>Sesión cerrada</p>} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  cerrarSesionMock.mockClear()
  try {
    globalThis.localStorage?.clear()
  } catch {
    // localStorage no disponible: se ignora.
  }
  document.documentElement.classList.remove('dark')
})

describe('LibroCitasHeader', () => {
  it('muestra el branding institucional', () => {
    renderHeader()

    expect(screen.getByText('Sistema Hospitalario HRO')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Libro de Citas' })).toBeInTheDocument()
  })

  it('empieza en tema claro y ofrece "Modo oscuro"', () => {
    renderHeader()

    const botonTema = screen.getByRole('button', { name: 'Modo oscuro' })
    expect(botonTema).toHaveAttribute('aria-pressed', 'false')
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('alterna a modo oscuro y de nuevo a claro', async () => {
    const user = userEvent.setup()
    renderHeader()

    await user.click(screen.getByRole('button', { name: 'Modo oscuro' }))

    expect(screen.getByRole('button', { name: 'Modo claro' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(document.documentElement).toHaveClass('dark')

    await user.click(screen.getByRole('button', { name: 'Modo claro' }))

    expect(screen.getByRole('button', { name: 'Modo oscuro' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('cerrar sesión llama a cerrarSesion y navega a /sesion-cerrada', async () => {
    const user = userEvent.setup()
    renderHeader()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(cerrarSesionMock).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Sesión cerrada')).toBeInTheDocument()
  })
})
