import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BuscadorBitacoraDepurados from './BuscadorBitacoraDepurados.jsx'

function renderBuscador(props = {}) {
  return render(<BuscadorBitacoraDepurados valor="" onChange={() => {}} {...props} />)
}

describe('BuscadorBitacoraDepurados', () => {
  it('abre el modal desde el botón y enfoca el campo', async () => {
    const user = userEvent.setup()
    renderBuscador()

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /buscar expediente/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/número de expediente/i)).toHaveFocus()
  })

  it('normaliza guiones y rechaza letras sin consultar la API', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderBuscador({ onChange })

    await user.click(screen.getByRole('button', { name: /buscar expediente/i }))
    const input = screen.getByLabelText(/número de expediente/i)

    await user.type(input, '92-75')
    expect(input).toHaveValue('9275')
    expect(onChange).not.toHaveBeenCalled()

    await user.type(input, 'ABC')
    expect(input).toHaveValue('9275')

    await user.click(screen.getByRole('button', { name: /aplicar/i }))
    expect(onChange).toHaveBeenCalledWith('9275')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('permite limpiar el filtro desde el modal', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderBuscador({ valor: '9275', onChange })

    await user.click(screen.getByRole('button', { name: /buscar expediente/i }))
    await user.click(screen.getByRole('button', { name: /limpiar/i }))

    expect(onChange).toHaveBeenCalledWith('')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('muestra un indicador y permite limpiar sin reabrir el campo', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderBuscador({ valor: '9275', onChange })

    expect(screen.getByText('Exp. 9275')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /limpiar búsqueda de expediente/i }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('cierra con Escape sin aplicar cambios', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderBuscador({ onChange })

    await user.click(screen.getByRole('button', { name: /buscar expediente/i }))
    await user.type(screen.getByLabelText(/número de expediente/i), '9275')
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(onChange).not.toHaveBeenCalled()
  })
})
