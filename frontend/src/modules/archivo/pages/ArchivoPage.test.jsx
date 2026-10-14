import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

vi.mock('@/modules/carnets/hooks/useCarnetsRealtime', () => ({
  useCarnetsRealtime: () => {},
}))

vi.mock('@/modules/carnets/api/carnetsApi', () => ({
  listarCarnets: vi.fn(() => Promise.resolve([])),
  listarEstaciones: vi.fn(() => Promise.resolve([])),
  buscarCarnetPorExpediente: vi.fn(),
  marcarNoLocalizado: vi.fn(),
  salidaArchivoCarnet: vi.fn(),
  salidaEnfermeriaCarnet: vi.fn(),
  resguardarCarnet: vi.fn(),
  obtenerCarnet: vi.fn(),
  obtenerConfiguracionArchivo: vi.fn(() => Promise.resolve({ umbralActivo: null })),
  actualizarConfiguracionArchivo: vi.fn(() => Promise.resolve({ umbralActivo: null })),
  obtenerSalidaCarnets: vi.fn(() => Promise.resolve({ fecha: null, total: 0, expedientes: [] })),
  descargarSalidaCarnetsPdf: vi.fn(() =>
    Promise.resolve(new Blob(['%PDF'], { type: 'application/pdf' })),
  ),
  ETIQUETAS_ESTADO_CARNET: {
    registrado: 'Registrado',
    no_localizado: 'No localizado',
    salida_archivo: 'Salida de archivo',
    salida_enfermeria: 'Salida de enfermería',
    resguardado: 'Resguardado en estantería',
  },
}))

import { buscarCarnetPorExpediente, listarCarnets } from '@/modules/carnets/api/carnetsApi'
import ArchivoPage from './ArchivoPage.jsx'

function carnet(id, estado) {
  return {
    id,
    correlativo: 1,
    especialidadId: 1,
    especialidadNombre: 'Medicina Interna',
    especialidadAbreviatura: 'MI',
    numeroExpediente: '927581',
    pacienteNombre: 'Paciente Prueba',
    estado,
    fecha: '2026-10-12',
    registradoEn: '2026-10-12T10:00:00-06:00',
    movimientos: [],
  }
}

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/archivo']}>
      <ThemeProvider>
        <AuthProvider>
          <EstacionProvider>
            <ToastProvider>
              <ArchivoPage />
            </ToastProvider>
          </EstacionProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('ArchivoPage (circuito de carnets)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listarCarnets.mockResolvedValue([])
  })

  it('muestra el resumen del día y el seguimiento de carnets', async () => {
    renderPagina()
    expect(await screen.findByText('Seguimiento de carnets')).toBeInTheDocument()
    expect(screen.getByLabelText('Resumen del día')).toBeInTheDocument()
  })

  it('el resumen del día refleja los carnets (total / pendientes / con salida)', async () => {
    listarCarnets.mockResolvedValue([
      carnet('a', 'registrado'),
      carnet('b', 'no_localizado'),
      carnet('c', 'salida_archivo'),
      carnet('d', 'salida_enfermeria'),
    ])
    renderPagina()

    const resumen = await screen.findByLabelText('Resumen del día')
    await screen.findByText('Seguimiento de carnets')

    expect(within(resumen).getByText('Total del día').closest('li')).toHaveTextContent('4')
    expect(within(resumen).getByText('Pendientes').closest('li')).toHaveTextContent('2')
    expect(within(resumen).getByText('Con salida').closest('li')).toHaveTextContent('2')
  })

  it('busca la trazabilidad por código y la muestra en un panel', async () => {
    const user = userEvent.setup()
    buscarCarnetPorExpediente.mockResolvedValue(carnet('x', 'salida_archivo'))
    renderPagina()

    await user.type(screen.getByLabelText('Buscar expediente por código'), '927581')
    await user.click(screen.getByRole('button', { name: /buscar/i }))

    expect(await screen.findByText('Trazabilidad del expediente')).toBeInTheDocument()
    expect(buscarCarnetPorExpediente).toHaveBeenCalledWith('927581', expect.any(Object))
  })

  it('avisa cuando el expediente no tiene carnet hoy (404)', async () => {
    const user = userEvent.setup()
    buscarCarnetPorExpediente.mockRejectedValue(Object.assign(new Error('no'), { status: 404 }))
    renderPagina()

    await user.type(screen.getByLabelText('Buscar expediente por código'), '000000')
    await user.click(screen.getByRole('button', { name: /buscar/i }))

    expect(await screen.findByText(/no está registrado hoy/i)).toBeInTheDocument()
  })
})
