import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import LibroCitasLayout from './LibroCitasLayout.jsx'

function renderLayout() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LibroCitasLayout>
          <section>
            <p>contenido hijo</p>
          </section>
        </LibroCitasLayout>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LibroCitasLayout', () => {
  it('renderiza el encabezado institucional', () => {
    renderLayout()

    expect(screen.getByText('Sistema Hospitalario HRO')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Libro de Citas' })).toBeInTheDocument()
  })

  it('renderiza la navegación', () => {
    renderLayout()

    expect(
      screen.getByRole('navigation', { name: 'Navegación de Libro de Citas' }),
    ).toBeInTheDocument()
  })

  it('renderiza los children', () => {
    renderLayout()

    expect(screen.getByText('contenido hijo')).toBeInTheDocument()
  })
})
