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
  salidaArchivoCarnet: vi.fn(),
  descargarSalidaCarnetsPdf: vi.fn(() =>
    Promise.resolve(new Blob(['%PDF'], { type: 'application/pdf' })),
  ),
  descargarSalidaCarnetsPdfPorIds: vi.fn(() =>
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

import { listarCarnets, salidaArchivoCarnet } from '@/modules/carnets/api/carnetsApi'
import SalidaArchivoPage from './SalidaArchivoPage.jsx'

function carnet(id, numeroExpediente, estado = 'registrado') {
  return {
    id,
    correlativo: 1,
    especialidadId: 1,
    especialidadNombre: 'Medicina Interna',
    numeroExpediente,
    pacienteNombre: 'Paciente Prueba',
    estado,
    fecha: '2026-10-12',
    registradoEn: '2026-10-12T10:00:00-06:00',
  }
}

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/archivo/salida']}>
      <ThemeProvider>
        <AuthProvider>
          <EstacionProvider>
            <ToastProvider>
              <SalidaArchivoPage />
            </ToastProvider>
          </EstacionProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

const input = () => screen.getByPlaceholderText(/escriba o escanee/i)

describe('SalidaArchivoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listarCarnets.mockResolvedValue([])
  })

  it('muestra la pantalla de salida de archivo', async () => {
    renderPagina()
    expect(screen.getByRole('heading', { name: 'Salida de archivo' })).toBeInTheDocument()
    expect(await screen.findByText('Pendientes de salida (0)')).toBeInTheDocument()
  })

  it('muestra coincidencias y marca la salida con Enter', async () => {
    const user = userEvent.setup()
    const pendiente = carnet('a', '243032')
    listarCarnets.mockResolvedValue([pendiente])
    salidaArchivoCarnet.mockResolvedValue({ ...pendiente, estado: 'salida_archivo' })

    renderPagina()
    await screen.findByText('Pendientes de salida (1)')

    await user.type(input(), '243032')
    const lista = screen.getByRole('listbox', { name: /coincidencias/i })
    expect(within(lista).getByText('Paciente Prueba')).toBeInTheDocument()

    await user.type(input(), '{Enter}')

    expect(salidaArchivoCarnet).toHaveBeenCalledWith('a')
    expect(input()).toHaveValue('')
    expect(await screen.findByText(/salida registrada/i)).toBeInTheDocument()
  })

  it('avisa cuando no hay coincidencia con el número ingresado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await screen.findByText('Pendientes de salida (0)')

    await user.type(input(), '999999{Enter}')

    expect(await screen.findByText(/sin coincidencia/i)).toBeInTheDocument()
    expect(salidaArchivoCarnet).not.toHaveBeenCalled()
  })
})
