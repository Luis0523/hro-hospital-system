import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ControlVoz from './ControlVoz.jsx'

describe('ControlVoz', () => {
  it('indica que la voz no está disponible y no muestra botón', () => {
    render(<ControlVoz disponible={false} />)

    expect(screen.getByText('Voz no disponible')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('comienza desactivado mostrando "Activar voz"', () => {
    render(<ControlVoz disponible activa={false} />)

    expect(screen.getByRole('button', { name: /activar voz/i })).toBeInTheDocument()
  })

  it('muestra "Voz activa" cuando está activada', () => {
    render(<ControlVoz disponible activa />)

    expect(screen.getByText('Voz activa')).toBeInTheDocument()
  })

  it('llama a onActivar al presionar el botón', async () => {
    const onActivar = vi.fn()
    render(<ControlVoz disponible activa={false} onActivar={onActivar} />)

    await userEvent.click(screen.getByRole('button', { name: /activar voz/i }))

    expect(onActivar).toHaveBeenCalledTimes(1)
  })
})
