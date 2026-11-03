import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { formatearExpediente } from '@/shared/utils/expediente'
import { expedientesDepuracionMock } from '../api/depuracionFixtures'
import { marcarDepurado } from '../api/depuracionArchivoApi'
import { reiniciarDepuracionesMock } from '../api/depuracionMock'
import DepuracionExpedientesPage from './DepuracionExpedientesPage.jsx'

const EXPEDIENTE = expedientesDepuracionMock[0]
const FORMATEADO = formatearExpediente(EXPEDIENTE.numeroExpediente)
const FIXTURES_HOY = 12

function renderPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <DepuracionExpedientesPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('DepuracionExpedientesPage', () => {
  beforeEach(() => {
    reiniciarDepuracionesMock()
  })

  it('muestra el título y los fixtures de hoy al cargar', async () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Depuración de expedientes', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Lector listo/i)).not.toBeInTheDocument()
    const fecha = document.querySelector('time')
    expect(fecha).not.toBeNull()
    expect(fecha).toHaveTextContent(/\d{1,2} de .+ de \d{4}/)
    expect(fecha.textContent.charAt(0)).toBe(fecha.textContent.charAt(0).toUpperCase())
    expect(await screen.findByText(`Total: ${FIXTURES_HOY}`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /buscar expediente/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^deshacer$/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /descargar pdf/i })).toBeEnabled()
  })

  it('busca con Enter y confirma mediante el modal, sin tarjeta intermedia', async () => {
    const user = userEvent.setup()
    renderPage()
    const input = screen.getByLabelText(/número de expediente/i)

    await user.type(input, EXPEDIENTE.numeroExpediente)
    await user.keyboard('{Enter}')

    const modal = await screen.findByRole('dialog')
    expect(within(modal).getByRole('heading', { name: 'Confirmar depuración' })).toBeInTheDocument()
    expect(within(modal).getByText(EXPEDIENTE.pacienteNombre)).toBeInTheDocument()
    expect(within(modal).getByText(FORMATEADO)).toBeInTheDocument()
    expect(within(modal).queryByLabelText(/motivo/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /depurar expediente/i })).not.toBeInTheDocument()

    await user.click(within(modal).getByRole('button', { name: /confirmar depuración/i }))

    const toast = await screen.findByText('Expediente depurado correctamente')
    expect(toast.closest('[role="status"]')).not.toBeNull()
    expect(within(screen.getByRole('table')).getByText(FORMATEADO)).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText(`Total: ${FIXTURES_HOY + 1}`)).toBeInTheDocument(),
    )
  })

  it('permite confirmar con dos Enter sin ejecutar el POST en el primero', async () => {
    const user = userEvent.setup()
    renderPage()
    const input = screen.getByLabelText(/número de expediente/i)

    await user.type(input, EXPEDIENTE.numeroExpediente)
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByText('Expediente depurado correctamente')).not.toBeInTheDocument()

    await user.keyboard('{Enter}')

    expect(await screen.findByText('Expediente depurado correctamente')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText(`Total: ${FIXTURES_HOY + 1}`)).toBeInTheDocument(),
    )
  })

  it('cancelar con Escape no ejecuta la depuración y conserva el expediente', async () => {
    const user = userEvent.setup()
    renderPage()
    const input = screen.getByLabelText(/número de expediente/i)

    await user.type(input, EXPEDIENTE.numeroExpediente)
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(input).toHaveValue(EXPEDIENTE.numeroExpediente)
    expect(screen.queryByText(/expediente depurado/i)).not.toBeInTheDocument()
    expect(screen.getByText(`Total: ${FIXTURES_HOY}`)).toBeInTheDocument()

    await user.keyboard('{Enter}')
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('muestra el aviso de ya depurado sin abrir el modal', async () => {
    const user = userEvent.setup()
    await marcarDepurado({ numeroExpediente: EXPEDIENTE.numeroExpediente })
    renderPage()
    const input = screen.getByLabelText(/número de expediente/i)

    await user.type(input, EXPEDIENTE.numeroExpediente)

    expect(await screen.findByText(/ya está depurado/i)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('no abre el modal automáticamente al escribir', async () => {
    const user = userEvent.setup()
    renderPage()
    const input = screen.getByLabelText(/número de expediente/i)

    await user.type(input, EXPEDIENTE.numeroExpediente)
    await new Promise((resolver) => setTimeout(resolver, 500))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText(EXPEDIENTE.pacienteNombre)).not.toBeInTheDocument()
  })
})
