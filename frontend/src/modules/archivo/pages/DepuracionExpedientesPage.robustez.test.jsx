import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { formatearFechaCortaGuatemala } from '../utils/fechaDepuracionGuatemala'

const {
  buscarExpedienteParaDepurar,
  deshacerUltimaDepuracion,
  listarDepuraciones,
  listarDepuracionesEnRango,
  marcarDepurado,
} = vi.hoisted(() => ({
  buscarExpedienteParaDepurar: vi.fn(),
  deshacerUltimaDepuracion: vi.fn(),
  listarDepuraciones: vi.fn(),
  listarDepuracionesEnRango: vi.fn(),
  marcarDepurado: vi.fn(),
}))

vi.mock('../api/depuracionArchivoApi', () => ({
  USANDO_DATOS_MOCK: true,
  buscarExpedienteParaDepurar,
  deshacerUltimaDepuracion,
  listarDepuraciones,
  listarDepuracionesEnRango,
  marcarDepurado,
}))

const { descargarReporteDepurados } = vi.hoisted(() => ({
  descargarReporteDepurados: vi.fn(),
}))

vi.mock('../utils/reporteDepurados', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, descargarReporteDepurados }
})

import DepuracionExpedientesPage from './DepuracionExpedientesPage.jsx'

const EXPEDIENTE = {
  expedienteId: 'exp-1',
  numeroExpediente: '927581',
  pacienteNombre: 'Paciente de Prueba',
  depurado: false,
}

const REGISTRO = {
  id: 'dep-1',
  expedienteId: 'exp-1',
  numeroExpediente: '927581',
  pacienteNombre: 'Paciente de Prueba',
  motivo: null,
  usuarioNombre: 'Archivo Central',
  depuradoEn: new Date().toISOString(),
}

const FORMATEADO = '9275-81'

function errorCon(status, message = 'fallo') {
  return Object.assign(new Error(message), { status })
}

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

async function buscarExpediente(user) {
  const input = screen.getByLabelText(/número de expediente/i)
  await user.type(input, EXPEDIENTE.numeroExpediente)
  await waitFor(() => expect(buscarExpedienteParaDepurar).toHaveBeenCalledTimes(1))
  await waitFor(() => expect(input).toHaveAttribute('aria-busy', 'false'))
}

async function abrirYConfirmar(user) {
  await user.keyboard('{Enter}')
  const modal = await screen.findByRole('dialog')
  await user.click(within(modal).getByRole('button', { name: /confirmar depuración/i }))
}

