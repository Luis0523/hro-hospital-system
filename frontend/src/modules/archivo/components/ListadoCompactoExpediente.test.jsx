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
    numeroExpediente: 'EXP-2024-035',
    pacienteNombre: 'María Fernanda López García',
    estadoActual: 'sin_ciclo',
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

const boton = (nombre) => screen.queryByRole('button', { name: nombre })

describe('ListadoCompactoExpediente — información y estado real', () => {
  it('muestra número, paciente, ubicación, área, hora y estado legible', () => {
    renderFila(fila({ estadoActual: 'localizado' }))

    expect(screen.getByText('EXP-2024-035')).toBeInTheDocument()
    expect(screen.getByText('María Fernanda López García')).toBeInTheDocument()
    expect(screen.getByText('Pasillo A · Estante 3')).toBeInTheDocument()
    expect(screen.getByText('Medicina General')).toBeInTheDocument()
    expect(screen.getByText('10:20')).toBeInTheDocument()
    expect(screen.getByText('Localizado')).toBeInTheDocument()
  })

  it('no muestra checkbox reversible', () => {
    renderFila(fila())
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('resalta la fila encontrada por el buscador', () => {
    renderFila(fila(), { resaltado: true })
    expect(screen.getByRole('listitem')).toHaveAttribute('data-resaltado', 'true')
    expect(screen.getByText('Resultado de búsqueda')).toBeInTheDocument()
  })
})

describe('ListadoCompactoExpediente — acciones por estado', () => {
  it('sin_ciclo muestra Check-in', () => {
    renderFila(fila({ estadoActual: 'sin_ciclo', cicloId: null }))
    expect(boton(/^check-in$/i)).toBeInTheDocument()
  })

  it('pendiente_localizar muestra Iniciar búsqueda', () => {
    renderFila(fila({ estadoActual: 'pendiente_localizar' }))
    expect(boton(/iniciar búsqueda/i)).toBeInTheDocument()
  })

  it('en_busqueda muestra Localizar y No localizado', () => {
    renderFila(fila({ estadoActual: 'en_busqueda' }))
    expect(boton(/^localizar$/i)).toBeInTheDocument()
    expect(boton(/^no localizado$/i)).toBeInTheDocument()
  })

  it('no_localizado muestra Reintentar búsqueda', () => {
    renderFila(fila({ estadoActual: 'no_localizado' }))
    expect(boton(/reintentar búsqueda/i)).toBeInTheDocument()
  })

  it('localizado muestra Despachar', () => {
    renderFila(fila({ estadoActual: 'localizado' }))
    expect(boton(/^despachar$/i)).toBeInTheDocument()
  })

  it('en_transito_retorno muestra Archivar', () => {
    renderFila(fila({ estadoActual: 'en_transito_retorno' }))
    expect(boton(/^archivar$/i)).toBeInTheDocument()
  })

  it('en_transito_entrega no ofrece acción de Archivo y muestra el aviso', () => {
    renderFila(fila({ estadoActual: 'en_transito_entrega' }))
    expect(screen.getByText(/esperando recepción en coex/i)).toBeInTheDocument()
  })

  it('entregado no ofrece acción de Archivo', () => {
    renderFila(fila({ estadoActual: 'entregado' }))
    expect(screen.getByText('En COEX')).toBeInTheDocument()
  })

  it('archivado no ofrece acción de Archivo', () => {
    renderFila(fila({ estadoActual: 'archivado' }))
    expect(screen.getByText(/ciclo cerrado/i)).toBeInTheDocument()
  })

  it('nunca muestra acciones de Enfermería', () => {
    for (const estadoActual of [
      'sin_ciclo',
      'pendiente_localizar',
      'en_busqueda',
      'no_localizado',
      'localizado',
      'en_transito_entrega',
      'entregado',
      'en_transito_retorno',
      'archivado',
    ]) {
      const { unmount } = renderFila(fila({ estadoActual }))
      expect(screen.queryByRole('button', { name: /^entregar$/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^retornar$/i })).not.toBeInTheDocument()
      unmount()
    }
  })

  it('notifica la acción con su id y la fila', async () => {
    const onAccion = vi.fn()
    const user = userEvent.setup()
    const expediente = fila({ estadoActual: 'pendiente_localizar' })
    renderFila(expediente, { onAccion })

    await user.click(screen.getByRole('button', { name: /iniciar búsqueda/i }))

    expect(onAccion).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'iniciar_busqueda' }),
      expediente,
    )
  })

  it('deshabilita las acciones mientras procesa', () => {
    renderFila(fila({ estadoActual: 'en_busqueda' }), { procesando: true })
    expect(screen.getByRole('button', { name: /^localizar$/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^no localizado$/i })).toBeDisabled()
  })

  it('permite ver el detalle', async () => {
    const onVerDetalle = vi.fn()
    const user = userEvent.setup()
    const expediente = fila({ estadoActual: 'localizado' })
    renderFila(expediente, { onVerDetalle })

    await user.click(screen.getByRole('button', { name: /ver detalle/i }))
    expect(onVerDetalle).toHaveBeenCalledWith(expediente)
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

  it('avisa y no permite check-in', () => {
    renderFila(sinExpediente)

    expect(screen.getByText(/cita sin expediente físico/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^check-in$/i })).not.toBeInTheDocument()
  })

  it('no inventa número de expediente', () => {
    renderFila(sinExpediente)
    expect(screen.getByText('Sin número de expediente')).toBeInTheDocument()
  })
})
