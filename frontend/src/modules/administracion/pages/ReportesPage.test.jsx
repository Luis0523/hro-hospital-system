import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
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
    listarSubespecialidades: vi.fn(actual.listarSubespecialidades),
    obtenerReporteCitasPorEstado: vi.fn(actual.obtenerReporteCitasPorEstado),
    obtenerReporteDemandaPorEspecialidad: vi.fn(actual.obtenerReporteDemandaPorEspecialidad),
    obtenerReporteUtilizacionCupos: vi.fn(actual.obtenerReporteUtilizacionCupos),
  }
})

import {
  listarSubespecialidades,
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
    listarSubespecialidades.mockClear()
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

  it('muestra la utilización de todas las subespecialidades y el total general', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCitas()

    await user.click(screen.getByRole('tab', { name: 'Utilización' }))

    const tabla = await screen.findByTestId('utilizacion-escritorio')
    expect(listarSubespecialidades).toHaveBeenCalledWith(undefined, 'activos')

    // 1 GET global + 1 por cada subespecialidad activa (8 en el mock).
    expect(obtenerReporteUtilizacionCupos).toHaveBeenCalledWith({
      fechaInicio: '2026-08-31',
      fechaFin: '2026-09-30',
    })
    expect(obtenerReporteUtilizacionCupos).toHaveBeenCalledTimes(9)

    // Fila por subespecialidad con valores directos del DTO (sin recalcular).
    expect(within(tabla).getByText('Medicina General')).toBeInTheDocument()
    expect(within(tabla).getByText('600')).toBeInTheDocument()
    expect(within(tabla).getByText('6%')).toBeInTheDocument()

    // TOTAL GENERAL proviene del GET global (2400 / 2%).
    const total = screen.getByTestId('utilizacion-total')
    expect(within(total).getByText('2400')).toBeInTheDocument()
    expect(within(total).getByText('2%')).toBeInTheDocument()

    // Ya no existe el selector individual.
    expect(screen.queryByLabelText('Subespecialidad')).not.toBeInTheDocument()
  })

  it('utilización: error parcial conserva filas y marca la fallida sin ceros', async () => {
    const real = obtenerReporteUtilizacionCupos.getMockImplementation()
    obtenerReporteUtilizacionCupos.mockImplementation((args = {}) =>
      args.subespecialidadId === 2 ? Promise.reject(new Error('fallo puntual')) : real(args),
    )
    const user = userEvent.setup()
    renderPagina()
    await esperarCitas()

    await user.click(screen.getByRole('tab', { name: 'Utilización' }))

    const tabla = await screen.findByTestId('utilizacion-escritorio')
    expect(within(tabla).getByText('Medicina General')).toBeInTheDocument()
    expect(within(tabla).getByText('Cardiología Clínica')).toBeInTheDocument()
    expect(within(tabla).getByText('No se pudo cargar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()

    obtenerReporteUtilizacionCupos.mockImplementation(real)
  })

  it('utilización: sin subespecialidades activas muestra estado vacío', async () => {
    listarSubespecialidades.mockResolvedValueOnce([])
    const user = userEvent.setup()
    renderPagina()
    await esperarCitas()

    await user.click(screen.getByRole('tab', { name: 'Utilización' }))

    expect(await screen.findByText('Sin datos')).toBeInTheDocument()
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
