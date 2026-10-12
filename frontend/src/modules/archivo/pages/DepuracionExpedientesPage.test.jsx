import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { expedientesMock } from '../api/mockData'
import { reiniciarDepuracionesMock } from '../api/depuracionMock'
import DepuracionExpedientesPage from './DepuracionExpedientesPage.jsx'

const EXPEDIENTE = expedientesMock.find((exp) => exp.numeroExpediente)

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

describe('DepuracionExpedientesPage', () => {
  beforeEach(() => {
    reiniciarDepuracionesMock()
  })

  it('muestra el título y la bitácora vacía', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Depuración de expedientes', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByText(/aún no hay expedientes depurados hoy/i)).toBeInTheDocument()
  })

  it('busca al escribir, muestra el paciente y permite marcar como depurado', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/número de expediente/i), EXPEDIENTE.numeroExpediente)

    await screen.findByText(EXPEDIENTE.pacienteNombre)

    await user.click(screen.getByRole('button', { name: /marcar como depurado/i }))

    await screen.findByText(/expediente depurado/i)
    expect(await screen.findByText(EXPEDIENTE.numeroExpediente)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/total: 1/i)).toBeInTheDocument())
  })
})
