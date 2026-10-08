import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TablaMovimientos from './TablaMovimientos.jsx'

const EVENTOS = [
  {
    id: 1,
    numeroExpediente: 'EXP-2024-035',
    pacienteNombre: 'María Fernanda López',
    estadoAnterior: 'en_busqueda',
    estadoNuevo: 'localizado',
    usuarioNombre: 'Personal de Archivo',
    observacion: 'Encontrado en estante B',
    fechaMovimiento: '2026-10-07T10:20:31.123-06:00',
  },
]

describe('TablaMovimientos', () => {
  it('renderiza la tabla con sus columnas y la transición', () => {
    render(<TablaMovimientos movimientos={EVENTOS} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Fecha/hora')).toBeInTheDocument()
    expect(screen.getByText('Expediente')).toBeInTheDocument()
    expect(screen.getAllByText('EXP-2024-035').length).toBeGreaterThan(0)
    // Transición: estado anterior y nuevo con sus etiquetas.
    expect(screen.getAllByText('En búsqueda').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Localizado').length).toBeGreaterThan(0)
  })

  it('muestra el estado vacío sin movimientos', () => {
    render(<TablaMovimientos movimientos={[]} />)

    expect(screen.getByText('Sin movimientos')).toBeInTheDocument()
  })

  it('ofrece "Cargar más" solo cuando hay más páginas', () => {
    const onCargarMas = vi.fn()
    const { rerender } = render(<TablaMovimientos movimientos={EVENTOS} />)
    expect(screen.queryByRole('button', { name: 'Cargar más' })).not.toBeInTheDocument()

    rerender(<TablaMovimientos movimientos={EVENTOS} hayMas onCargarMas={onCargarMas} />)
    expect(screen.getByRole('button', { name: 'Cargar más' })).toBeInTheDocument()
  })
})
