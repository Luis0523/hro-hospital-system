import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import DashboardArchivoPage from './DashboardArchivoPage.jsx'

function renderPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AuthProvider>
          <DashboardArchivoPage />
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('DashboardArchivoPage', () => {
  it('muestra el título y avisa el origen de los datos simulados', async () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Dashboard de Archivo', level: 2 }),
    ).toBeInTheDocument()
    expect(await screen.findByText(/datos simulados/i)).toBeInTheDocument()
  })

  it('carga y muestra los indicadores en modo mock', async () => {
    renderPage()

    const total = await screen.findByTestId('metrica-total')
    expect(within(total).getByText('Total de ciclos')).toBeInTheDocument()
    expect(screen.getByTestId('metrica-no-localizados')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Feed en tiempo real' })).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})
