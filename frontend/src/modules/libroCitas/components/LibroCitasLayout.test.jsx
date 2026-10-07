import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import LibroCitasLayout from './LibroCitasLayout.jsx'

function renderLayout() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <LibroCitasLayout>
            <section>
              <p>contenido hijo</p>
            </section>
          </LibroCitasLayout>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('LibroCitasLayout', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('muestra la marca SIGHO, el título y los controles en la barra', () => {
    renderLayout()

    expect(screen.getAllByText('SIGHO').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Libro de Citas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /modo (oscuro|claro)/i })).toBeInTheDocument()
  })

  it('incluye la navegación lateral con la sección del libro', () => {
    renderLayout()

    const nav = screen.getByRole('navigation', { name: 'Navegación de Libro de Citas' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /libro de citas/i })).toHaveAttribute(
      'href',
      '/libro-citas',
    )
  })

  it('alterna el tema desde la barra lateral', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: /modo oscuro/i }))

    expect(document.documentElement).toHaveClass('dark')
    expect(screen.getByRole('button', { name: /modo claro/i })).toBeInTheDocument()
  })

  it('renderiza los children', () => {
    renderLayout()

    expect(screen.getByText('contenido hijo')).toBeInTheDocument()
  })
})
