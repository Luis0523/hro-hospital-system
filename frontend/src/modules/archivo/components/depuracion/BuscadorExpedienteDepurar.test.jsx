import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BuscadorExpedienteDepurar from './BuscadorExpedienteDepurar.jsx'

function renderBuscador(props = {}) {
  return render(
    <BuscadorExpedienteDepurar
      numero=""
      onCambio={() => {}}
      onEnviar={() => {}}
      inputRef={createRef()}
      procesando={false}
      {...props}
    />,
  )
}

describe('BuscadorExpedienteDepurar', () => {
  it('conserva la etiqueta y el campo de número de expediente numérico', () => {
    renderBuscador()

    const input = screen.getByLabelText(/número de expediente/i)
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(input).toHaveAttribute('placeholder', 'Ej. 927581')
    expect(screen.getByRole('button', { name: /^buscar$/i })).toBeInTheDocument()
  })

  it('mantiene un área táctil de 44 px y foco visible en Limpiar', async () => {
    const onCambio = vi.fn()
    const user = userEvent.setup()
    renderBuscador({ numero: '927581', onCambio })

    const limpiar = screen.getByRole('button', { name: /limpiar campo/i })
    expect(limpiar).toHaveClass('h-11', 'w-11')
    expect(limpiar.className).toContain('focus-visible:ring-2')

    await user.click(limpiar)
    expect(onCambio).toHaveBeenCalledWith('')
  })

  it('envía la búsqueda desde el botón', async () => {
    const onEnviar = vi.fn()
    const user = userEvent.setup()
    renderBuscador({ numero: '927581', onEnviar })

    await user.click(screen.getByRole('button', { name: /^buscar$/i }))
    expect(onEnviar).toHaveBeenCalledTimes(1)
  })

  it('expone aria-busy y deshabilita la búsqueda mientras procesa', () => {
    renderBuscador({ numero: '927581', procesando: true })

    expect(screen.getByLabelText(/número de expediente/i)).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: /buscando/i })).toBeDisabled()
  })

  it('alterna a ingreso manual y conserva el guion escrito por el operador', async () => {
    const onCambio = vi.fn()
    const onAlternarModo = vi.fn()
    const user = userEvent.setup()
    const { rerender } = renderBuscador({
      numero: '927581',
      onCambio,
      onAlternarModo,
    })

    await user.click(screen.getByRole('button', { name: /ingreso manual/i }))
    expect(onAlternarModo).toHaveBeenCalledTimes(1)

    rerender(
      <BuscadorExpedienteDepurar
        numero="9275-81"
        onCambio={onCambio}
        onEnviar={() => {}}
        inputRef={createRef()}
        procesando={false}
        manual
        onAlternarModo={onAlternarModo}
      />,
    )

    const input = screen.getByLabelText(/número de expediente/i)
    expect(input).toHaveValue('9275-81')
    expect(screen.getByRole('button', { name: /captura normal/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    fireEvent.change(input, { target: { value: '0012-34' } })
    expect(onCambio).toHaveBeenCalledWith('0012-34')
  })

  it('rechaza letras y guiones inválidos en el ingreso manual', () => {
    const onCambio = vi.fn()
    renderBuscador({ manual: true, onCambio })

    const input = screen.getByLabelText(/número de expediente/i)
    fireEvent.change(input, { target: { value: 'ABC-123' } })
    expect(onCambio).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/solo dígitos/i)

    fireEvent.change(input, { target: { value: '92-75-81' } })
    expect(onCambio).not.toHaveBeenCalled()
  })

  it('no muestra controles de cámara en Depuración', () => {
    renderBuscador()

    expect(screen.queryByRole('button', { name: /escanear con cámara/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/vista de cámara/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cerrar cámara/i })).not.toBeInTheDocument()
  })
})
