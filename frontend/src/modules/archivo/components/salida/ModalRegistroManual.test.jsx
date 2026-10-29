import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalRegistroManual from './ModalRegistroManual.jsx'

describe('ModalRegistroManual', () => {
  it('registra el número y el nombre escritos por el operador', async () => {
    const user = userEvent.setup()
    const onGuardar = vi.fn(() => Promise.resolve({ id: 'm-1' }))
    const onRegistrado = vi.fn()

    render(
      <ModalRegistroManual
        abierto
        onCerrar={() => {}}
        onGuardar={onGuardar}
        onRegistrado={onRegistrado}
      />,
    )

    await user.type(screen.getByLabelText(/número de expediente/i), '123456')
    await user.type(screen.getByLabelText(/nombre completo/i), '  Juan Pérez  ')
    await user.click(screen.getByRole('button', { name: /^registrar$/i }))

    await waitFor(() =>
      expect(onGuardar).toHaveBeenCalledWith({
        numeroExpediente: '123456',
        pacienteNombre: 'Juan Pérez',
      }),
    )
    expect(onRegistrado).toHaveBeenCalled()
  })

  it('muestra el conflicto cuando el expediente ya está en el listado', async () => {
    const user = userEvent.setup()
    const onGuardar = vi.fn(() =>
      Promise.reject(Object.assign(new Error('Duplicado'), { status: 409 })),
    )

    render(<ModalRegistroManual abierto onCerrar={() => {}} onGuardar={onGuardar} />)

    await user.type(screen.getByLabelText(/número de expediente/i), '123456')
    await user.type(screen.getByLabelText(/nombre completo/i), 'Juan Pérez')
    await user.click(screen.getByRole('button', { name: /^registrar$/i }))

    expect(await screen.findByText(/ya está registrado en esta estación/i)).toBeInTheDocument()
  })
})
