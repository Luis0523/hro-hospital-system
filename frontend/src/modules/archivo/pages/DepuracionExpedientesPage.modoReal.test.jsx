import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    expect(screen.queryByText(/última depuración/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /deshacer/i })).not.toBeInTheDocument()
  })

  it('pide confirmación antes de un rango extenso en modo real', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText(/aún no hay expedientes depurados hoy/i)

    await user.click(screen.getByRole('button', { name: 'Rango personalizado' }))
    fireEvent.change(screen.getByLabelText('Fecha inicial'), {
      target: { value: '01012026' },
    })
    fireEvent.change(screen.getByLabelText('Fecha final'), {
      target: { value: '31032026' },
    })
    await user.click(screen.getByRole('button', { name: /aplicar rango/i }))

    expect(
      await screen.findByRole('heading', { name: 'Confirmar consulta extensa' }),
    ).toBeInTheDocument()
    expect(screen.getByText('90')).toBeInTheDocument()
    expect(screen.getByText(/90 consultas diarias/i)).toBeInTheDocument()
  })
})
