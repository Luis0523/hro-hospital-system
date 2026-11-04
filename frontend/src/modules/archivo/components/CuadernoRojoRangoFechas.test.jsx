import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import CuadernoRojoRangoFechas from './CuadernoRojoRangoFechas.jsx'

const FILTROS = { desde: '2026-11-01', hasta: '2026-11-30' }

function renderFiltro(extra = {}) {
  const onAplicar = vi.fn()
  const onRestablecer = vi.fn()
  render(
    <CuadernoRojoRangoFechas
      filtros={FILTROS}
      onAplicar={onAplicar}
      onRestablecer={onRestablecer}
      {...extra}
    />,
  )
  return { onAplicar, onRestablecer }
}

describe('CuadernoRojoRangoFechas', () => {
  it('muestra el rango actual en formato dd/mm/aaaa', () => {
    renderFiltro()

    expect(screen.getByLabelText(/^Desde/)).toHaveValue('01/11/2026')
    expect(screen.getByLabelText(/^Hasta/)).toHaveValue('30/11/2026')
  })

  it('aplica la máscara al escribir solo dígitos y envía ISO', () => {
    const { onAplicar } = renderFiltro()

    fireEvent.change(screen.getByLabelText(/^Desde/), { target: { value: '03122025' } })
    expect(screen.getByLabelText(/^Desde/)).toHaveValue('03/12/2025')

    fireEvent.click(screen.getByRole('button', { name: /aplicar filtro/i }))

    expect(onAplicar).toHaveBeenCalledWith({
      desde: '2025-12-03',
      hasta: '2026-11-30',
    })
  })

  it('admite pegar una fecha ISO completa', () => {
    const { onAplicar } = renderFiltro()

    fireEvent.change(screen.getByLabelText(/^Hasta/), { target: { value: '2026-12-03' } })
    expect(screen.getByLabelText(/^Hasta/)).toHaveValue('03/12/2026')

    fireEvent.click(screen.getByRole('button', { name: /aplicar filtro/i }))
    expect(onAplicar).toHaveBeenCalledWith({
      desde: '2026-11-01',
      hasta: '2026-12-03',
    })
  })

  it('no consulta con fechas incompletas o rangos invertidos', () => {
    const { onAplicar } = renderFiltro()

    fireEvent.change(screen.getByLabelText(/^Desde/), { target: { value: '0311' } })
    fireEvent.click(screen.getByRole('button', { name: /aplicar filtro/i }))

    expect(onAplicar).not.toHaveBeenCalled()
    expect(screen.getByText(/fecha válida entre 2000 y 2100/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/^Desde/), { target: { value: '30112026' } })
    fireEvent.change(screen.getByLabelText(/^Hasta/), { target: { value: '01112026' } })
    fireEvent.click(screen.getByRole('button', { name: /aplicar filtro/i }))

    expect(onAplicar).not.toHaveBeenCalled()
    expect(screen.getByText(/fecha final no puede ser anterior/i)).toBeInTheDocument()
  })

  it('permite restablecer', () => {
    const { onRestablecer } = renderFiltro()
    fireEvent.click(screen.getByRole('button', { name: /restablecer/i }))
    expect(onRestablecer).toHaveBeenCalledTimes(1)
  })

  it('deshabilita las acciones mientras carga', () => {
    renderFiltro({ cargando: true })
    for (const boton of screen.getAllByRole('button', { name: /aplicar filtro|restablecer/i })) {
      expect(boton).toBeDisabled()
    }
  })
})
