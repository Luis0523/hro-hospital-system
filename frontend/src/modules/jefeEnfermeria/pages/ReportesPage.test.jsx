import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarSeguimientoMock } from '@/modules/enfermeria/api/seguimientoApi'
import { reiniciarSalidasEnfermeriaArchivoMock } from '@/modules/enfermeria/api/salidaEnfermeriaArchivoApi'
import { reiniciarJefeMock } from '../api/mockData.js'
import ReportesPage from './ReportesPage.jsx'

function renderPagina() {
  return render(
    <ToastProvider>
      <ReportesPage />
    </ToastProvider>,
  )
}

beforeEach(() => {
  reiniciarJefeMock()
  reiniciarSeguimientoMock()
  reiniciarSalidasEnfermeriaArchivoMock()
})

describe('ReportesPage', () => {
  it('muestra las métricas del día y las descargas de PDF', async () => {
    renderPagina()

    expect((await screen.findAllByText('Medicina Interna')).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/pacientes del día/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/^presentaciones$/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/^privados de libertad$/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/^clínica de la mujer$/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/comparación por especialidad/i)).toBeInTheDocument()
    expect(screen.getByText(/reparto por clínica/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /consolidado pdf/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pdf de archivo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /imprimir/i })).toBeInTheDocument()
  })
})
