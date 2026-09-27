import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FiltroEstado, { OPCIONES_ESTADO } from './FiltroEstado.jsx'

describe('FiltroEstado', () => {
  it('expone el select con label accesible y las tres opciones', () => {
    render(<FiltroEstado valor="activos" onChange={vi.fn()} />)

    const select = screen.getByLabelText('Estado')
    expect(select).toHaveValue('activos')
    expect(OPCIONES_ESTADO).toEqual([
      { value: 'activos', label: 'Activos' },
      { value: 'inactivos', label: 'Inactivos' },
      { value: 'todos', label: 'Todos' },
    ])
    expect(screen.getByRole('option', { name: 'Activos' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Inactivos' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Todos' })).toBeInTheDocument()
  })

  it('usa etiqueta personalizada y valor controlado', () => {
    render(<FiltroEstado valor="todos" onChange={vi.fn()} label="Filtro de estado" />)

    expect(screen.getByLabelText('Filtro de estado')).toHaveValue('todos')
  })

  it('notifica el cambio de estado al padre', async () => {
    const onChange = vi.fn()
    render(<FiltroEstado valor="activos" onChange={onChange} />)

    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'inactivos')

    expect(onChange).toHaveBeenCalledWith('inactivos')
  })
})
