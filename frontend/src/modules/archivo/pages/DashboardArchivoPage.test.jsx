import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import DashboardArchivoPage from './DashboardArchivoPage.jsx'

function renderPage() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <DashboardArchivoPage />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>,
  )
}

describe('DashboardArchivoPage', () => {
  it('muestra el título administrativo y el resumen de salidas', async () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: /dashboard administrativo de archivo/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Salidas del día')).toBeInTheDocument()
    expect(screen.getAllByText('Clínica de la Mujer').length).toBeGreaterThan(0)
    expect(screen.getByText('Archivo activo')).toBeInTheDocument()
    expect(screen.getByText('Archivo pasivo')).toBeInTheDocument()
  })

  it('muestra las salidas por estación, estados y Cuaderno Rojo', async () => {
    renderPage()

    expect(await screen.findByRole('region', { name: /salidas por estación/i })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /estado actual/i })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /cuaderno rojo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reporte general/i })).toBeInTheDocument()
  })
})
