import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FiltrosBitacoraDepurados from './FiltrosBitacoraDepurados.jsx'

const PROPS = {
  filtroSeleccionado: 'hoy',
  filtroActivo: 'hoy',
  etiquetaActiva: 'Hoy, 2 de noviembre de 2026',
  rango: { desde: '2026-11-02', hasta: '2026-11-02' },
  errorRango: null,
  onSeleccionar: () => {},
  onCambiarRango: () => {},
  onAplicarRango: () => {},
  onRestablecerRango: () => {},
}

function renderFiltros(props = {}) {
  return render(<FiltrosBitacoraDepurados {...PROPS} {...props} />)
}

describe('FiltrosBitacoraDepurados', () => {
  it('muestra solo Hoy, semana y rango, sin Este mes, y distingue el activo', () => {
    renderFiltros()

    expect(screen.getByRole('button', { name: 'Hoy' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Esta semana' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.queryByRole('button', { name: 'Este mes' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rango personalizado' })).toBeInTheDocument()
    expect(screen.getAllByRole('group')[0].querySelectorAll('button')).toHaveLength(3)
    expect(screen.getByText('Vista:')).toBeInTheDocument()
    expect(screen.getByText('Hoy, 2 de noviembre de 2026')).toBeInTheDocument()
  })

  it('notifica la selección de un período', async () => {
    const onSeleccionar = vi.fn()
    const user = userEvent.setup()
    renderFiltros({ onSeleccionar })

    await user.click(screen.getByRole('button', { name: 'Esta semana' }))

    expect(onSeleccionar).toHaveBeenCalledWith('semana')
  })

  it('muestra los campos y acciones solo para rango personalizado', async () => {
    const onAplicarRango = vi.fn()
    const onRestablecerRango = vi.fn()
    const user = userEvent.setup()
    const { rerender } = renderFiltros()

    expect(screen.queryByLabelText('Fecha inicial')).not.toBeInTheDocument()

    rerender(
      <FiltrosBitacoraDepurados
        {...PROPS}
        filtroSeleccionado="personalizado"
        rango={{ desde: '2026-11-01', hasta: '2026-11-02' }}
        onAplicarRango={onAplicarRango}
        onRestablecerRango={onRestablecerRango}
      />,
    )

    expect(screen.getByLabelText('Fecha inicial')).toHaveValue('01/11/2026')
    expect(screen.getByLabelText('Fecha final')).toHaveValue('02/11/2026')
    expect(screen.getByText('Mostrando:')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /aplicar rango/i }))
    await user.click(screen.getByRole('button', { name: /restablecer/i }))

    expect(onAplicarRango).toHaveBeenCalledTimes(1)
    expect(onRestablecerRango).toHaveBeenCalledTimes(1)
  })

  it('propaga los cambios de fecha sin consultar por cada pulsación', () => {
    const onCambiarRango = vi.fn()
    renderFiltros({
      filtroSeleccionado: 'personalizado',
      onCambiarRango,
    })

    fireEvent.change(screen.getByLabelText('Fecha inicial'), {
      target: { value: '01/11/2026' },
    })
    fireEvent.change(screen.getByLabelText('Fecha final'), {
      target: { value: '05/11/2026' },
    })

    expect(onCambiarRango).toHaveBeenCalledWith('desde', '2026-11-01')
    expect(onCambiarRango).toHaveBeenCalledWith('hasta', '2026-11-05')
  })

  it('muestra el error de validación y lo asocia a los campos', () => {
    renderFiltros({
      filtroSeleccionado: 'personalizado',
      errorRango: 'La fecha inicial no puede ser posterior a la fecha final.',
    })

    expect(
      screen.getByText('La fecha inicial no puede ser posterior a la fecha final.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha inicial')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Fecha final')).toHaveAttribute(
      'aria-describedby',
      'rango-personalizado-error',
    )
  })
})
