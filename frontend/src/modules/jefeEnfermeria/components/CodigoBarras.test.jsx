import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CodigoBarras from './CodigoBarras.jsx'

describe('CodigoBarras', () => {
  it('genera barras Code 39 para un número de expediente', () => {
    const { container } = render(<CodigoBarras valor="837871" />)

    expect(screen.getByRole('img', { name: 'Código de barras 837871' })).toBeInTheDocument()
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(30)
  })

  it('limpia caracteres inválidos y no renderiza sin datos', () => {
    render(<CodigoBarras valor="83-7871!" />)

    expect(screen.getByRole('img', { name: 'Código de barras 83-7871' })).toBeInTheDocument()
  })

  it('no renderiza nada si no hay valor codificable', () => {
    const { container } = render(<CodigoBarras valor="!!!" />)
    expect(container).toBeEmptyDOMElement()
  })
})
