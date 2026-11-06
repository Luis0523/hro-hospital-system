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
      onEnviar={() => true}
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
    expect(screen.getByRole('button', { name: /buscar y depurar/i })).toBeInTheDocument()
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

  it('envía el expediente desde el botón y limpia el campo al aceptarse', async () => {
    const onEnviar = vi.fn(() => true)
    const onCambio = vi.fn()
    const user = userEvent.setup()
    renderBuscador({ numero: '927581', onEnviar, onCambio })

    await user.click(screen.getByRole('button', { name: /buscar y depurar/i }))
    expect(onEnviar).toHaveBeenCalledWith('927581')
    expect(onCambio).toHaveBeenCalledWith('')
  })

  it('no limpia el campo si el envío no se acepta', async () => {
    const onEnviar = vi.fn(() => false)
    const onCambio = vi.fn()
    const user = userEvent.setup()
    renderBuscador({ numero: 'ABC', onEnviar, onCambio })

    await user.click(screen.getByRole('button', { name: /buscar y depurar/i }))
    expect(onEnviar).toHaveBeenCalledWith('ABC')
    expect(onCambio).not.toHaveBeenCalled()
  })

  it('envía con Enter sin consultar mientras se escribe', async () => {
    const onEnviar = vi.fn(() => true)
    const onCambio = vi.fn()
    renderBuscador({ numero: '927581', onEnviar, onCambio })

    const input = screen.getByLabelText(/número de expediente/i)
    fireEvent.change(input, { target: { value: '9275810' } })
    expect(onEnviar).not.toHaveBeenCalled()

    fireEvent.submit(input.closest('form'))
    expect(onEnviar).toHaveBeenCalledWith('927581')
  })

  it('expone aria-busy y mantiene el botón disponible para la cola', () => {
    renderBuscador({ numero: '927581', procesando: true })

    expect(screen.getByLabelText(/número de expediente/i)).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: /depurando/i })).toBeEnabled()
  })

  it('muestra el aviso de formato sin bloquear la escritura', () => {
    const onCambio = vi.fn()
    renderBuscador({
      aviso: 'Use solo dígitos; el guion se agrega automáticamente.',
      onCambio,
    })

    expect(screen.getByRole('alert')).toHaveTextContent(/solo dígitos/i)
    fireEvent.change(screen.getByLabelText(/número de expediente/i), {
      target: { value: 'ABC123' },
    })
    expect(onCambio).toHaveBeenCalledWith('ABC123')
  })

  it('no muestra controles de cámara en Depuración', () => {
    renderBuscador()

    expect(screen.queryByRole('button', { name: /escanear con cámara/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/vista de cámara/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cerrar cámara/i })).not.toBeInTheDocument()
  })
})
