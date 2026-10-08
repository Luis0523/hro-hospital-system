import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import FiltroDashboard from './FiltroDashboard.jsx'

const FILTROS = { desde: '', hasta: '', subespecialidadId: '' }
const SUBESPECIALIDADES = [
  { id: 1, nombre: 'Medicina General' },
  { id: 2, nombre: 'Pediatría General' },
]

describe('FiltroDashboard', () => {
  it('renderiza los campos de fecha y la unidad', () => {
    render(
      <FiltroDashboard
        filtros={FILTROS}
        onChange={() => {}}
        subespecialidades={SUBESPECIALIDADES}
      />,
    )

    expect(screen.getByLabelText('Desde')).toBeInTheDocument()
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument()
    expect(screen.getByText('Unidad / Subespecialidad')).toBeInTheDocument()
  })

  it('emite el cambio de fecha conservando el resto de filtros', () => {
    const onChange = vi.fn()
    render(<FiltroDashboard filtros={FILTROS} onChange={onChange} subespecialidades={[]} />)

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-01' } })

    expect(onChange).toHaveBeenCalledWith({ desde: '2026-10-01', hasta: '', subespecialidadId: '' })
  })
})
