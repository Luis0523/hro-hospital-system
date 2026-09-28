import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ControlLimpiarUltimos from './ControlLimpiarUltimos.jsx'

describe('ControlLimpiarUltimos', () => {
  it('no renderiza nada cuando no es visible', () => {
    const { container } = render(<ControlLimpiarUltimos visible={false} onLimpiar={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('button', { name: /limpiar últimos/i })).not.toBeInTheDocument()
  })

  it('muestra el botón "Limpiar últimos" cuando es visible', () => {
    render(<ControlLimpiarUltimos visible onLimpiar={vi.fn()} />)

    expect(screen.getByRole('button', { name: /limpiar últimos/i })).toBeInTheDocument()
    expect(screen.getByText('Limpiar últimos')).toBeInTheDocument()
  })

  it('expone aria-label accesible', () => {
    render(<ControlLimpiarUltimos visible onLimpiar={vi.fn()} />)

    expect(screen.getByLabelText('Limpiar últimos llamados')).toBeInTheDocument()
  })

  it('llama a onLimpiar al hacer clic', async () => {
    const onLimpiar = vi.fn()
    render(<ControlLimpiarUltimos visible onLimpiar={onLimpiar} />)

    await userEvent.click(screen.getByRole('button', { name: /limpiar últimos/i }))

    expect(onLimpiar).toHaveBeenCalledTimes(1)
  })

  it('conserva la estructura en tema oscuro', () => {
    render(
      <div className="dark">
        <ControlLimpiarUltimos visible onLimpiar={vi.fn()} />
      </div>,
    )

    expect(screen.getByRole('button', { name: /limpiar últimos/i })).toBeInTheDocument()
  })
})
