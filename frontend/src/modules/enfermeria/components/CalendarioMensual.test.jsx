import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CalendarioMensual from './CalendarioMensual.jsx'

const DIAS = [
  {
    fecha: '2026-11-04',
    cuposDisponibles: 14,
    capacidadMaxima: 30,
    disponible: true,
    noLaborable: false,
  },
  {
    fecha: '2026-11-01',
    cuposDisponibles: 0,
    capacidadMaxima: 0,
    disponible: false,
    noLaborable: true,
  },
]

describe('CalendarioMensual', () => {
  it('muestra el mes y año actuales', () => {
    render(<CalendarioMensual mes={new Date(2026, 10, 1)} dias={DIAS} onSeleccionar={() => {}} />)
    expect(screen.getByText('Noviembre 2026')).toBeInTheDocument()
  })

  it('muestra los cupos disponibles de un día', () => {
    render(<CalendarioMensual mes={new Date(2026, 10, 1)} dias={DIAS} onSeleccionar={() => {}} />)
    expect(screen.getByText('14 cupos')).toBeInTheDocument()
  })

  it('notifica el día seleccionado', async () => {
    const onSeleccionar = vi.fn()
    render(
      <CalendarioMensual mes={new Date(2026, 10, 1)} dias={DIAS} onSeleccionar={onSeleccionar} />,
    )

    await userEvent.click(screen.getByRole('button', { name: /04/ }))

    expect(onSeleccionar).toHaveBeenCalledWith(expect.objectContaining({ fecha: '2026-11-04' }))
  })

  it('llama a onCambiarMes al navegar', async () => {
    const onCambiarMes = vi.fn()
    render(
      <CalendarioMensual
        mes={new Date(2026, 10, 1)}
        dias={DIAS}
        onSeleccionar={() => {}}
        onCambiarMes={onCambiarMes}
      />,
    )

    await userEvent.click(screen.getByLabelText('Mes siguiente'))
    expect(onCambiarMes).toHaveBeenCalledWith(1)
  })
})
