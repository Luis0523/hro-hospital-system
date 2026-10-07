import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import ArchivoNavbar from './ArchivoNavbar.jsx'

function renderNavbar({ usuario } = {}) {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AuthProvider>
          <ArchivoNavbar abierto usuario={usuario} onNavegar={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('ArchivoNavbar — control claro/oscuro', () => {
  it('alterna el tema reutilizando ThemeContext (clase dark y persistencia)', async () => {
    const user = userEvent.setup()
    renderNavbar()

    await user.click(screen.getByRole('button', { name: /modo oscuro/i }))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('hro_tema')).toBe('oscuro')

    await user.click(screen.getByRole('button', { name: /modo claro/i }))

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('hro_tema')).toBe('claro')
  })
})

describe('ArchivoNavbar — usuario y cierre de sesión', () => {
  it('muestra el usuario recibido y el botón de cerrar sesión', () => {
    renderNavbar({ usuario: { nombre: 'Ana Archivo', puesto: 'Archivo / Registro Médico' } })

    expect(screen.getByText('Ana Archivo')).toBeInTheDocument()
    expect(screen.getByText('Archivo / Registro Médico')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
  })

  it('muestra el usuario por defecto si no se recibe identidad', () => {
    renderNavbar()

    expect(screen.getByText('Personal de Archivo')).toBeInTheDocument()
  })
})
