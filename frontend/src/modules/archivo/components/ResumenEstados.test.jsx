import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResumenEstados from './ResumenEstados.jsx'

describe('ResumenEstados', () => {
  it('muestra el total, los pendientes y los localizados', () => {
    render(<ResumenEstados total={7} pendientes={5} localizados={2} />)

    expect(screen.getByText('Total del día').closest('li')).toHaveTextContent('7')
    expect(screen.getByText('Pendientes').closest('li')).toHaveTextContent('5')
    expect(screen.getByText('Localizados').closest('li')).toHaveTextContent('2')
  })

  it('arranca en cero por defecto', () => {
    render(<ResumenEstados />)

    expect(screen.getByText('Total del día').closest('li')).toHaveTextContent('0')
    expect(screen.getByText('Pendientes').closest('li')).toHaveTextContent('0')
    expect(screen.getByText('Localizados').closest('li')).toHaveTextContent('0')
  })
})
