import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import AppRouter from '@/router/AppRouter.jsx'

// Replica la composición real de providers de App.jsx (incluido
// EstacionProvider) para no repetir el problema corregido en 5F.0.1.
function renderRuta(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ThemeProvider>
        <AuthProvider>
          <EstacionProvider>
            <ToastProvider>
              <AppRouter />
            </ToastProvider>
          </EstacionProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('AppRouter · /libro-citas', () => {
  it('navegar directamente a /libro-citas muestra la página', () => {
    renderRuta('/libro-citas')

    expect(screen.getByText('Registro digital de citas')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navegación de Libro de Citas' })).toBeInTheDocument()
  })
})
