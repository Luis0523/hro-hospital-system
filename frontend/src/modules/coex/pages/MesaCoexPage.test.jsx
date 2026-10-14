import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'

vi.mock('@/modules/carnets/hooks/useCarnetsRealtime', () => ({
  useCarnetsRealtime: () => {},
}))

vi.mock('@/modules/carnets/api/carnetsApi', () => ({
  listarCarnets: vi.fn(() => Promise.resolve([])),
  salidaEnfermeriaCarnet: vi.fn(() => Promise.resolve({})),
  descargarSalidaCarnetsPdf: vi.fn(() => Promise.resolve(new Blob(['%PDF']))),
  descargarSalidaEnfermeriaCarnetsPdf: vi.fn(() => Promise.resolve(new Blob(['%PDF']))),
}))

import { listarCarnets, salidaEnfermeriaCarnet } from '@/modules/carnets/api/carnetsApi'
import MesaCoexPage from './MesaCoexPage.jsx'

function carnet(id, estado) {
  return {
    id,
    correlativo: 1,
    especialidadNombre: 'Medicina Interna',
    especialidadAbreviatura: 'MI',
    numeroExpediente: '927581',
    pacienteNombre: 'Paciente Prueba',
    estado,
    fecha: '2026-10-12',
  }
}

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/coex']}>
      <ThemeProvider>
        <AuthProvider>
          <EstacionProvider>
            <ToastProvider>
              <MesaCoexPage />
            </ToastProvider>
          </EstacionProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('MesaCoexPage (carnets)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listarCarnets.mockResolvedValue([])
  })

  it('renderiza el título y la sección de enfermería', async () => {
    renderPagina()
    expect(await screen.findByRole('heading', { name: 'Mesa COEX' })).toBeInTheDocument()
    expect(screen.getByText('Expedientes en enfermería')).toBeInTheDocument()
  })

  it('lista los carnets con salida de archivo y marca su salida de enfermería', async () => {
    const user = userEvent.setup()
    listarCarnets.mockResolvedValue([
      carnet('a', 'salida_archivo'),
      carnet('b', 'salida_archivo'),
      carnet('c', 'resguardado'),
    ])
    salidaEnfermeriaCarnet.mockResolvedValue(carnet('a', 'salida_enfermeria'))
    renderPagina()

    // Solo los 'salida_archivo' aparecen (2), no el 'resguardado'.
    expect(await screen.findAllByText('9275-81')).toHaveLength(2)
    const botones = await screen.findAllByRole('button', { name: /marcar salida/i })
    expect(botones).toHaveLength(2)

    await user.click(botones[0])
    expect(salidaEnfermeriaCarnet).toHaveBeenCalled()
  })
})
