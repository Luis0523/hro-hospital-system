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
    const fecha = document.querySelector('time')
    expect(fecha).not.toBeNull()
    expect(fecha).toHaveTextContent(/\d{1,2} de .+ de \d{4}/)
    expect(fecha.textContent.charAt(0)).toBe(fecha.textContent.charAt(0).toUpperCase())
    expect(await screen.findByText(`Total: ${FIXTURES_HOY}`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /buscar y depurar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^deshacer$/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /descargar pdf/i })).toBeEnabled()
  })

  it('depura directamente con Enter, sin modal de confirmación', async () => {
    const user = userEvent.setup()
    renderPage()
    const input = screen.getByLabelText(/número de expediente/i)

    await user.type(input, EXPEDIENTE.numeroExpediente)
    await user.keyboard('{Enter}')

    expect(await screen.findByText('Expediente depurado correctamente')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText(FORMATEADO)).toBeInTheDocument()
    await waitFor(() => expect(input).toHaveValue(''))
    await waitFor(() =>
      expect(screen.getByText(`Total: ${FIXTURES_HOY + 1}`)).toBeInTheDocument(),
    )
  })

  it('no consulta ni depura mientras solo se escribe', async () => {
    const user = userEvent.setup()
    renderPage()
    const input = screen.getByLabelText(/número de expediente/i)

    await user.type(input, EXPEDIENTE.numeroExpediente)
    await new Promise((resolver) => setTimeout(resolver, 500))

    expect(screen.queryByText('Expediente depurado correctamente')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(`Total: ${FIXTURES_HOY}`)).toBeInTheDocument()
    expect(input).toHaveValue(EXPEDIENTE.numeroExpediente)
  })

  it('también depura con el botón', async () => {
    const user = userEvent.setup()
    renderPage()
    const input = screen.getByLabelText(/número de expediente/i)

    await user.type(input, EXPEDIENTE.numeroExpediente)
    await user.click(screen.getByRole('button', { name: /buscar y depurar/i }))

    expect(await screen.findByText('Expediente depurado correctamente')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText(`Total: ${FIXTURES_HOY + 1}`)).toBeInTheDocument(),
    )
  })

  it('muestra el error de formato al enviar y no depura', async () => {
    const user = userEvent.setup()
    renderPage()
    const input = screen.getByLabelText(/número de expediente/i)

    await user.type(input, 'ABC123')
    await user.keyboard('{Enter}')

    expect(await screen.findByText(/use solo dígitos/i)).toBeInTheDocument()
    expect(screen.getByText(`Total: ${FIXTURES_HOY}`)).toBeInTheDocument()
    expect(screen.queryByText('Expediente depurado correctamente')).not.toBeInTheDocument()
  })

  it('registra manualmente la baja cuando el hospital no responde', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText(`Total: ${FIXTURES_HOY}`)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /registrar manualmente/i }))

    const modal = await screen.findByRole('dialog')
    await user.type(within(modal).getByLabelText(/número de expediente/i), '908522')
    await user.type(within(modal).getByLabelText(/nombre completo/i), 'Paciente Manual')
    await user.click(within(modal).getByRole('button', { name: /registrar baja/i }))

    expect(await screen.findByText('Expediente depurado manualmente')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('9085-22')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText(`Total: ${FIXTURES_HOY + 1}`)).toBeInTheDocument(),
    )
  })

  it('elimina una depuración desde la tabla y actualiza el total', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText(`Total: ${FIXTURES_HOY}`)).toBeInTheDocument()
    const tabla = screen.getByRole('table')
    const botonesEliminar = within(tabla).getAllByRole('button', { name: /^Eliminar /i })
    expect(botonesEliminar.length).toBeGreaterThan(0)

    await user.click(botonesEliminar[0])
    const modal = await screen.findByRole('dialog')
    expect(within(modal).getByText('Eliminar depuración')).toBeInTheDocument()
    await user.click(within(modal).getByRole('button', { name: /sí, eliminar/i }))

    expect(await screen.findByText('Depuración eliminada')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText(`Total: ${FIXTURES_HOY - 1}`)).toBeInTheDocument(),
    )
  })

  it('avisa cuando el expediente ya está depurado y no lo duplica', async () => {
    const user = userEvent.setup()
    await marcarDepurado({ numeroExpediente: EXPEDIENTE.numeroExpediente })
    renderPage()

    expect(await screen.findByText(`Total: ${FIXTURES_HOY + 1}`)).toBeInTheDocument()
    const input = screen.getByLabelText(/número de expediente/i)

    await user.type(input, EXPEDIENTE.numeroExpediente)
    await user.keyboard('{Enter}')

    expect(await screen.findByText(/ya está depurado/i)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(`Total: ${FIXTURES_HOY + 1}`)).toBeInTheDocument()
  })
})
