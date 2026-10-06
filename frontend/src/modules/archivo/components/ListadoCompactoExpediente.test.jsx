import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ListadoCompactoExpediente from './ListadoCompactoExpediente.jsx'

function fila(overrides = {}) {
  return {
    id: 'e1',
    expedienteId: 'e1',
    citaId: 101,
    cicloId: 'c1',
    numeroExpediente: '111015',
    pacienteNombre: 'María Fernanda López García',
    estadoActual: 'en_busqueda',
    horaEstimada: '10:20:00',
    ubicacion: 'Pasillo A · Estante 3',
    subespecialidadNombre: 'Medicina General',
    ...overrides,
  }
}

function renderFila(expediente, props = {}) {
  return render(
    <ul>
      <ListadoCompactoExpediente expediente={expediente} {...props} />
    </ul>,
  )
}

const checkbox = () => screen.getByRole('checkbox')

describe('ListadoCompactoExpediente — fila de checklist', () => {
  it('muestra número, paciente, ubicación, área y hora', () => {
    renderFila(fila())

    expect(screen.getByText('111015')).toBeInTheDocument()
    expect(screen.getByText('María Fernanda López García')).toBeInTheDocument()
    expect(screen.getByText('Pasillo A · Estante 3')).toBeInTheDocument()
    expect(screen.getByText('Medicina General')).toBeInTheDocument()
    expect(screen.getByText('10:20')).toBeInTheDocument()
  })

  it('el checkbox refleja el estado real: pendiente = sin marcar', () => {
    renderFila(fila({ estadoActual: 'en_busqueda' }))

    expect(checkbox()).not.toBeChecked()
    expect(checkbox()).toBeEnabled()
    expect(screen.getByRole('listitem')).toHaveAttribute('data-localizado', 'false')
  })

  it('localizado = marcado y read-only (sin reversión)', () => {
    renderFila(fila({ estadoActual: 'localizado' }))

    expect(checkbox()).toBeChecked()
    expect(checkbox()).toBeDisabled()
    expect(screen.getByRole('listitem')).toHaveAttribute('data-localizado', 'true')
  })

  it('un estado posterior a localizado también aparece marcado', () => {
    renderFila(fila({ estadoActual: 'entregado' }))

    expect(checkbox()).toBeChecked()
    expect(checkbox()).toBeDisabled()
  })

  it('no muestra estados técnicos ni botones de transición', () => {
    renderFila(fila({ estadoActual: 'en_busqueda' }))

    expect(screen.queryByText(/en búsqueda/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/pendiente de localizar/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Trazabilidad del expediente')).not.toBeInTheDocument()
  })

  it('notifica el toggle con el expediente al marcar', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    const expediente = fila({ estadoActual: 'en_busqueda' })
    renderFila(expediente, { onToggle })

    await user.click(checkbox())

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith(expediente)
  })

  it('deshabilita el checkbox y muestra progreso mientras procesa', () => {
    renderFila(fila({ estadoActual: 'en_busqueda' }), { procesando: true })

    expect(checkbox()).toBeDisabled()
    expect(screen.getByRole('status', { name: 'Procesando' })).toBeInTheDocument()
  })

  it('resalta la fila encontrada por el buscador sin marcarla', () => {
    renderFila(fila({ estadoActual: 'en_busqueda' }), { resaltado: true })

    expect(screen.getByRole('listitem')).toHaveAttribute('data-resaltado', 'true')
    expect(screen.getByText('Resultado de búsqueda')).toBeInTheDocument()
    expect(checkbox()).not.toBeChecked()
  })

  it('clasifica 111015 como Pasivo y 111016/111017 como Activo', () => {
    renderFila(fila({ numeroExpediente: '111015' }))
    expect(screen.getByText('Pasivo')).toBeInTheDocument()

    renderFila(fila({ id: 'e2', expedienteId: 'e2', numeroExpediente: '111016' }))
    renderFila(fila({ id: 'e3', expedienteId: 'e3', numeroExpediente: '111017' }))
    expect(screen.getAllByText('Activo')).toHaveLength(2)
  })

  it('no clasifica números no numéricos', () => {
    renderFila(fila({ numeroExpediente: '1323-23' }))

    expect(screen.queryByText('Activo')).not.toBeInTheDocument()
    expect(screen.queryByText('Pasivo')).not.toBeInTheDocument()
  })
})

describe('ListadoCompactoExpediente — cita sin expediente físico', () => {
  const sinExpediente = fila({
    id: 'cita-110',
    expedienteId: null,
    cicloId: null,
    numeroExpediente: null,
    estadoActual: 'sin_ciclo',
  })

  it('no muestra checkbox operativo y avisa', () => {
    renderFila(sinExpediente)

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.getByText(/cita sin expediente físico/i)).toBeInTheDocument()
    expect(screen.getByText('Sin número de expediente')).toBeInTheDocument()
  })
})
