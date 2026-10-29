import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import ReportesArchivoPage from './ReportesArchivoPage.jsx'

vi.mock('../api/dashboardArchivoApi', () => ({
  obtenerEstadisticasJefe: vi.fn(() =>
    Promise.resolve({
      fecha: '2026-10-28',
      totalSalidas: 3,
      totalActivos: 2,
      totalPasivos: 1,
      porEstacion: [
        {
          estacionId: 1,
          estacionNombre: 'Consulta Externa',
          total: 3,
          activos: 2,
          pasivos: 1,
          porEtiqueta: [
            {
              etiqueta: 'Clínica de la Mujer',
              codigo: 'clinica_mujer',
              color: 'rose',
              total: 1,
            },
            { etiqueta: 'Sin etiqueta', codigo: null, color: 'slate', total: 2 },
          ],
        },
      ],
      porEtiqueta: [
        { etiqueta: 'Clínica de la Mujer', codigo: 'clinica_mujer', color: 'rose', total: 1 },
        { etiqueta: 'Sin etiqueta', codigo: null, color: 'slate', total: 2 },
      ],
      porEstado: [],
      cuadernoRojo: {
        fecha: '2026-10-28',
        egresosHospitalarios: 0,
        sobresEmergencia: 0,
        sobresSellados: 0,
        tia: 0,
        registrado: false,
      },
    }),
  ),
}))

vi.mock('../api/salidaArchivoHospitalApi', () => ({
  listarSalidasHospital: vi.fn(() =>
    Promise.resolve([
      {
        id: 's1',
        numeroExpediente: '123456',
        pacienteNombre: 'Ana López',
        clasificacion: 'activo',
        etiqueta: {
          id: 1,
          codigo: 'clinica_mujer',
          nombre: 'Clínica de la Mujer',
          icono: 'female',
          color: 'rose',
        },
        registradoEn: '2026-10-28T14:30:00Z',
      },
      {
        id: 's2',
        numeroExpediente: '654321',
        pacienteNombre: 'Luis Pérez',
        clasificacion: 'pasivo',
        etiqueta: null,
        registradoEn: '2026-10-28T15:00:00Z',
      },
    ]),
  ),
  descargarSalidasHospitalPdf: vi.fn(() => Promise.resolve(new Blob(['pdf']))),
}))

function renderPagina() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <ReportesArchivoPage />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('ReportesArchivoPage', () => {
  it('muestra los totales por etiqueta y las salidas por estación', async () => {
    renderPagina()

    expect(
      await screen.findByRole('heading', { name: /reportes diarios de archivo/i }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /^totales por etiqueta$/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Clínica de la Mujer').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Consulta Externa').length).toBeGreaterThan(0)
    expect(screen.getByText('Ana López')).toBeInTheDocument()
  })

  it('filtra el detalle por expediente o paciente', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByText('Ana López')
    await user.type(screen.getByPlaceholderText(/expediente o paciente/i), 'Luis')

    expect(await screen.findByText('Luis Pérez')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Ana López')).not.toBeInTheDocument())
  })
})
