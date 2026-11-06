import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import CampoFechaDepuracion from './CampoFechaDepuracion.jsx'

function renderCampo(props = {}) {
  return render(
    <CampoFechaDepuracion
      label="Fecha inicial"
      name="fecha"
      value=""
      onChange={() => {}}
      {...props}
    />,
  )
}

describe('CampoFechaDepuracion', () => {
  it('aplica la máscara dd/mm/aaaa mientras se escribe', () => {
    const onChange = vi.fn()
    renderCampo({ onChange })

    const input = screen.getByLabelText('Fecha inicial')
    fireEvent.change(input, { target: { value: '0' } })
    expect(input).toHaveValue('0')
    expect(onChange).toHaveBeenLastCalledWith('')

    fireEvent.change(input, { target: { value: '0310' } })
    expect(input).toHaveValue('03/10')
    expect(onChange).toHaveBeenLastCalledWith('')

    fireEvent.change(input, { target: { value: '03102026' } })
    expect(input).toHaveValue('03/10/2026')
    expect(onChange).toHaveBeenLastCalledWith('2026-10-03')
  })

  it('acepta pegar con separadores y conserva ceros iniciales', () => {
    const onChange = vi.fn()
    renderCampo({ onChange })
    const input = screen.getByLabelText('Fecha inicial')

    fireEvent.change(input, { target: { value: '02-11-2026' } })

    expect(input).toHaveValue('02/11/2026')
    expect(onChange).toHaveBeenLastCalledWith('2026-11-02')

    fireEvent.change(input, { target: { value: '01022026' } })
    expect(input).toHaveValue('01/02/2026')
    expect(onChange).toHaveBeenLastCalledWith('2026-02-01')
  })

  it('no sustituye la validación de fechas reales', () => {
    const onChange = vi.fn()
    renderCampo({ onChange })
    const input = screen.getByLabelText('Fecha inicial')

    fireEvent.change(input, { target: { value: '29022025' } })

    expect(input).toHaveValue('29/02/2025')
    expect(onChange).toHaveBeenLastCalledWith('2025-02-29')

    fireEvent.change(input, { target: { value: '29022024' } })
    expect(onChange).toHaveBeenLastCalledWith('2024-02-29')
  })

  it('sincroniza un valor ISO externo', () => {
    const { rerender } = renderCampo({ value: '2026-11-02' })
    const input = screen.getByLabelText('Fecha inicial')

    expect(input).toHaveValue('02/11/2026')

    rerender(
      <CampoFechaDepuracion
        label="Fecha inicial"
        name="fecha"
        value="2027-01-01"
        onChange={() => {}}
      />,
    )
    expect(input).toHaveValue('01/01/2027')
  })

  it('limita a ocho dígitos y usa teclado numérico', () => {
    renderCampo()
    const input = screen.getByLabelText('Fecha inicial')

    expect(input).toHaveAttribute('inputMode', 'numeric')
    expect(input).toHaveAttribute('maxLength', '10')
    fireEvent.change(input, { target: { value: '123456789999' } })
    expect(input).toHaveValue('12/34/5678')
  })

  it('marca el campo como inválido y lo asocia al error', () => {
    renderCampo({ error: true, describedBy: 'rango-error' })
    const input = screen.getByLabelText('Fecha inicial')

    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'rango-error')
  })
})
