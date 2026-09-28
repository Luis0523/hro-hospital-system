import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import client from '@/shared/api/client'
import { reiniciarCatalogosMock } from '../api/mockData.js'

// Fija "hoy" para que la fecha del resumen y los próximos días sean deterministas.
vi.mock('../utils/fechas.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, hoyISO: () => '2026-09-01' }
})

// Envuelve funciones API reales en espías para simular error/vacío/cero/reintento.
vi.mock('../api/administracionApi.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    obtenerResumenDashboard: vi.fn(actual.obtenerResumenDashboard),
    listarDiasNoLaborablesFuturos: vi.fn(actual.listarDiasNoLaborablesFuturos),
  }
})

import { listarDiasNoLaborablesFuturos, obtenerResumenDashboard } from '../api/administracionApi.js'
import DashboardPage from './DashboardPage.jsx'

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/administracion']}>
      <Routes>
        <Route path="/administracion" element={<DashboardPage />} />
        <Route path="/administracion/calendario" element={<div>Calendario destino</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

const RESUMEN_CERO = {
  fecha: '2026-09-01',
  totalCitas: 0,
  citasPendientes: 0,
  citasConfirmadas: 0,
  citasAtendidas: 0,
  citasCanceladas: 0,
  citasReprogramadas: 0,
  inasistencias: 0,
  capacidadTotal: 0,
  cuposOcupados: 0,
  cuposDisponibles: 0,
  tasaInasistencia: 0,
  alertas: [],
}

describe('DashboardPage', () => {
  beforeEach(() => {
    reiniciarCatalogosMock()
    obtenerResumenDashboard.mockClear()
    listarDiasNoLaborablesFuturos.mockClear()
  })

  it('consulta el resumen con la fecha local (hoyISO) y muestra la fecha', async () => {
    renderDashboard()

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(await screen.findByText('Resumen del 1 de septiembre de 2026')).toBeInTheDocument()
    expect(obtenerResumenDashboard).toHaveBeenCalledWith('2026-09-01')
  })

  it('muestra las métricas reales del DTO', async () => {
    renderDashboard()
    await screen.findByText('Resumen del 1 de septiembre de 2026')

    const citas = screen.getByTestId('tarjeta-citas')
    expect(within(citas).getByText('42')).toBeInTheDocument()

    const capacidad = screen.getByTestId('tarjeta-capacidad')
    expect(within(capacidad).getByText('60')).toBeInTheDocument()
    expect(within(capacidad).getByText('45')).toBeInTheDocument()
    expect(within(capacidad).getByText('15')).toBeInTheDocument()
    expect(within(capacidad).getByText('Ocupación: 75%')).toBeInTheDocument()

    const inasistencias = screen.getByTestId('tarjeta-inasistencias')
    expect(within(inasistencias).getByText('3')).toBeInTheDocument()
    expect(within(inasistencias).getByText('Tasa de inasistencia: 17.65%')).toBeInTheDocument()
  })

  it('muestra el desglose de estados de cita', async () => {
    renderDashboard()
    await screen.findByText('Resumen del 1 de septiembre de 2026')

    const estados = screen.getByTestId('tarjeta-estados')
    expect(within(estados).getByText('Pendientes')).toBeInTheDocument()
    expect(within(estados).getByText('Confirmadas')).toBeInTheDocument()
    expect(within(estados).getByText('Atendidas')).toBeInTheDocument()
    expect(within(estados).getByText('Canceladas')).toBeInTheDocument()
    expect(within(estados).getByText('Reprogramadas')).toBeInTheDocument()
  })

  it('muestra las alertas con severidad y mensaje, sin exponer el código', async () => {
    renderDashboard()
    await screen.findByText('Resumen del 1 de septiembre de 2026')

    const alertas = screen.getByTestId('tarjeta-alertas')
    expect(within(alertas).getByText('Advertencia')).toBeInTheDocument()
    expect(within(alertas).getByText('Información')).toBeInTheDocument()
    expect(within(alertas).getByText(/capacidad máxima/i)).toBeInTheDocument()
    expect(within(alertas).getByText(/próximos 7 días/i)).toBeInTheDocument()

    expect(screen.queryByText('CUPOS_AGOTADOS')).not.toBeInTheDocument()
    expect(screen.queryByText('DIAS_NO_LABORABLES_PROXIMOS')).not.toBeInTheDocument()
  })

  it('muestra un estado de "sin alertas" cuando alertas es vacío', async () => {
    obtenerResumenDashboard.mockResolvedValueOnce({ ...RESUMEN_CERO, alertas: [] })
    renderDashboard()

    expect(await screen.findByText('Sin alertas administrativas')).toBeInTheDocument()
  })

  it('maneja valores cero sin división inválida', async () => {
    obtenerResumenDashboard.mockResolvedValueOnce(RESUMEN_CERO)
    renderDashboard()

    const inasistencias = await screen.findByTestId('tarjeta-inasistencias')
    expect(within(inasistencias).getByText('Tasa de inasistencia: 0%')).toBeInTheDocument()
    expect(screen.queryByText(/Ocupación:/)).not.toBeInTheDocument()
  })

  it('muestra un estado de carga accesible mientras consulta', () => {
    obtenerResumenDashboard.mockImplementationOnce(() => new Promise(() => {}))
    renderDashboard()

    expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
  })

  it('ante un error muestra el mensaje y Reintentar, conservando la tarjeta de calendario', async () => {
    obtenerResumenDashboard.mockRejectedValueOnce(new Error('Fallo de red'))
    renderDashboard()

    expect(
      await screen.findByText('No se pudo cargar el resumen administrativo'),
    ).toBeInTheDocument()
    expect(screen.getByText('Fallo de red')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.getByTestId('tarjeta-dias-no-laborables')).toBeInTheDocument()
  })

  it('Reintentar vuelve a ejecutar la consulta del resumen', async () => {
    obtenerResumenDashboard.mockRejectedValueOnce(new Error('Fallo de red'))
    const user = userEvent.setup()
    renderDashboard()

    await screen.findByText('No se pudo cargar el resumen administrativo')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Resumen del 1 de septiembre de 2026')).toBeInTheDocument()
    expect(obtenerResumenDashboard).toHaveBeenCalledTimes(2)
  })

  it('conserva la tarjeta real de próximos días no laborables', async () => {
    renderDashboard()

    expect(await screen.findByText('Día de la Independencia Patria')).toBeInTheDocument()
    const lista = within(screen.getByTestId('tarjeta-dias-no-laborables')).getByRole('list')
    expect(within(lista).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByText('Fiesta de Navidad')).not.toBeInTheDocument()
  })

  it('ya no muestra tarjetas de "Pendiente de contrato backend"', async () => {
    renderDashboard()
    await screen.findByText('Resumen del 1 de septiembre de 2026')

    expect(screen.queryByText(/Pendiente de contrato backend/i)).not.toBeInTheDocument()
  })

  it('Ver calendario navega a /administracion/calendario', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await screen.findByText('Día de la Independencia Patria')
    await user.click(screen.getByRole('link', { name: /Ver calendario/i }))

    expect(await screen.findByText('Calendario destino')).toBeInTheDocument()
  })

  it('en modo test no realiza llamadas HTTP reales', async () => {
    const getSpy = vi.spyOn(client, 'get')
    renderDashboard()

    await screen.findByText('Resumen del 1 de septiembre de 2026')
    expect(getSpy).not.toHaveBeenCalled()
    getSpy.mockRestore()
  })

  it('permite consultar una fecha anterior y recarga el resumen sin tocar días no laborables', async () => {
    renderDashboard()
    await screen.findByText('Resumen del 1 de septiembre de 2026')

    const input = screen.getByLabelText('Fecha')
    expect(input).toHaveValue('2026-09-01')
    expect(input).toHaveAttribute('max', '2026-09-01')

    fireEvent.change(input, { target: { value: '2026-08-15' } })

    expect(await screen.findByText('Resumen del 15 de agosto de 2026')).toBeInTheDocument()
    expect(obtenerResumenDashboard).toHaveBeenLastCalledWith('2026-08-15')
    // La tarjeta de próximos días no laborables es independiente de la fecha histórica.
    expect(listarDiasNoLaborablesFuturos).toHaveBeenCalledTimes(1)
  })

  it('no consulta fechas futuras y muestra una validación simple', async () => {
    renderDashboard()
    await screen.findByText('Resumen del 1 de septiembre de 2026')
    expect(obtenerResumenDashboard).toHaveBeenCalledTimes(1)

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-10-01' } })

    expect(await screen.findByText('No se pueden consultar fechas futuras.')).toBeInTheDocument()
    expect(obtenerResumenDashboard).toHaveBeenCalledTimes(1)
  })

  it('el botón Hoy restaura la fecha actual y recarga', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await screen.findByText('Resumen del 1 de septiembre de 2026')

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-08-15' } })
    await screen.findByText('Resumen del 15 de agosto de 2026')

    await user.click(screen.getByRole('button', { name: 'Hoy' }))

    expect(await screen.findByText('Resumen del 1 de septiembre de 2026')).toBeInTheDocument()
    expect(obtenerResumenDashboard).toHaveBeenLastCalledWith('2026-09-01')
  })
})
