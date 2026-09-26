import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ControlTema from './ControlTema.jsx'

describe('ControlTema', () => {
  it('en tema claro ofrece "Modo oscuro" con icono dark_mode', () => {
    render(<ControlTema tema="light" />)

    expect(screen.getByRole('button', { name: 'Modo oscuro' })).toBeInTheDocument()
    expect(screen.getByText('dark_mode')).toBeInTheDocument()
  })

  it('en tema oscuro ofrece "Modo claro" con icono light_mode', () => {
    render(<ControlTema tema="dark" />)

    expect(screen.getByRole('button', { name: 'Modo claro' })).toBeInTheDocument()
    expect(screen.getByText('light_mode')).toBeInTheDocument()
  })

  it('llama a onAlternar al hacer clic', async () => {
    const onAlternar = vi.fn()
    render(<ControlTema tema="light" onAlternar={onAlternar} />)

    await userEvent.click(screen.getByRole('button', { name: 'Modo oscuro' }))

    expect(onAlternar).toHaveBeenCalledTimes(1)
  })
})
