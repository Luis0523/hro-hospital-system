import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { formatearExpediente } from '@/shared/utils/expediente'
import { expedientesDepuracionMock } from '../api/depuracionFixtures'
import { reiniciarDepuracionesMock } from '../api/depuracionMock'
import DepuracionExpedientesPage from './DepuracionExpedientesPage.jsx'

const EXPEDIENTE = expedientesDepuracionMock[0]
const FORMATEADO = formatearExpediente(EXPEDIENTE.numeroExpediente)

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

  it('muestra el título y la bitácora vacía tras cargar', async () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Depuración de expedientes', level: 2 }),
    ).toBeInTheDocument()
    expect(await screen.findByText(/aún no hay expedientes depurados hoy/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descargar reporte pdf/i })).toBeDisabled()
    expect(screen.getByText(/no hay expedientes depurados en el período/i)).toBeInTheDocument()
  })

  it('busca, muestra el resumen y confirma desde el modal', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/número de expediente/i), EXPEDIENTE.numeroExpediente)

    await screen.findByText(EXPEDIENTE.pacienteNombre)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/motivo/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /depurar expediente/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).getByText(FORMATEADO)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/motivo \(opcional\)/i), 'Extraviado')
    await user.click(screen.getByRole('button', { name: /confirmar depuración/i }))

    await screen.findByText(/expediente depurado/i)
    expect(within(screen.getByRole('table')).getByText(FORMATEADO)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/total: 1/i)).toBeInTheDocument())
  })

  it('cancelar no ejecuta la depuración y conserva el resumen', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/número de expediente/i), EXPEDIENTE.numeroExpediente)
    await screen.findByText(EXPEDIENTE.pacienteNombre)

    await user.click(screen.getByRole('button', { name: /depurar expediente/i }))
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText(EXPEDIENTE.pacienteNombre)).toBeInTheDocument()
    expect(screen.queryByText(/expediente depurado/i)).not.toBeInTheDocument()
    expect(screen.getByText(/aún no hay expedientes depurados hoy/i)).toBeInTheDocument()
  })

  it('no abre el modal automáticamente al escribir', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/número de expediente/i), EXPEDIENTE.numeroExpediente)
    await screen.findByText(EXPEDIENTE.pacienteNombre)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
