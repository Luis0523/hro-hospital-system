import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SelectorEspecialidades, { ordenarEspecialidades } from './SelectorEspecialidades.jsx'

const ESPECIALIDADES = [
  { id: 3, nombre: 'Pediatría' },
  { id: 1, nombre: 'Medicina Interna' },
  { id: 2, nombre: 'Cardiología' },
  { id: 4, nombre: 'Traumatología y Ortopedia' },
]

describe('ordenarEspecialidades', () => {
  it('pone Medicina Interna primero y el resto alfabético', () => {
    const orden = ordenarEspecialidades(ESPECIALIDADES).map((e) => e.nombre)
    expect(orden).toEqual([
      'Medicina Interna',
      'Cardiología',
      'Pediatría',
      'Traumatología y Ortopedia',
    ])
  })
})

describe('SelectorEspecialidades', () => {
  it('renderiza un tile por especialidad, con Medicina Interna primero', () => {
    render(<SelectorEspecialidades especialidades={ESPECIALIDADES} value="" onChange={() => {}} />)

    const tiles = screen.getAllByRole('radio')
    expect(tiles).toHaveLength(4)
    expect(tiles[0]).toHaveAccessibleName('Medicina Interna')
  })

  it('selecciona al hacer clic y expone el estado marcado', async () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <SelectorEspecialidades especialidades={ESPECIALIDADES} value="" onChange={onChange} />,
    )

    await userEvent.click(screen.getByRole('radio', { name: 'Cardiología' }))
    expect(onChange).toHaveBeenCalledWith('2')

    rerender(
      <SelectorEspecialidades especialidades={ESPECIALIDADES} value="2" onChange={onChange} />,
    )
    expect(screen.getByRole('radio', { name: 'Cardiología' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('avisa mientras no hay especialidades cargadas', () => {
    render(<SelectorEspecialidades especialidades={[]} value="" onChange={() => {}} />)
    expect(screen.getByText('Cargando especialidades…')).toBeInTheDocument()
  })
})
