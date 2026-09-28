import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { reiniciarCatalogosMock } from '../api/mockData.js'

// Fija "hoy" para que el rango por defecto sea determinista.
vi.mock('../utils/fechas.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, hoyISO: () => '2026-09-30' }
})

vi.mock('../api/administracionApi.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    obtenerReporteCitasPorEstado: vi.fn(actual.obtenerReporteCitasPorEstado),
    obtenerReporteDemandaPorEspecialidad: vi.fn(actual.obtenerReporteDemandaPorEspecialidad),
    obtenerReporteUtilizacionCupos: vi.fn(actual.obtenerReporteUtilizacionCupos),
  }
})

import {
  obtenerReporteCitasPorEstado,
  obtenerReporteDemandaPorEspecialidad,
  obtenerReporteUtilizacionCupos,
} from '../api/administracionApi.js'
import { restarDiasISO } from '../utils/fechas.js'
import ReportesPage from './ReportesPage.jsx'

function renderPagina() {
  return render(<ReportesPage />)
}

async function esperarCitas() {
  return screen.findByTestId('reporte-citas-total')
}

describe('restarDiasISO', () => {
  it('resta días sin desplazamiento de zona horaria', () => {
    expect(restarDiasISO('2026-09-30', 30)).toBe('2026-08-31')
    expect(restarDiasISO('2026-01-01', 1)).toBe('2025-12-31')
    expect(restarDiasISO('2026-03-01', 1)).toBe('2026-02-28')
    expect(restarDiasISO('', 30)).toBe('')
  })
})

describe('ReportesPage', () => {
  beforeEach(() => {
    reiniciarCatalogosMock()
    obtenerReporteCitasPorEstado.mockClear()
    obtenerReporteDemandaPorEspecialidad.mockClear()
    obtenerReporteUtilizacionCupos.mockClear()
  })

  it('usa por defecto hoy y hoy-30 y consulta con fechas explícitas', async () => {
    renderPagina()

    expect(screen.getByLabelText('Desde')).toHaveValue('2026-08-31')
    expect(screen.getByLabelText('Hasta')).toHaveValue('2026-09-30')

    await esperarCitas()
    expect(obtenerReporteCitasPorEstado).toHaveBeenCalledWith({
      fechaInicio: '2026-08-31',
      fechaFin: '2026-09-30',
    })
  })

  it('muestra el total y el desglose dinámico de citas por estado', async () => {
    renderPagina()

    const total = await esperarCitas()
    expect(within(total).getByText('40')).toBeInTheDocument()

    const estados = screen.getByTestId('reporte-citas-estados')
    expect(within(estados).getByText('Atendidas')).toBeInTheDocument()
    expect(within(estados).getByText('Inasistencias')).toBeInTheDocument()
    expect(within(estados).getByText('12')).toBeInTheDocument()
  })

  it('conserva claves de estado desconocidas', async () => {
    obtenerReporteCitasPorEstado.mockResolvedValueOnce({
      fechaInicio: '2026-08-31',
      fechaFin: '2026-09-30',
      total: 3,
      porEstado: { estado_raro: 3 },
    })
    renderPagina()

    const estados = await screen.findByTestId('reporte-citas-estados')
    expect(within(estados).getByText('estado_raro')).toBeInTheDocument()
  })

  it('muestra el reporte de demanda al cambiar de tab', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCitas()

    await user.click(screen.getByRole('tab', { name: 'Demanda' }))

    const tabla = await screen.findByTestId('demanda-escritorio')
    expect(within(tabla).getByText('Medicina Interna')).toBeInTheDocument()
    expect(within(tabla).getByText('Pediatría')).toBeInTheDocument()
    expect(obtenerReporteDemandaPorEspecialidad).toHaveBeenCalledTimes(1)
  })

  it('muestra utilización global y permite filtrar por subespecialidad', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCitas()

    await user.click(screen.getByRole('tab', { name: 'Utilización' }))

    const global = await screen.findByTestId('reporte-utilizacion')
    expect(within(global).getByText('2400')).toBeInTheDocument()
    expect(within(global).getByText('2%')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Subespecialidad'), '1')

    await waitFor(() =>
      expect(obtenerReporteUtilizacionCupos).toHaveBeenLastCalledWith({
        fechaInicio: '2026-08-31',
        fechaFin: '2026-09-30',
        subespecialidadId: 1,
      }),
    )
  })

  it('no consulta si el rango es inválido y muestra el mensaje', async () => {
    renderPagina()
    await esperarCitas()
    expect(obtenerReporteCitasPorEstado).toHaveBeenCalledTimes(1)

    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-08-01' } })

    expect(
      await screen.findByText('La fecha final no puede ser anterior a la fecha inicial.'),
    ).toBeInTheDocument()
    expect(obtenerReporteCitasPorEstado).toHaveBeenCalledTimes(1)
  })

  it('ante un error muestra Reintentar y vuelve a consultar', async () => {
    obtenerReporteCitasPorEstado.mockRejectedValueOnce(new Error('Fallo de red'))
    const user = userEvent.setup()
    renderPagina()

    expect(await screen.findByText('Fallo de red')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await esperarCitas()).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay citas en el rango', async () => {
    obtenerReporteCitasPorEstado.mockResolvedValueOnce({
      fechaInicio: '2026-08-31',
      fechaFin: '2026-09-30',
      total: 0,
      porEstado: {},
    })
    renderPagina()

    expect(await screen.findByText('Sin datos')).toBeInTheDocument()
  })

  it('utilización con capacidad 0 no muestra barra y presenta 0%', async () => {
    obtenerReporteUtilizacionCupos.mockResolvedValueOnce({
      fechaInicio: '2026-08-31',
      fechaFin: '2026-09-30',
      subespecialidadId: null,
      capacidadTotal: 0,
      cuposOcupados: 0,
      cuposDisponibles: 0,
      utilizacionPorcentaje: 0,
    })
    const user = userEvent.setup()
    renderPagina()
    await esperarCitas()

    await user.click(screen.getByRole('tab', { name: 'Utilización' }))

    const reporte = await screen.findByTestId('reporte-utilizacion')
    expect(within(reporte).getByText('0%')).toBeInTheDocument()
    expect(screen.queryByText(/Utilización:/)).not.toBeInTheDocument()
  })

  it('no ofrece exportación ni métricas ficticias', async () => {
    renderPagina()
    await esperarCitas()

    expect(screen.queryByRole('button', { name: /exportar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /excel/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pdf/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /csv/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/balance asistencial/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/horas consultorio/i)).not.toBeInTheDocument()
  })

  it('aplica roving tabindex y navega entre reportes con el teclado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCitas()

    const citas = screen.getByRole('tab', { name: 'Citas por estado' })
    const demanda = screen.getByRole('tab', { name: 'Demanda' })

    expect(citas).toHaveAttribute('tabindex', '0')
    expect(demanda).toHaveAttribute('tabindex', '-1')

    citas.focus()
    await user.keyboard('{ArrowRight}')

    expect(demanda).toHaveFocus()
    expect(demanda).toHaveAttribute('tabindex', '0')
  })
})
