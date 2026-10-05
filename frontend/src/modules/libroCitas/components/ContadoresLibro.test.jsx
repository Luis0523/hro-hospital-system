import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import ContadoresLibro from './ContadoresLibro.jsx'
import { CONTADORES_INICIALES } from '../utils/contadores'

function Wrapper({ onChange } = {}) {
  const [valores, setValores] = useState(CONTADORES_INICIALES)
  return (
    <ContadoresLibro
      valores={valores}
      onChange={(clave, valor) => {
        setValores((actuales) => ({ ...actuales, [clave]: valor }))
        onChange?.(clave, valor)
      }}
    />
  )
}

const campo = (nombre) => screen.getByRole('spinbutton', { name: nombre })
const total = () => screen.getByTestId('total-contadores')

const NOMBRES = [
  'Historias Archivadas',
  'Egresos Hospitalarios',
  'Historias Desactivadas por Trabajo',
  'Historias Desactivadas por Consulta',
  'Sobres',
  'Historias Revisadas',
  'Historias Depuradas',
  'Tarjetas Índices Archivadas',
]

describe('ContadoresLibro', () => {
  it('renderiza exactamente 8 contadores', () => {
    render(<Wrapper />)

    expect(screen.getAllByRole('spinbutton')).toHaveLength(8)
  })

  it('muestra sigla y nombre completo de cada contador', () => {
    render(<Wrapper />)

    for (const nombre of NOMBRES) {
      expect(screen.getByRole('spinbutton', { name: nombre })).toBeInTheDocument()
      expect(screen.getAllByText(nombre).length).toBeGreaterThan(0)
    }
    expect(screen.getByText('H.A.')).toBeInTheDocument()
    expect(screen.getByText('T.I.A.')).toBeInTheDocument()
  })

  it('"Sobres" aparece una sola vez como contador', () => {
    render(<Wrapper />)

    expect(screen.getAllByRole('spinbutton', { name: 'Sobres' })).toHaveLength(1)
  })

  it('todos inician visualmente en 0', () => {
    render(<Wrapper />)

    for (const nombre of NOMBRES) {
      expect(campo(nombre)).toHaveValue(0)
    }
  })

  it('los inputs tienen min=0 y step=1', () => {
    render(<Wrapper />)

    for (const nombre of NOMBRES) {
      expect(campo(nombre)).toHaveAttribute('min', '0')
      expect(campo(nombre)).toHaveAttribute('step', '1')
    }
  })

  it('cambiar un contador llama onChange con la clave y el entero normalizado', () => {
    const onChange = vi.fn()
    render(<Wrapper onChange={onChange} />)

    fireEvent.change(campo('Historias Archivadas'), { target: { value: '3' } })

    expect(onChange).toHaveBeenCalledWith('ha', 3)
  })

  it('no mantiene valores negativos en el modelo', () => {
    render(<Wrapper />)

    fireEvent.change(campo('Egresos Hospitalarios'), { target: { value: '-5' } })

    expect(campo('Egresos Hospitalarios')).toHaveValue(0)
    expect(total()).toHaveTextContent('0')
  })

  it('no mantiene decimales en el modelo', () => {
    render(<Wrapper />)

    fireEvent.change(campo('Historias Revisadas'), { target: { value: '2.7' } })

    expect(campo('Historias Revisadas')).toHaveValue(2)
  })

  it('Total inicia en 0', () => {
    render(<Wrapper />)

    expect(total()).toHaveTextContent('0')
  })

  it('Total se actualiza al modificar varios contadores', () => {
    render(<Wrapper />)

    fireEvent.change(campo('Historias Archivadas'), { target: { value: '3' } })
    fireEvent.change(campo('Egresos Hospitalarios'), { target: { value: '2' } })
    fireEvent.change(campo('Sobres'), { target: { value: '4' } })

    expect(total()).toHaveTextContent('9')
  })

  it('Total NO es editable (no es un input)', () => {
    render(<Wrapper />)

    expect(total().tagName).not.toBe('INPUT')
    expect(screen.queryByRole('spinbutton', { name: 'Total' })).not.toBeInTheDocument()
  })

  it('no aparecen categorías adicionales', () => {
    render(<Wrapper />)

    const nombres = screen.getAllByRole('spinbutton').map((input) => input.getAttribute('name'))
    expect(new Set(nombres).size).toBe(8)
    expect(screen.getAllByRole('spinbutton')).toHaveLength(8)
  })
})
