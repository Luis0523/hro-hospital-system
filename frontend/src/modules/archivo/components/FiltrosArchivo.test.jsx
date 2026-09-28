import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FiltrosArchivo from './FiltrosArchivo.jsx'

// jsdom no implementa ResizeObserver y Headless UI lo usa al abrir/cerrar el
// Listbox de subespecialidad.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

const SUBESPECIALIDADES = [
  { id: 1, nombre: 'Medicina General' },
  { id: 2, nombre: 'Pediatría General' },
]

function renderFiltros(props = {}) {
  return render(
    <FiltrosArchivo
      fecha="2026-09-27"
      onFecha={() => {}}
      subespecialidadId=""
      onSubespecialidad={() => {}}
      subespecialidades={SUBESPECIALIDADES}
      {...props}
    />,
  )
}

describe('FiltrosArchivo', () => {
  it('muestra Fecha de consulta y Subespecialidad, sin Médico', () => {
    renderFiltros()

    expect(screen.getByLabelText('Fecha de consulta')).toBeInTheDocument()
    expect(screen.getByText('Subespecialidad')).toBeInTheDocument()
    expect(screen.queryByText('Médico')).not.toBeInTheDocument()
    expect(screen.queryByText('Clínica')).not.toBeInTheDocument()
  })

  it('carga las opciones de subespecialidades', async () => {
    const user = userEvent.setup()
    renderFiltros()

    await user.click(screen.getByRole('button', { name: /todas las subespecialidades/i }))

    expect(await screen.findByRole('option', { name: 'Medicina General' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Pediatría General' })).toBeInTheDocument()
  })

  it('notifica el cambio de subespecialidad', async () => {
    const onSubespecialidad = vi.fn()
    const user = userEvent.setup()
    renderFiltros({ onSubespecialidad })

    await user.click(screen.getByRole('button', { name: /todas las subespecialidades/i }))
    await user.click(await screen.findByRole('option', { name: 'Pediatría General' }))

    expect(onSubespecialidad).toHaveBeenCalledWith(2)
  })

  it('notifica el cambio de fecha', () => {
    const onFecha = vi.fn()
    renderFiltros({ onFecha })

    fireEvent.change(screen.getByLabelText('Fecha de consulta'), {
      target: { value: '2026-10-01' },
    })

    expect(onFecha).toHaveBeenCalledWith('2026-10-01')
  })
})
