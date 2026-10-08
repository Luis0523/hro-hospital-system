import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import BloqueExcepciones from './BloqueExcepciones.jsx'

describe('BloqueExcepciones', () => {
  it('destaca los no localizados como excepción', () => {
    render(
      <BloqueExcepciones
        porEstado={[
          { estado: 'entregado', total: 5 },
          { estado: 'no_localizado', total: 2 },
        ]}
      />,
    )

    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent(/no localizado/i)
    expect(alerta).toHaveTextContent('2')
  })

  it('muestra un aviso positivo cuando no hay excepciones', () => {
    render(<BloqueExcepciones porEstado={[{ estado: 'entregado', total: 5 }]} />)

    expect(screen.getByRole('alert')).toHaveTextContent(/sin excepciones/i)
  })
})
