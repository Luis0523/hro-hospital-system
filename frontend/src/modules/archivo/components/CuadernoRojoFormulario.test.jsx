import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { valoresIniciales } from '../cuadernoRojoCampos'
import CuadernoRojoFormulario from './CuadernoRojoFormulario.jsx'

function props(extra = {}) {
  return {
    valores: { ...valoresIniciales(), fecha: '2026-11-03' },
    errores: {},
    tocados: {},
    onCambiar: vi.fn(),
    onBlur: vi.fn(),
    onGuardar: vi.fn(),
    formId: 'form-test',
    ...extra,
  }
}

describe('CuadernoRojoFormulario', () => {
  it('muestra la fecha y las cuatro cantidades con etiquetas completas', () => {
    render(<CuadernoRojoFormulario {...props()} />)

    expect(screen.getByLabelText(/^Fecha del registro/)).toBeInTheDocument()
    expect(screen.getByLabelText('Egresos hospitalarios')).toBeInTheDocument()
    expect(screen.getByLabelText('Sobres emergencia')).toBeInTheDocument()
    expect(screen.getByLabelText('Sobres sellados')).toBeInTheDocument()
    expect(screen.getByLabelText('TIA')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('envía el formulario al hacer submit', () => {
    const onGuardar = vi.fn()
    const { container } = render(<CuadernoRojoFormulario {...props({ onGuardar })} />)

    fireEvent.submit(container.querySelector('form'))

    expect(onGuardar).toHaveBeenCalledTimes(1)
  })

  it('bloquea la fecha cuando se edita un registro', () => {
    render(<CuadernoRojoFormulario {...props({ bloquearFecha: true })} />)

    expect(screen.getByLabelText(/^Fecha del registro/)).toBeDisabled()
    expect(screen.getByText('La fecha del registro no cambia al editarlo.')).toBeInTheDocument()
  })

  it('bloquea cantidades durante la consulta y todo durante el guardado', () => {
    const { rerender } = render(<CuadernoRojoFormulario {...props({ cargandoDia: true })} />)
    expect(screen.getByLabelText(/^Fecha del registro/)).not.toBeDisabled()
    expect(screen.getByLabelText('Egresos hospitalarios')).toBeDisabled()

    rerender(<CuadernoRojoFormulario {...props({ guardando: true })} />)
    expect(screen.getByLabelText(/^Fecha del registro/)).toBeDisabled()
    expect(screen.getByLabelText('TIA')).toBeDisabled()
  })
})
