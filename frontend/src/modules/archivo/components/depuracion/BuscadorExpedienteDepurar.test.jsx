import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BuscadorExpedienteDepurar from './BuscadorExpedienteDepurar.jsx'

function escanerMock(overrides = {}) {
  return {
    activo: false,
    error: null,
    videoRef: createRef(),
    iniciar: vi.fn(),
    detener: vi.fn(),
    ...overrides,
  }
}

function renderBuscador(props = {}) {
  return render(
    <BuscadorExpedienteDepurar
      numero=""
      onCambio={() => {}}
      onEnviar={() => {}}
      inputRef={createRef()}
      procesando={false}
      escaner={escanerMock()}
      {...props}
    />,
  )
}

describe('BuscadorExpedienteDepurar', () => {
  it('conserva la etiqueta y el campo de número de expediente', () => {
    renderBuscador()

    expect(screen.getByLabelText(/número de expediente/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /buscar expediente/i })).toBeInTheDocument()
  })

  it('mantiene un área táctil de 44 px y foco visible en Limpiar', async () => {
    const onCambio = vi.fn()
    const user = userEvent.setup()
    renderBuscador({ numero: 'EXP-2024-035', onCambio })

    const limpiar = screen.getByRole('button', { name: /limpiar campo/i })
    expect(limpiar).toHaveClass('h-11', 'w-11')
    expect(limpiar.className).toContain('focus-visible:ring-2')

    await user.click(limpiar)
    expect(onCambio).toHaveBeenCalledWith('')
  })

  it('envía la búsqueda desde el botón', async () => {
    const onEnviar = vi.fn()
    const user = userEvent.setup()
    renderBuscador({ numero: 'EXP-2024-035', onEnviar })

    await user.click(screen.getByRole('button', { name: /buscar expediente/i }))
    expect(onEnviar).toHaveBeenCalledTimes(1)
  })

  it('expone aria-busy y deshabilita la búsqueda mientras procesa', () => {
    renderBuscador({ numero: 'EXP-2024-035', procesando: true })

    expect(screen.getByLabelText(/número de expediente/i)).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: /buscando/i })).toBeDisabled()
  })

  it('abre y cierra la cámara mediante sus controles', async () => {
    const iniciar = vi.fn()
    const detener = vi.fn()
    const user = userEvent.setup()

    const { rerender } = renderBuscador({ escaner: escanerMock({ iniciar }) })
    await user.click(screen.getByRole('button', { name: /escanear con cámara/i }))
    expect(iniciar).toHaveBeenCalledTimes(1)

    rerender(
      <BuscadorExpedienteDepurar
        numero=""
        onCambio={() => {}}
        onEnviar={() => {}}
        inputRef={createRef()}
        procesando={false}
        escaner={escanerMock({ activo: true, detener })}
      />,
    )
    expect(screen.getByLabelText(/vista de cámara/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /cerrar cámara/i }))
    expect(detener).toHaveBeenCalledTimes(1)
  })
})
