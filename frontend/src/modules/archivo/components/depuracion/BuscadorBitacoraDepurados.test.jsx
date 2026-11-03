import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BuscadorBitacoraDepurados from './BuscadorBitacoraDepurados.jsx'

function renderBuscador(props = {}) {
  return render(
    <BuscadorBitacoraDepurados
      valor=""
      onChange={() => {}}
      totalPeriodo={18}
      totalCoincidencias={18}
      {...props}
    />,
  )
}

describe('BuscadorBitacoraDepurados', () => {
  it('muestra el total del período sin búsqueda', () => {
    renderBuscador()

    expect(screen.getByText('18 expedientes en el período')).toBeInTheDocument()
  })

  it('muestra coincidencias y total cuando hay búsqueda', () => {
    renderBuscador({ valor: '9275', totalCoincidencias: 2 })

    expect(screen.getByText('Mostrando 2 de 18 expedientes')).toBeInTheDocument()
  })

  it('normaliza guiones y rechaza letras', () => {
    const onChange = vi.fn()
    renderBuscador({ onChange })
    const input = screen.getByRole('textbox', { name: /buscar en la bitácora/i })

    fireEvent.change(input, { target: { value: '92-75' } })
    expect(onChange).toHaveBeenLastCalledWith('9275')

    fireEvent.change(input, { target: { value: 'ABC' } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('permite limpiar la búsqueda', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderBuscador({ valor: '9275', totalCoincidencias: 1, onChange })

    await user.click(screen.getByRole('button', { name: /limpiar búsqueda/i }))

    expect(onChange).toHaveBeenCalledWith('')
  })
})
