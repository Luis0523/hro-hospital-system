import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import GraficaEstados from './GraficaEstados.jsx'

const POR_ESTADO = [
  { estado: 'no_localizado', total: 2 },
  { estado: 'entregado', total: 12 },
  { estado: 'en_busqueda', total: 5 },
  { estado: 'pendiente_localizar', total: 3 },
]

describe('GraficaEstados', () => {
  it('respeta el orden de ORDEN_ESTADOS con no_localizado al final', () => {
    render(<GraficaEstados porEstado={POR_ESTADO} />)

    const etiquetas = screen
      .getAllByRole('listitem')
      .map((item) => item.querySelector('.truncate')?.textContent)

    expect(etiquetas).toEqual([
      'Pendiente de localizar',
      'En búsqueda',
      'Entregado',
      'No localizado',
    ])
  })

  it('usa las etiquetas de metadatosEstado y expone alternativa textual por barra', () => {
    render(<GraficaEstados porEstado={POR_ESTADO} />)

    expect(screen.getByRole('img', { name: /En búsqueda: 5 expedientes/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /No localizado: 2 expedientes/ })).toBeInTheDocument()
  })

  it('no renderiza nada sin datos', () => {
    const { container } = render(<GraficaEstados porEstado={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
