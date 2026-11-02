import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'

const { buscarExpedienteParaDepurar, listarDepuraciones, marcarDepurado } = vi.hoisted(() => ({
  buscarExpedienteParaDepurar: vi.fn(),
  listarDepuraciones: vi.fn(),
  marcarDepurado: vi.fn(),
}))

vi.mock('../api/depuracionArchivoApi', () => ({
  USANDO_DATOS_MOCK: true,
  buscarExpedienteParaDepurar,
  listarDepuraciones,
  marcarDepurado,
}))

import DepuracionExpedientesPage from './DepuracionExpedientesPage.jsx'

const EXPEDIENTE = {
  expedienteId: 'exp-1',
  numeroExpediente: 'EXP-ROBUSTEZ-1',
  pacienteNombre: 'Paciente de Prueba',
  depurado: false,
}

const REGISTRO = {
  id: 'dep-1',
  expedienteId: 'exp-1',
  numeroExpediente: 'EXP-ROBUSTEZ-1',
  pacienteNombre: 'Paciente de Prueba',
  motivo: null,
  usuarioNombre: 'Archivo Central',
  depuradoEn: new Date().toISOString(),
}

function errorCon(status, message = 'fallo') {
  return Object.assign(new Error(message), { status })
}

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

async function buscarExpediente(user) {
  await user.type(screen.getByLabelText(/número de expediente/i), EXPEDIENTE.numeroExpediente)
  await screen.findByText(EXPEDIENTE.pacienteNombre)
}

describe('DepuracionExpedientesPage · robustez', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listarDepuraciones.mockResolvedValue([])
  })

  it('muestra carga inicial y no anuncia la bitácora vacía antes de responder', () => {
    listarDepuraciones.mockImplementation(() => new Promise(() => {}))
    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent(/cargando bitácora/i)
    expect(screen.queryByText(/aún no hay expedientes depurados hoy/i)).not.toBeInTheDocument()
  })

  it('muestra el error de bitácora y permite reintentar', async () => {
    const user = userEvent.setup()
    listarDepuraciones.mockRejectedValueOnce(errorCon(500)).mockResolvedValueOnce([])

    renderPage()

    expect(await screen.findByText('No se pudo cargar la bitácora')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(await screen.findByText(/aún no hay expedientes depurados hoy/i)).toBeInTheDocument()
    expect(screen.queryByText('No se pudo cargar la bitácora')).not.toBeInTheDocument()
  })

  it('anuncia el estado de búsqueda de forma accesible', async () => {
    const user = userEvent.setup()
    let resolver
    buscarExpedienteParaDepurar.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolver = resolve
        }),
    )

    renderPage()

    await user.type(screen.getByLabelText(/número de expediente/i), EXPEDIENTE.numeroExpediente)

    expect(await screen.findByText(/buscando expediente/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/número de expediente/i)).toHaveAttribute('aria-busy', 'true')

    await act(async () => {
      resolver(EXPEDIENTE)
    })
    expect(await screen.findByText(EXPEDIENTE.pacienteNombre)).toBeInTheDocument()
  })

  it('POST correcto con GET fallido: muestra éxito y aviso de bitácora desactualizada', async () => {
    const user = userEvent.setup()
    buscarExpedienteParaDepurar.mockResolvedValue(EXPEDIENTE)
    marcarDepurado.mockResolvedValue(REGISTRO)
    listarDepuraciones.mockResolvedValueOnce([]).mockRejectedValueOnce(errorCon(500))

    renderPage()
    await buscarExpediente(user)

    await user.click(screen.getByRole('button', { name: /marcar como depurado/i }))

    expect(await screen.findByText('Expediente depurado')).toBeInTheDocument()
    expect(await screen.findByText('No se pudo actualizar la bitácora')).toBeInTheDocument()
    expect(screen.queryByText(/no se pudo registrar la depuración/i)).not.toBeInTheDocument()
  })

  it('el reintento actualiza la bitácora sin repetir el POST', async () => {
    const user = userEvent.setup()
    buscarExpedienteParaDepurar.mockResolvedValue(EXPEDIENTE)
    marcarDepurado.mockResolvedValue(REGISTRO)
    listarDepuraciones
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(errorCon(500))
      .mockResolvedValueOnce([REGISTRO])

    renderPage()
    await buscarExpediente(user)
    await user.click(screen.getByRole('button', { name: /marcar como depurado/i }))
    await screen.findByText('No se pudo actualizar la bitácora')

    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    await waitFor(() =>
      expect(screen.queryByText('No se pudo actualizar la bitácora')).not.toBeInTheDocument(),
    )
    expect(
      within(screen.getByRole('table')).getByText(REGISTRO.numeroExpediente),
    ).toBeInTheDocument()
    expect(marcarDepurado).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Expediente depurado')).toBeInTheDocument()
  })

  it('muestra el aviso de modo simulación cuando corresponde', async () => {
    renderPage()

    expect(await screen.findByText(/modo simulación/i)).toBeInTheDocument()
    expect(screen.getByText(/no se guardan en el servidor/i)).toBeInTheDocument()
  })

  it('usa el contenedor ampliado de las pantallas de Archivo', () => {
    renderPage()

    expect(screen.getByRole('main')).toHaveClass('max-w-6xl')
  })

  it('integra la bitácora con tabla y tarjetas sobre los mismos registros', async () => {
    const user = userEvent.setup()
    buscarExpedienteParaDepurar.mockResolvedValue(EXPEDIENTE)
    marcarDepurado.mockResolvedValue(REGISTRO)
    listarDepuraciones.mockResolvedValueOnce([]).mockResolvedValueOnce([REGISTRO])

    renderPage()
    await buscarExpediente(user)
    await user.click(screen.getByRole('button', { name: /marcar como depurado/i }))
    await screen.findByText('Expediente depurado')

    expect(
      within(screen.getByRole('table')).getByText(REGISTRO.numeroExpediente),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('list', { name: /tarjetas/i })).getByText(REGISTRO.numeroExpediente),
    ).toBeInTheDocument()
  })
})
