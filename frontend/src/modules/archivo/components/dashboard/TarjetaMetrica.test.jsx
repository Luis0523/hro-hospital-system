import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import TarjetaMetrica from './TarjetaMetrica.jsx'

describe('TarjetaMetrica', () => {
  it('muestra la etiqueta y el valor y expone un aria-label legible', () => {
    render(
      <TarjetaMetrica
        etiqueta="Total de ciclos"
        valor={34}
        icono="folder_managed"
        testId="metrica-total"
      />,
    )

    expect(screen.getByRole('group', { name: 'Total de ciclos: 34' })).toBeInTheDocument()
    expect(screen.getByText('34')).toBeInTheDocument()
    expect(screen.getByTestId('metrica-total')).toBeInTheDocument()
  })

  it('aplica la variante de excepción sin cambiar el valor', () => {
    render(
      <TarjetaMetrica etiqueta="No localizados" valor={2} icono="error" variante="excepcion" />,
    )

    expect(screen.getByRole('group', { name: 'No localizados: 2' })).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('muestra el detalle opcional', () => {
    render(<TarjetaMetrica etiqueta="Entregados" valor={12} detalle="del rango activo" />)

    expect(screen.getByText('del rango activo')).toBeInTheDocument()
  })
})
