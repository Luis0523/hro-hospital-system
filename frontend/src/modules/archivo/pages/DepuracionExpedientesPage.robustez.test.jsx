import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { formatearFechaCortaGuatemala, hoyIsoGuatemala } from '../utils/fechaDepuracionGuatemala'
import { crearPeriodo } from '../utils/periodoDepuracion'

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

async function abrirYConfirmar(user) {
  await user.click(screen.getByRole('button', { name: /depurar expediente/i }))
  await screen.findByRole('dialog')
  await user.click(screen.getByRole('button', { name: /confirmar depuración/i }))
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
    expect(screen.getByRole('button', { name: /descargar reporte pdf/i })).toBeDisabled()
    expect(screen.getByText(/espere a que termine/i)).toBeInTheDocument()
  })

  it('muestra el error de bitácora y permite reintentar', async () => {
    const user = userEvent.setup()
    listarDepuraciones.mockRejectedValueOnce(errorCon(500)).mockResolvedValueOnce([])

    renderPage()

    expect(await screen.findByText('No se pudo cargar la bitácora')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descargar reporte pdf/i })).toBeDisabled()
    expect(screen.getByText(/período está incompleta/i)).toBeInTheDocument()

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

    expect(await screen.findByText('Expediente depurado')).toBeInTheDocument()
    expect(await screen.findByText('No se pudo actualizar la bitácora')).toBeInTheDocument()
    expect(screen.queryByText(/no se pudo registrar la depuración/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descargar reporte pdf/i })).toBeDisabled()
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
    expect(screen.getByText('Expediente depurado')).toBeInTheDocument()
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

    const boton = screen.getByRole('button', { name: /descargar reporte pdf/i })
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
    await user.click(screen.getByRole('button', { name: /descargar reporte pdf/i }))

    expect(await screen.findByText('No se pudo generar el reporte PDF')).toBeInTheDocument()
    expect(screen.getByText(/no se pudo iniciar la descarga/i)).toBeInTheDocument()
    expect(open).not.toHaveBeenCalled()
  })

  it('aplica la máscara dd/mm/aaaa y permite un rango sin límite de 31 días', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText(/aún no hay expedientes depurados hoy/i)
    vi.clearAllMocks()

    await user.click(screen.getByRole('button', { name: 'Rango personalizado' }))
    const inicial = screen.getByLabelText('Fecha inicial')
    const final = screen.getByLabelText('Fecha final')

    fireEvent.change(inicial, { target: { value: '03102026' } })
    fireEvent.change(final, { target: { value: '02112026' } })

    expect(inicial).toHaveValue('03/10/2026')
    expect(final).toHaveValue('02/11/2026')
    expect(screen.queryByRole('button', { name: 'Este mes' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /aplicar rango/i }))

    await waitFor(() => expect(listarDepuraciones).toHaveBeenCalledTimes(31))
    expect(listarDepuraciones).toHaveBeenCalledWith({ fecha: '2026-10-03' })
    expect(listarDepuraciones).toHaveBeenCalledWith({ fecha: '2026-11-02' })
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

    const buscador = screen.getByRole('textbox', { name: /buscar en la bitácora/i })
    fireEvent.change(buscador, { target: { value: '9275' } })

    expect(screen.getAllByText('Mostrando 1 de 2').length).toBeGreaterThan(0)
    expect(within(screen.getByRole('table')).getByText('9275-81')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).queryByText('3095-4')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /descargar reporte pdf/i }))

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
    await screen.findByText('Expediente depurado')

    expect(
      screen.getByRole('heading', { name: /última depuración de la sesión/i }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^deshacer$/i }))
    expect(
      await screen.findByRole('heading', { name: 'Deshacer última depuración' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancelar/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(
      screen.getByRole('heading', { name: /última depuración de la sesión/i }),
    ).toBeInTheDocument()
    expect(deshacerUltimaDepuracion).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /^deshacer$/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar reversión/i }))

    expect(await screen.findByText('Depuración simulada revertida')).toBeInTheDocument()
    expect(deshacerUltimaDepuracion).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: /última depuración de la sesión/i }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(/aún no hay expedientes depurados hoy/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descargar reporte pdf/i })).toBeDisabled()
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
    await screen.findByText('Expediente depurado')

    expect(within(screen.getByRole('table')).getByText(FORMATEADO)).toBeInTheDocument()
    expect(
      within(screen.getByRole('list', { name: /tarjetas/i })).getByText(FORMATEADO),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('table')).getByText(
        formatearFechaCortaGuatemala(REGISTRO.depuradoEn),
      ),
    ).toBeInTheDocument()
  })

  it('consulta la semana desde los filtros y actualiza el título de la bitácora', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText(/aún no hay expedientes depurados hoy/i)
    vi.clearAllMocks()

    await user.click(screen.getByRole('button', { name: 'Esta semana' }))

    await waitFor(() => expect(listarDepuraciones).toHaveBeenCalledTimes(7))
    expect(
      await screen.findByRole('heading', { name: 'Depurados de la semana', level: 3 }),
    ).toBeInTheDocument()
  })

  it('presenta la consulta incompleta sin un total engañoso', async () => {
    const user = userEvent.setup()
    const semana = crearPeriodo('semana', { hoy: hoyIsoGuatemala() })
    const registros = semana.dias.map((fecha, indice) => ({
      ...REGISTRO,
      id: `semana-${indice}`,
      numeroExpediente: `90000${indice}`,
      depuradoEn: `${fecha}T10:00:00-06:00`,
    }))

    renderPage()
    await screen.findByText(/aún no hay expedientes depurados hoy/i)
    vi.clearAllMocks()

    let primera = true
    listarDepuraciones.mockImplementation(() => {
      if (primera) {
        primera = false
        return Promise.reject(errorCon(500))
      }
      return Promise.resolve([registros.shift()])
    })

    await user.click(screen.getByRole('button', { name: 'Esta semana' }))

    expect(await screen.findByText('Consulta incompleta')).toBeInTheDocument()
    expect(screen.getByText('Parcial: 6')).toBeInTheDocument()
    expect(screen.queryByText('Total: 6')).not.toBeInTheDocument()
    expect(screen.getByText(/no es una base válida para reportes/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descargar reporte pdf/i })).toBeDisabled()
    expect(screen.getByText(/período está incompleta/i)).toBeInTheDocument()
  })

  it('no consulta un rango personalizado inválido', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText(/aún no hay expedientes depurados hoy/i)
    vi.clearAllMocks()

    await user.click(screen.getByRole('button', { name: 'Rango personalizado' }))
    expect(screen.getByLabelText('Fecha inicial')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Fecha inicial'), {
      target: { value: '03/11/2026' },
    })
    fireEvent.change(screen.getByLabelText('Fecha final'), {
      target: { value: '02/11/2026' },
    })
    await user.click(screen.getByRole('button', { name: /aplicar rango/i }))

    expect(screen.getByText(/no puede ser posterior/i)).toBeInTheDocument()
    expect(listarDepuraciones).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Depurados hoy', level: 3 })).toBeInTheDocument()
  })
})
