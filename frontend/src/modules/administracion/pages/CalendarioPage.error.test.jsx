import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'

vi.mock('../api/administracionApi.js', () => ({
  listarDiasNoLaborablesPorRango: vi.fn().mockRejectedValue(new Error('Servidor no disponible')),
  crearDiaNoLaborable: vi.fn(),
  eliminarDiaNoLaborable: vi.fn(),
}))

import CalendarioPage from './CalendarioPage.jsx'
import { listarDiasNoLaborablesPorRango } from '../api/administracionApi.js'

describe('CalendarioPage — estado de error', () => {
  it('muestra el error de carga y permite reintentar', async () => {
    render(
      <ToastProvider>
        <CalendarioPage />
      </ToastProvider>,
    )

    expect(await screen.findByText('Servidor no disponible')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(listarDiasNoLaborablesPorRango).toHaveBeenCalledTimes(2)
  })
})
