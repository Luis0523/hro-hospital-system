import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResumenEstados from './ResumenEstados.jsx'

describe('ResumenEstados', () => {
  it('muestra el total y el conteo por estado, incluida la excepción', () => {
    render(
      <ResumenEstados
        total={4}
        resumen={{
          pendiente_localizar: 2,
          en_busqueda: 0,
          localizado: 0,
          en_transito: 1,
          entregado: 0,
          no_localizado: 1,
        }}
      />,
    )

    expect(screen.getByText('4 expedientes')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de localizar').closest('li')).toHaveTextContent('2')
    expect(screen.getByText('En tránsito').closest('li')).toHaveTextContent('1')
    expect(screen.getByText('No localizado').closest('li')).toHaveTextContent('1')
  })

  it('muestra todos los estados en cero por defecto', () => {
    render(<ResumenEstados total={0} />)

    expect(screen.getByText('0 expedientes')).toBeInTheDocument()
    expect(screen.getByText('Entregado').closest('li')).toHaveTextContent('0')
    expect(screen.getByText('No localizado').closest('li')).toHaveTextContent('0')
  })
})
