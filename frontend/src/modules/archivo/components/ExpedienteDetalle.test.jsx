import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExpedienteDetalle from './ExpedienteDetalle.jsx'

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

const FILA = {
  id: 'e1',
  expedienteId: 'e1',
  citaId: 101,
  cicloId: 'c1',
  numeroExpediente: 'EXP-2024-035',
  pacienteNombre: 'María Fernanda López García',
  estadoActual: 'en_busqueda',
  horaEstimada: '10:20:00',
  ubicacion: 'Pasillo A · Estante 3',
  subespecialidadNombre: 'Medicina General',
}

const CICLO = {
  cicloId: 'c1',
  citaId: 101,
  estadoActual: 'en_busqueda',
  movimientos: [
    {
      id: 1,
      estadoAnterior: 'pendiente_localizar',
      estadoNuevo: 'en_busqueda',
      usuarioNombre: 'Operador Archivo',
      observacion: 'Búsqueda iniciada',
      fechaMovimiento: '2026-10-06T08:05:00',
    },
  ],
}

function renderDetalle(props = {}) {
  return render(<ExpedienteDetalle fila={FILA} abierto onCerrar={() => {}} {...props} />)
}

describe('ExpedienteDetalle', () => {
  it('muestra datos de la fila, estado, cicloId y trazabilidad', () => {
    renderDetalle()

    expect(screen.getByText('María Fernanda López García')).toBeInTheDocument()
    expect(screen.getByText('Expediente EXP-2024-035')).toBeInTheDocument()
    expect(screen.getByText('ciclo c1')).toBeInTheDocument()
    expect(screen.getByLabelText('Trazabilidad del expediente')).toBeInTheDocument()
  })

  it('lista los movimientos del ciclo cuando el backend los devuelve', () => {
    renderDetalle({ ciclo: CICLO })

    expect(screen.getByText('Búsqueda iniciada')).toBeInTheDocument()
    expect(screen.getByText(/operador archivo/i)).toBeInTheDocument()
  })

  it('sin ciclo informa que el tracking no ha iniciado', () => {
    renderDetalle({ fila: { ...FILA, cicloId: null, estadoActual: 'sin_ciclo' }, ciclo: null })

    expect(screen.getByText(/aún no ha iniciado/i)).toBeInTheDocument()
  })

  it('muestra carga mientras se obtienen movimientos', () => {
    renderDetalle({ cargandoDatos: true })
    expect(screen.getByText(/cargando movimientos/i)).toBeInTheDocument()
  })

  it('cierra con el botón', async () => {
    const onCerrar = vi.fn()
    const user = userEvent.setup()
    renderDetalle({ onCerrar })

    await user.click(screen.getByRole('button', { name: /cerrar/i }))
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })

  it('no renderiza nada sin fila', () => {
    const { container } = render(<ExpedienteDetalle fila={null} abierto onCerrar={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
