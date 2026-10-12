import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { reiniciarDepuracionesMock } from '../api/depuracionMock'
import ConsolidadoArchivoPage from './ConsolidadoArchivoPage.jsx'

function renderPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AuthProvider>
          <ConsolidadoArchivoPage />
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('ConsolidadoArchivoPage', () => {
  beforeEach(() => {
    reiniciarDepuracionesMock()
  })

  it('muestra el título y el total del día en modo mock', async () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Consolidado de Archivo', level: 2 }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Total del día')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument()
  })

  it('cambia a la pestaña mensual y muestra las tablas del informe', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: 'Mensual' }))

    expect(await screen.findByText(/Tabla 1 · Informe Estadístico/i)).toBeInTheDocument()
    expect(screen.getByText(/Tabla 2 · Detalle/i)).toBeInTheDocument()
    expect(screen.getByText(/Totales del mes/i)).toBeInTheDocument()
  })
})
