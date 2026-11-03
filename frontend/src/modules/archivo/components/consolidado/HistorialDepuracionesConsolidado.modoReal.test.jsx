import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'

const { listarDepuraciones, listarDepuracionesEnRango } = vi.hoisted(() => ({
  listarDepuraciones: vi.fn(),
  listarDepuracionesEnRango: vi.fn(),
}))

vi.mock('../../api/depuracionArchivoApi', () => ({
  USANDO_DATOS_MOCK: false,
  listarDepuraciones,
  listarDepuracionesEnRango,
}))

import HistorialDepuracionesConsolidado from './HistorialDepuracionesConsolidado.jsx'

describe('HistorialDepuracionesConsolidado · modo real', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listarDepuraciones.mockResolvedValue([])
    listarDepuracionesEnRango.mockResolvedValue([])
  })

  it('conserva la confirmación para rangos mayores a 31 días sin consultar de más', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <HistorialDepuracionesConsolidado />
      </ToastProvider>,
    )

    await screen.findByText('Aún no hay expedientes depurados hoy')
    expect(listarDepuraciones).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Rango personalizado' }))
    fireEvent.change(screen.getByLabelText('Fecha inicial'), {
      target: { value: '01/01/2026' },
    })
    fireEvent.change(screen.getByLabelText('Fecha final'), {
      target: { value: '31/03/2026' },
    })
    await user.click(screen.getByRole('button', { name: /aplicar rango/i }))

    expect(
      await screen.findByRole('heading', { name: 'Confirmar consulta extensa' }),
    ).toBeInTheDocument()
    expect(listarDepuraciones).toHaveBeenCalledTimes(1)
  })
})
