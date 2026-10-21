import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { AccesoProvider } from '@/shared/context/AccesoContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import AppRouter from '@/router/AppRouter.jsx'

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

describe('AppRouter · /seguimiento-enfermeria', () => {
  it('navegar directamente a /seguimiento-enfermeria muestra la página', async () => {
    renderRuta('/seguimiento-enfermeria')

    expect(
      await screen.findByRole(
        'heading',
        { name: 'Control de turnos y expedientes' },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument()
    expect(await screen.findByTestId('detalle-turno')).toBeInTheDocument()
  })

  it('sin sesión no muestra la página y redirige a la pantalla de sesión cerrada', async () => {
    localStorage.setItem('hro_sesion', 'cerrada')
    renderRuta('/seguimiento-enfermeria')

    expect(await screen.findByText('Sesión cerrada')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Control de turnos y expedientes' }),
    ).not.toBeInTheDocument()
  })
})
