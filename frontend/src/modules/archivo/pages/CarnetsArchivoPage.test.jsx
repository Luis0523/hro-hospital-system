import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'

vi.mock('@/modules/carnets/hooks/useCarnetsRealtime', () => ({
  useCarnetsRealtime: () => {},
}))

vi.mock('@/modules/carnets/api/carnetsApi', () => ({
  listarCarnets: vi.fn(),
  listarEstaciones: vi.fn(() => Promise.resolve([{ id: 1, codigo: 'EST-01', nombre: 'Estación 1' }])),
  listarEspecialidades: vi.fn(() => Promise.resolve([{ id: 1, nombre: 'Pediatría' }])),
  marcarEncontrado: vi.fn(),
  marcarNoLocalizado: vi.fn(),
  despacharCarnet: vi.fn(),
  recibirDevolucionCarnet: vi.fn(),
  ETIQUETAS_ESTADO_CARNET: {
    registrado: 'Registrado',
    encontrado: 'Encontrado',
    no_localizado: 'No localizado',
    despachado: 'Despachado',
    recibido_estacion: 'Recibido en estación',
    devuelto_estacion: 'Devuelto a archivo',
    recibido_archivo: 'Recibido en archivo',
  },
}))

import { listarCarnets, marcarEncontrado } from '@/modules/carnets/api/carnetsApi'
import CarnetsArchivoPage from './CarnetsArchivoPage.jsx'

const carnet = {
  id: 'c-1',
  correlativo: 3,
  especialidadNombre: 'Pediatría',
  numeroExpediente: '837871',
  pacienteNombre: 'Adolfo Ajucum',
  estacionNombre: 'Estación 1',
  estado: 'registrado',
  registradoEn: '2026-10-07T12:00:00-06:00',
  movimientos: [],
}

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/archivo/carnets']}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <CarnetsArchivoPage />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('CarnetsArchivoPage', () => {
  beforeEach(() => {
    localStorage.clear()
    listarCarnets.mockReset()
    marcarEncontrado.mockReset()
  })

  it('muestra los carnets del día con correlativo y estado', async () => {
    listarCarnets.mockResolvedValue([carnet])
    renderPagina()

    expect(await screen.findByText('Adolfo Ajucum')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Registrado')).toBeInTheDocument()
  })

  it('marca encontrado y recarga', async () => {
    const user = userEvent.setup()
    listarCarnets.mockResolvedValue([carnet])
    marcarEncontrado.mockResolvedValue({})
    renderPagina()

    await screen.findByText('Adolfo Ajucum')
    // Tras marcar, la lista recargada puede venir vacía.
    listarCarnets.mockResolvedValue([])
    await user.click(screen.getByRole('button', { name: /encontré/i }))

    await waitFor(() => expect(marcarEncontrado).toHaveBeenCalledWith('c-1'))
  })
})