describe('DepuracionExpedientesPage · robustez', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deshacerUltimaDepuracion.mockReset()
    descargarReporteDepurados.mockReset()
    descargarReporteDepurados.mockReturnValue({ ok: true })
    listarDepuraciones.mockResolvedValue([])
    listarDepuracionesEnRango.mockReset()
    listarDepuracionesEnRango.mockResolvedValue([])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('muestra carga inicial y no anuncia la bitácora vacía antes de responder', () => {
    listarDepuraciones.mockImplementation(() => new Promise(() => {}))
    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent(/cargando bitácora/i)
    expect(screen.queryByText(/aún no hay expedientes depurados hoy/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /descargar pdf/i })).not.toBeInTheDocument()
  })

  it('muestra el error de bitácora y permite reintentar', async () => {
    const user = userEvent.setup()
    listarDepuraciones.mockRejectedValueOnce(errorCon(500)).mockResolvedValueOnce([])

    renderPage()

    expect(await screen.findByText('No se pudo cargar la bitácora')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /descargar pdf/i })).not.toBeInTheDocument()

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
    const input = screen.getByLabelText(/número de expediente/i)

    await user.type(input, EXPEDIENTE.numeroExpediente)

    expect(await screen.findByText(/buscando expediente/i)).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-busy', 'true')

    await act(async () => {
      resolver(EXPEDIENTE)
    })
    await waitFor(() => expect(input).toHaveAttribute('aria-busy', 'false'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText(EXPEDIENTE.pacienteNombre)).not.toBeInTheDocument()
  })

  it('abre el modal con Enter reutilizando la búsqueda automática', async () => {
    const user = userEvent.setup()
    buscarExpedienteParaDepurar.mockResolvedValue(EXPEDIENTE)
    renderPage()
    const input = screen.getByLabelText(/número de expediente/i)

    await user.type(input, EXPEDIENTE.numeroExpediente)
    await waitFor(() => expect(buscarExpedienteParaDepurar).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(input).toHaveAttribute('aria-busy', 'false'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.keyboard('{Enter}')

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(marcarDepurado).not.toHaveBeenCalled()
    expect(buscarExpedienteParaDepurar).toHaveBeenCalledTimes(1)
  })

  it('muestra el error de formato y no busca', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/número de expediente/i), 'ABC123')

    expect(await screen.findByText(/use solo dígitos/i)).toBeInTheDocument()
    expect(buscarExpedienteParaDepurar).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /depurar expediente/i })).not.toBeInTheDocument()
  })

  it('POST correcto con GET fallido: muestra éxito y aviso de bitácora desactualizada', async () => {
    const user = userEvent.setup()
    buscarExpedienteParaDepurar.mockResolvedValue(EXPEDIENTE)
    marcarDepurado.mockResolvedValue(REGISTRO)
    listarDepuraciones.mockResolvedValueOnce([]).mockRejectedValueOnce(errorCon(500))

    renderPage()
    await buscarExpediente(user)
    await abrirYConfirmar(user)

    expect(await screen.findByText('Expediente depurado correctamente')).toBeInTheDocument()
    expect(await screen.findByText('No se pudo actualizar la bitácora')).toBeInTheDocument()
    expect(screen.queryByText(/no se pudo registrar la depuración/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descargar pdf/i })).toBeDisabled()
    expect(screen.getByText(/está desactualizado/i)).toBeInTheDocument()
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
    await abrirYConfirmar(user)
    await screen.findByText('No se pudo actualizar la bitácora')

    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    await waitFor(() =>
      expect(screen.queryByText('No se pudo actualizar la bitácora')).not.toBeInTheDocument(),
    )
    expect(within(screen.getByRole('table')).getByText(FORMATEADO)).toBeInTheDocument()
    expect(marcarDepurado).toHaveBeenCalledTimes(1)
  })

  it('muestra el aviso de modo simulación cuando corresponde', async () => {
    renderPage()

    expect(await screen.findByText(/modo simulación/i)).toBeInTheDocument()
    expect(screen.getByText(/no se guardan en el servidor/i)).toBeInTheDocument()
  })

  it('descarga el PDF con el historial completo sin repetir consultas', async () => {
    const user = userEvent.setup()
    const open = vi.spyOn(window, 'open')
    listarDepuraciones.mockResolvedValueOnce([REGISTRO])

    renderPage()
    await screen.findByText('Total: 1')

    const boton = screen.getByRole('button', { name: /descargar pdf/i })
    expect(boton).toBeEnabled()
    await user.click(boton)

    expect(descargarReporteDepurados).toHaveBeenCalledWith(
      expect.objectContaining({
        datosHistorial: expect.objectContaining({ total: 1, registros: [REGISTRO] }),
        usandoMock: true,
        busquedaExpediente: '',
      }),
    )
    expect(listarDepuraciones).toHaveBeenCalledTimes(1)
    expect(open).not.toHaveBeenCalled()
  })

  it('muestra el error si la descarga del PDF no puede iniciarse', async () => {
    const user = userEvent.setup()
    const open = vi.spyOn(window, 'open')
    descargarReporteDepurados.mockReturnValueOnce({
      ok: false,
      mensaje: 'No se pudo iniciar la descarga del PDF. Inténtelo de nuevo.',
    })
    listarDepuraciones.mockResolvedValueOnce([REGISTRO])

    renderPage()
    await screen.findByText('Total: 1')
    await user.click(screen.getByRole('button', { name: /descargar pdf/i }))

    expect(await screen.findByText('No se pudo generar el reporte PDF')).toBeInTheDocument()
    expect(screen.getByText(/no se pudo iniciar la descarga/i)).toBeInTheDocument()
    expect(open).not.toHaveBeenCalled()
  })

  it('filtra localmente por expediente y limita el PDF a las coincidencias', async () => {
    const user = userEvent.setup()
    const otro = {
      ...REGISTRO,
      id: 'dep-2',
      numeroExpediente: '30954',
      pacienteNombre: 'Otro Paciente',
    }
    listarDepuraciones.mockResolvedValueOnce([REGISTRO, otro])

    renderPage()
    await screen.findByText('Total: 2')

    await user.click(screen.getByRole('button', { name: /buscar expediente/i }))
    const buscador = within(screen.getByRole('dialog')).getByLabelText(/número de expediente/i)
    fireEvent.change(buscador, { target: { value: '9275' } })
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /aplicar/i }))

    expect(screen.getAllByText('Mostrando 1 de 2').length).toBeGreaterThan(0)
    expect(within(screen.getByRole('table')).getByText('9275-81')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).queryByText('3095-4')).not.toBeInTheDocument()
    expect(listarDepuraciones).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /descargar pdf/i }))

    expect(descargarReporteDepurados).toHaveBeenCalledWith(
      expect.objectContaining({
        datosHistorial: expect.objectContaining({ total: 1, registros: [REGISTRO] }),
        busquedaExpediente: '9275',
      }),
    )

    await user.click(screen.getByRole('button', { name: /limpiar búsqueda de expediente/i }))
    expect(screen.getByText('Total: 2')).toBeInTheDocument()
  })

  it('muestra la última depuración, permite cancelar y confirmar la reversión simulada', async () => {
    const user = userEvent.setup()
    buscarExpedienteParaDepurar.mockResolvedValue(EXPEDIENTE)
    marcarDepurado.mockResolvedValue(REGISTRO)
    deshacerUltimaDepuracion.mockResolvedValue(REGISTRO)
    listarDepuraciones
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([REGISTRO])
      .mockResolvedValueOnce([])

    renderPage()
    await buscarExpediente(user)
    await abrirYConfirmar(user)
    await screen.findByText('Expediente depurado correctamente')

    expect(
      screen.queryByRole('heading', { name: /última depuración de la sesión/i }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^deshacer$/i }))
    expect(
      await screen.findByRole('heading', { name: 'Deshacer última depuración' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancelar/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: /^deshacer$/i })).toBeEnabled()
    expect(deshacerUltimaDepuracion).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /^deshacer$/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar reversión/i }))

    expect(await screen.findByText('Depuración simulada revertida')).toBeInTheDocument()
    expect(deshacerUltimaDepuracion).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /última depuración de la sesión/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/aún no hay expedientes depurados hoy/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descargar pdf/i })).toBeDisabled()
  })

  it('usa el contenedor ampliado y centra el bloque de captura', () => {
    renderPage()

    const main = screen.getByRole('main')
    expect(main).toHaveClass('max-w-6xl')
    const bloque = main.querySelector('.max-w-2xl')
    expect(bloque).not.toBeNull()
    expect(bloque).toHaveClass('mx-auto')
  })

  it('integra la bitácora con tabla y tarjetas sobre los mismos registros', async () => {
    const user = userEvent.setup()
    buscarExpedienteParaDepurar.mockResolvedValue(EXPEDIENTE)
    marcarDepurado.mockResolvedValue(REGISTRO)
    listarDepuraciones.mockResolvedValueOnce([]).mockResolvedValueOnce([REGISTRO])

    renderPage()
    await buscarExpediente(user)
    await abrirYConfirmar(user)
    await screen.findByText('Expediente depurado correctamente')

    expect(within(screen.getByRole('table')).getByText(FORMATEADO)).toBeInTheDocument()
    expect(
      within(screen.getByRole('list', { name: /tarjetas/i })).getByText(FORMATEADO),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('table')).queryByText(
        formatearFechaCortaGuatemala(REGISTRO.depuradoEn),
      ),
    ).not.toBeInTheDocument()
  })

  it('mantiene únicamente el listado de hoy, sin filtros históricos', async () => {
    renderPage()
    await screen.findByText(/aún no hay expedientes depurados hoy/i)

    expect(screen.getByRole('heading', { name: 'Depurados de hoy', level: 3 })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Esta semana' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rango personalizado' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Fecha inicial')).not.toBeInTheDocument()
  })

  it('coloca las acciones en la cabecera y deja el PDF al extremo derecho', async () => {
    listarDepuraciones.mockResolvedValue([REGISTRO])
    renderPage()

    await screen.findByText('Total: 1')
    const buscar = screen.getByRole('button', { name: /buscar expediente/i })
    const deshacer = screen.getByRole('button', { name: /^deshacer$/i })
    const pdf = screen.getByRole('button', { name: /descargar pdf/i })

    expect(screen.getByRole('heading', { name: 'Depurados de hoy', level: 3 })).toBeInTheDocument()
    expect(
      screen.queryByRole('textbox', { name: /buscar en la bitácora/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /reporte de depurados/i })).not.toBeInTheDocument()
    expect(buscar.compareDocumentPosition(deshacer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(deshacer.compareDocumentPosition(pdf) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
