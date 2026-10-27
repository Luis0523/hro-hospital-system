import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AccesoProvider } from '@/shared/context/AccesoContext.jsx'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import AppRouter from '@/router/AppRouter.jsx'

// Replica la composición real de providers de App.jsx.
function renderRuta(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ThemeProvider>
        <AuthProvider>
          <AccesoProvider>
            <EstacionProvider>
              <ToastProvider>
                <AppRouter />
              </ToastProvider>
            </EstacionProvider>
          </AccesoProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('AppRouter · /archivo/cuaderno-rojo', () => {
  it('navegar directamente a /archivo/cuaderno-rojo muestra la pantalla del Cuaderno Rojo', () => {
    renderRuta('/archivo/cuaderno-rojo')

    expect(screen.getByRole('heading', { name: 'Registro del Cuaderno Rojo' })).toBeInTheDocument()
    expect(screen.getByLabelText('TIA')).toBeInTheDocument()
  })

  it('se integra con el layout de Archivo', () => {
    renderRuta('/archivo/cuaderno-rojo')

    expect(screen.getAllByText('Estación de Archivo').length).toBeGreaterThan(0)
    expect(
      screen.getByRole('navigation', { name: 'Navegación de la Estación de Archivo' }),
    ).toBeInTheDocument()
  })
})
