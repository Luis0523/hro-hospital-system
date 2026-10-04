import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import LibroCitasPage from './LibroCitasPage.jsx'

function renderPagina() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <LibroCitasPage />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('LibroCitasPage', () => {
  it('renderiza el título de la vista', () => {
    renderPagina()

    expect(screen.getAllByRole('heading', { name: 'Libro de Citas' }).length).toBeGreaterThan(0)
  })

  it('muestra el texto breve de la vista', () => {
    renderPagina()

    expect(screen.getByText('Registro digital de citas')).toBeInTheDocument()
  })

  it('incluye el formulario de captura (5F.2) con el botón deshabilitado al inicio', () => {
    renderPagina()

    expect(screen.getByLabelText('Fecha de la cita')).toBeInTheDocument()
    expect(screen.getByLabelText(/Número de expediente/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /agregar a la lista/i })).toBeDisabled()
  })
})
