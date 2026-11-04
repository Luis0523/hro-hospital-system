import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { valoresIniciales } from '../cuadernoRojoCampos'
import CuadernoRojoFormulario from './CuadernoRojoFormulario.jsx'

function props(extra = {}) {
  return {
    valores: { ...valoresIniciales(), fecha: '2026-11-03' },
    errores: {},
    tocados: {},
    existente: false,
    cargandoDia: false,
    guardando: false,
    onCambiar: vi.fn(),
    onBlur: vi.fn(),
    onGuardar: vi.fn(),
    ...extra,
  }
}

describe('CuadernoRojoFormulario', () => {
  it('muestra las cuatro cantidades y la fecha con etiquetas completas', () => {
    render(<CuadernoRojoFormulario {...props()} />)

    expect(screen.getByLabelText(/^Fecha del registro/)).toBeInTheDocument()
    expect(screen.getByLabelText('Egresos hospitalarios')).toBeInTheDocument()
    expect(screen.getByLabelText('Sobres emergencia')).toBeInTheDocument()
    expect(screen.getByLabelText('Sobres sellados')).toBeInTheDocument()
    expect(screen.getByLabelText('TIA')).toBeInTheDocument()
  })

  it('muestra Guardar registro en estado nuevo', () => {
    render(<CuadernoRojoFormulario {...props()} />)

    expect(screen.getByRole('button', { name: /guardar registro/i })).toBeInTheDocument()
    expect(screen.queryByText('Se actualizará el registro existente.')).not.toBeInTheDocument()
  })

  it('muestra Actualizar registro y la nota de actualización en estado existente', () => {
    render(<CuadernoRojoFormulario {...props({ existente: true })} />)

    expect(screen.getByRole('button', { name: /actualizar registro/i })).toBeInTheDocument()
    expect(screen.getByText('Se actualizará el registro existente.')).toBeInTheDocument()
  })

  it('bloquea las cantidades mientras consulta el día', () => {
    render(<CuadernoRojoFormulario {...props({ cargandoDia: true })} />)

    expect(screen.getByLabelText('Egresos hospitalarios')).toBeDisabled()
    expect(screen.getByLabelText('Sobres emergencia')).toBeDisabled()
    expect(screen.getByLabelText('Sobres sellados')).toBeDisabled()
    expect(screen.getByLabelText('TIA')).toBeDisabled()
    expect(screen.getByLabelText(/^Fecha del registro/)).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /guardar registro/i })).toBeDisabled()
  })

  it('bloquea fecha y cantidades mientras guarda', () => {
    render(<CuadernoRojoFormulario {...props({ guardando: true })} />)

    expect(screen.getByLabelText(/^Fecha del registro/)).toBeDisabled()
    expect(screen.getByLabelText('TIA')).toBeDisabled()
  })

  it('envía una sola vez al enviar el formulario', () => {
    const onGuardar = vi.fn()
    const { container } = render(<CuadernoRojoFormulario {...props({ onGuardar })} />)

    fireEvent.submit(container.querySelector('form'))

    expect(onGuardar).toHaveBeenCalledTimes(1)
  })

  it('envía el formulario al presionar Enter en una cantidad', async () => {
    const onGuardar = vi.fn()
    const user = userEvent.setup()
    render(<CuadernoRojoFormulario {...props({ onGuardar })} />)

    await user.click(screen.getByLabelText('TIA'))
    await user.keyboard('{Enter}')

    expect(onGuardar).toHaveBeenCalledTimes(1)
  })
})
