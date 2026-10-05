import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

  it('muestra la sección "Contadores diarios" con los 8 indicadores', () => {
    renderPagina()

    expect(screen.getByText('Contadores diarios')).toBeInTheDocument()
    expect(screen.getAllByRole('spinbutton')).toHaveLength(8)
    expect(screen.getByRole('spinbutton', { name: 'Historias Archivadas' })).toBeInTheDocument()
    expect(
      screen.getByRole('spinbutton', { name: 'Tarjetas Índices Archivadas' }),
    ).toBeInTheDocument()
  })

  it('el Total inicia en 0 y se actualiza al cambiar contadores', () => {
    renderPagina()

    expect(screen.getByTestId('total-contadores')).toHaveTextContent('0')

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Historias Archivadas' }), {
      target: { value: '5' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Sobres' }), {
      target: { value: '2' },
    })

    expect(screen.getByTestId('total-contadores')).toHaveTextContent('7')
  })

  it('no incluye todavía tabla, resumen por especialidad ni guardado', () => {
    renderPagina()

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText(/resumen por especialidad/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument()
  })
})
