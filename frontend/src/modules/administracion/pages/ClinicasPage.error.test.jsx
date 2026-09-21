import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'

vi.mock('../api/administracionApi.js', () => ({
  listarEspecialidades: vi.fn().mockRejectedValue(new Error('Servidor no disponible')),
  listarSubespecialidades: vi.fn().mockResolvedValue([]),
  listarEspaciosFisicos: vi.fn().mockResolvedValue([]),
  crearEspecialidad: vi.fn(),
  actualizarEspecialidad: vi.fn(),
  desactivarEspecialidad: vi.fn(),
  crearSubespecialidad: vi.fn(),
  actualizarSubespecialidad: vi.fn(),
  desactivarSubespecialidad: vi.fn(),
  crearEspacioFisico: vi.fn(),
  actualizarEspacioFisico: vi.fn(),
  desactivarEspacioFisico: vi.fn(),
}))

import ClinicasPage from './ClinicasPage.jsx'
import { listarEspecialidades } from '../api/administracionApi.js'

describe('ClinicasPage — estado de error', () => {
  it('muestra el error de carga y permite reintentar', async () => {
    render(
      <ToastProvider>
        <ClinicasPage />
      </ToastProvider>,
    )

    expect(await screen.findByText('Servidor no disponible')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(listarEspecialidades).toHaveBeenCalledTimes(2)
  })
})
