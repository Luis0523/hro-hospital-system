import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import client from '@/shared/api/client'
import { reiniciarCatalogosMock } from '../api/mockData.js'

// Fija "hoy" para que los próximos días del mock sean deterministas.
vi.mock('../utils/fechas.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, hoyISO: () => '2026-09-01' }
})

// Envuelve la función API real en un espía para poder simular error/vacío/reintento.
vi.mock('../api/administracionApi.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    listarDiasNoLaborablesFuturos: vi.fn(actual.listarDiasNoLaborablesFuturos),
  }
})

import { listarDiasNoLaborablesFuturos } from '../api/administracionApi.js'
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

describe('DashboardPage', () => {
  beforeEach(() => {
    reiniciarCatalogosMock()
    listarDiasNoLaborablesFuturos.mockClear()
  })

  it('renderiza el dashboard con las tarjetas pendientes y la institucional', async () => {
    renderDashboard()

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Citas del día' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cupos disponibles' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Inasistencias' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Alertas administrativas' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Próximos días no laborables' })).toBeInTheDocument()

    await screen.findByText('Día de la Independencia Patria')
  })

  it('las cuatro tarjetas pendientes lo indican y no contienen cifras ficticias', async () => {
    renderDashboard()

    const pendientes = screen.getAllByTestId('tarjeta-pendiente')
    expect(pendientes).toHaveLength(4)

    pendientes.forEach((tarjeta) => {
      expect(within(tarjeta).getByText('Pendiente de contrato backend')).toBeInTheDocument()
      expect(tarjeta.textContent).not.toMatch(/\d/)
    })

    await screen.findByText('Día de la Independencia Patria')
  })

  it('muestra un estado de carga accesible mientras consulta', () => {
    listarDiasNoLaborablesFuturos.mockImplementationOnce(() => new Promise(() => {}))
    renderDashboard()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('muestra fecha y motivo de los próximos días devueltos por el mock', async () => {
    renderDashboard()

    expect(await screen.findByText('15 de septiembre de 2026')).toBeInTheDocument()
    expect(screen.getByText('Día de la Independencia Patria')).toBeInTheDocument()
    expect(screen.getByText('Día de la Revolución de Octubre')).toBeInTheDocument()
  })

  it('muestra como máximo tres próximos días', async () => {
    renderDashboard()

    await screen.findByText('15 de septiembre de 2026')
    const lista = screen.getByRole('list')
    expect(within(lista).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByText('Fiesta de Navidad')).not.toBeInTheDocument()
  })

  it('muestra el mensaje de vacío cuando no hay próximos días', async () => {
    listarDiasNoLaborablesFuturos.mockResolvedValueOnce([])
    renderDashboard()

    expect(
      await screen.findByText('No hay próximos días no laborables registrados.'),
    ).toBeInTheDocument()
  })

  it('ante un error muestra el mensaje y Reintentar sin ocultar las demás tarjetas', async () => {
    listarDiasNoLaborablesFuturos.mockRejectedValueOnce(new Error('Fallo de red'))
    renderDashboard()

    expect(
      await screen.findByText('No se pudieron cargar los días no laborables'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.getAllByTestId('tarjeta-pendiente')).toHaveLength(4)
    expect(screen.getByRole('heading', { name: 'Citas del día' })).toBeInTheDocument()
  })

  it('Reintentar vuelve a ejecutar la consulta', async () => {
    listarDiasNoLaborablesFuturos
      .mockRejectedValueOnce(new Error('Fallo de red'))
      .mockResolvedValueOnce([
        { id: 99, fecha: '2026-10-20', motivo: 'Día de la Revolución de Octubre' },
      ])
    const user = userEvent.setup()
    renderDashboard()

    await screen.findByText('No se pudieron cargar los días no laborables')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Día de la Revolución de Octubre')).toBeInTheDocument()
    expect(listarDiasNoLaborablesFuturos).toHaveBeenCalledTimes(2)
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

    await screen.findByText('Día de la Independencia Patria')
    expect(getSpy).not.toHaveBeenCalled()
    getSpy.mockRestore()
  })
})
