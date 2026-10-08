import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FeedTiempoReal from './FeedTiempoReal.jsx'

const EVENTOS = [
  {
    id: 'e1',
    numeroExpediente: 'EXP-2024-035',
    pacienteNombre: 'María Fernanda López',
    estadoAnterior: 'en_busqueda',
    estadoNuevo: 'localizado',
    usuarioNombre: 'Personal de Archivo',
    fechaMovimiento: '2026-10-07T10:20:31.123-06:00',
  },
]

describe('FeedTiempoReal', () => {
  it('muestra los eventos con su transición', () => {
    render(<FeedTiempoReal eventos={EVENTOS} />)

    expect(screen.getByRole('region', { name: 'Feed en tiempo real' })).toBeInTheDocument()
    expect(screen.getByText('EXP-2024-035')).toBeInTheDocument()
    expect(screen.getByText('En búsqueda')).toBeInTheDocument()
    expect(screen.getByText('Localizado')).toBeInTheDocument()
    expect(screen.getByText(/Personal de Archivo/)).toBeInTheDocument()
  })

  it('usa aria-live="polite" y muestra espera sin eventos', () => {
    const { container } = render(<FeedTiempoReal eventos={[]} />)

    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull()
    expect(screen.getByText(/esperando movimientos/i)).toBeInTheDocument()
  })
})
