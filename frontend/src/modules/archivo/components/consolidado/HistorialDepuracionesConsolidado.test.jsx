import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { hoyIsoGuatemala } from '../../utils/fechaDepuracionGuatemala'

const { listarDepuraciones, listarDepuracionesEnRango, descargarReporteDepurados } = vi.hoisted(
  () => ({
    listarDepuraciones: vi.fn(),
    listarDepuracionesEnRango: vi.fn(),
    descargarReporteDepurados: vi.fn(),
  }),
)

vi.mock('../../api/depuracionArchivoApi', () => ({
  USANDO_DATOS_MOCK: true,
  listarDepuraciones,
  listarDepuracionesEnRango,
}))

vi.mock('../../utils/reporteDepurados', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, descargarReporteDepurados }
})

import HistorialDepuracionesConsolidado from './HistorialDepuracionesConsolidado.jsx'

const HOY = hoyIsoGuatemala()
const REGISTRO = {
  id: 'dep-1',
  numeroExpediente: '927581',
  pacienteNombre: 'Paciente de Prueba',
  usuarioNombre: 'Archivo Central',
  motivo: null,
  depuradoEn: `${HOY}T15:30:00-06:00`,
}
const OTRO = {
  id: 'dep-2',
  numeroExpediente: '30954',
  pacienteNombre: 'Otro Paciente',
  usuarioNombre: 'Archivo Central',
  motivo: null,
  depuradoEn: `${HOY}T14:05:00-06:00`,
}

function renderHistorial() {
  return render(
    <ToastProvider>
      <HistorialDepuracionesConsolidado />
    </ToastProvider>,
  )
}

describe('HistorialDepuracionesConsolidado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listarDepuraciones.mockResolvedValue([REGISTRO, OTRO])
    listarDepuracionesEnRango.mockResolvedValue([REGISTRO, OTRO])
    descargarReporteDepurados.mockReturnValue({ ok: true })
  })

  it('consulta Hoy inicialmente y no ofrece acciones de depuración', async () => {
    renderHistorial()

    expect(await screen.findByText('Total: 2')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Depurados de hoy', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Esta semana' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rango personalizado' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^deshacer$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /depurar expediente/i })).not.toBeInTheDocument()
    expect(listarDepuraciones).toHaveBeenCalledTimes(1)
    expect(listarDepuraciones).toHaveBeenCalledWith({ fecha: HOY })
  })

  it('consulta la semana y mantiene el título y la cantidad correspondientes', async () => {
    const user = userEvent.setup()
    renderHistorial()
    await screen.findByText('Total: 2')

    await user.click(screen.getByRole('button', { name: 'Esta semana' }))

    await waitFor(() => expect(listarDepuraciones).toHaveBeenCalledTimes(8))
    expect(
      await screen.findByRole('heading', { name: 'Depurados de la semana', level: 3 }),
    ).toBeInTheDocument()
  })

  it('permite buscar localmente y descarga el PDF filtrado', async () => {
    const user = userEvent.setup()
    renderHistorial()
    await screen.findByText('Total: 2')

    await user.click(screen.getByRole('button', { name: /buscar expediente/i }))
    const modal = screen.getByRole('dialog')
    fireEvent.change(within(modal).getByLabelText(/número de expediente/i), {
      target: { value: '9275' },
    })
    await user.click(within(modal).getByRole('button', { name: /aplicar/i }))

    expect(await screen.findByText('Exp. 9275')).toBeInTheDocument()
    expect(screen.getByText('Mostrando 1 de 2')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('9275-81')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).queryByText('3095-4')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /descargar pdf/i }))

    expect(descargarReporteDepurados).toHaveBeenCalledWith(
      expect.objectContaining({
        datosHistorial: expect.objectContaining({ total: 1, registros: [REGISTRO] }),
        busquedaExpediente: '9275',
      }),
    )
    expect(listarDepuraciones).toHaveBeenCalledTimes(1)
  })

  it('valida un rango personalizado inválido sin consultar', async () => {
    const user = userEvent.setup()
    renderHistorial()
    await screen.findByText('Total: 2')
    vi.clearAllMocks()

    await user.click(screen.getByRole('button', { name: 'Rango personalizado' }))
    fireEvent.change(screen.getByLabelText('Fecha inicial'), {
      target: { value: '03/11/2026' },
    })
    fireEvent.change(screen.getByLabelText('Fecha final'), {
      target: { value: '02/11/2026' },
    })
    await user.click(screen.getByRole('button', { name: /aplicar rango/i }))

    expect(screen.getByText(/no puede ser posterior/i)).toBeInTheDocument()
    expect(listarDepuraciones).not.toHaveBeenCalled()
    expect(listarDepuracionesEnRango).not.toHaveBeenCalled()
  })

  it('muestra error inicial y permite reintentar', async () => {
    const user = userEvent.setup()
    listarDepuraciones
      .mockRejectedValueOnce(Object.assign(new Error('fallo'), { status: 500 }))
      .mockResolvedValueOnce([])

    renderHistorial()

    expect(
      await screen.findByText('No se pudo cargar el historial de depuraciones'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /descargar pdf/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(await screen.findByText('Aún no hay expedientes depurados hoy')).toBeInTheDocument()
  })
})
