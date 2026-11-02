import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'

// Se conservan las funciones reales del módulo (mock de Vitest para los datos),
// pero se fuerza la bandera de backend real para comprobar que el aviso no
// aparece cuando no corresponde.
vi.mock('../api/depuracionArchivoApi', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, USANDO_DATOS_MOCK: false }
})

import DepuracionExpedientesPage from './DepuracionExpedientesPage.jsx'

function renderPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AuthProvider>
          <DepuracionExpedientesPage />
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('DepuracionExpedientesPage · modo backend real', () => {
  it('no muestra el aviso de simulación', async () => {
    renderPage()

    expect(await screen.findByText(/aún no hay expedientes depurados hoy/i)).toBeInTheDocument()
    expect(screen.queryByText(/modo simulación/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/no se guardan en el servidor/i)).not.toBeInTheDocument()
  })
})
