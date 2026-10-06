import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  it('renderiza el encabezado institucional con los controles', () => {
    renderLayout()

    expect(screen.getByText('Sistema Hospitalario HRO')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Libro de Citas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /modo (oscuro|claro)/i })).toBeInTheDocument()
  })

  it('no renderiza el navbar secundario', () => {
    renderLayout()

    expect(
      screen.queryByRole('navigation', { name: 'Navegación de Libro de Citas' }),
    ).not.toBeInTheDocument()
  })

  it('renderiza los children', () => {
    renderLayout()

    expect(screen.getByText('contenido hijo')).toBeInTheDocument()
  })
})
