import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import EncabezadoTablero from './EncabezadoTablero.jsx'

describe('EncabezadoTablero', () => {
  it('muestra el branding institucional', () => {
    render(<EncabezadoTablero />)

    expect(screen.getByText('Hospital Regional de Occidente')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /consulta externa · turnos/i })).toBeInTheDocument()
  })

  it('muestra la hora y la fecha en la fila superior', () => {
    render(<EncabezadoTablero />)

    const reloj = screen.getByTestId('encabezado-reloj')
    expect(reloj.querySelectorAll('p')).toHaveLength(2)
    expect(reloj.textContent).toMatch(/\d{1,2}:\d{2}/)
    expect(screen.getByTestId('encabezado-marca')).toBeInTheDocument()
  })

  it('renderiza los children dentro de la fila de controles', () => {
    render(
      <EncabezadoTablero>
        <button type="button">Modo oscuro</button>
        <button type="button">Pantalla completa</button>
      </EncabezadoTablero>,
    )

    const controles = screen.getByTestId('encabezado-controles')
    expect(within(controles).getByRole('button', { name: 'Modo oscuro' })).toBeInTheDocument()
    expect(
      within(controles).getByRole('button', { name: 'Pantalla completa' }),
    ).toBeInTheDocument()
  })

  it('no rompe el render dentro de un contenedor dark', () => {
    render(
      <div className="dark">
        <EncabezadoTablero>
          <span>control</span>
        </EncabezadoTablero>
      </div>,
    )

    expect(screen.getByText('Hospital Regional de Occidente')).toBeInTheDocument()
    expect(screen.getByText('control')).toBeInTheDocument()
  })
})
