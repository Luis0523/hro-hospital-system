import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExpedienteDetalle from './ExpedienteDetalle.jsx'

const PACIENTE_NUEVO = {
  id: 7,
  pacienteNombre: 'Diana Carolina Xicará Tuy',
  numeroExpediente: null,
  expedienteNuevo: true,
  estado: 'pendiente_localizar',
  clinicaNombre: 'Clínica 04 - Cardiología',
  medicoNombre: 'Dra. Patricia Núñez',
  fechaCita: '2026-09-21',
  horaEstimada: '16:10:00',
  ubicacion: null,
  historial: [],
}

const EXPEDIENTE_EXISTENTE = {
  id: 1,
  pacienteNombre: 'María Fernanda López García',
  numeroExpediente: 'EXP-004521',
  expedienteNuevo: false,
  estado: 'pendiente_localizar',
  clinicaNombre: 'Clínica 01 - Medicina General',
  medicoNombre: 'Dr. Jorge Castillo',
  fechaCita: '2026-09-21',
  horaEstimada: '10:20:00',
  ubicacion: 'Estante A · Fila 3 · Caja 12',
  historial: [
    {
      id: 1,
      estado: 'pendiente_localizar',
      fechaHora: '2026-09-20T13:00:00.000Z',
      usuario: 'Archivo Central',
    },
  ],
}

function renderDetalle(expediente, props = {}) {
  return render(
    <ExpedienteDetalle
      expediente={expediente}
      abierto
      onCerrar={() => {}}
      onAvanzar={() => {}}
      onNoLocalizado={() => {}}
      onCrear={() => {}}
      {...props}
    />,
  )
}

describe('ExpedienteDetalle — paciente nuevo', () => {
  it('no muestra el stepper normal ni acciones de trazabilidad', () => {
    renderDetalle(PACIENTE_NUEVO)

    expect(screen.queryByLabelText('Trazabilidad del expediente')).not.toBeInTheDocument()
    expect(screen.queryByText('Pendiente de localizar')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar no localizado/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /avanzar al siguiente estado/i }),
    ).not.toBeInTheDocument()
  })

  it('muestra el aviso de expediente nuevo y la acción de crearlo', async () => {
    const onCrear = vi.fn()
    renderDetalle(PACIENTE_NUEVO, { onCrear })

    expect(screen.getByText('Expediente nuevo')).toBeInTheDocument()
    expect(
      screen.getByText('Este paciente todavía no cuenta con expediente físico.'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /crear expediente físico/i }))

    expect(onCrear).toHaveBeenCalledTimes(1)
  })
})

describe('ExpedienteDetalle — expediente existente', () => {
  it('conserva la trazabilidad y sus acciones', () => {
    renderDetalle(EXPEDIENTE_EXISTENTE)

    expect(screen.getByLabelText('Trazabilidad del expediente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /avanzar al siguiente estado/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /marcar no localizado/i })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /crear expediente físico/i }),
    ).not.toBeInTheDocument()
  })
})
