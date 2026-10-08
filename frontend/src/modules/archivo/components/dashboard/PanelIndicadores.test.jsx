import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PanelIndicadores from './PanelIndicadores.jsx'

const ESTADISTICAS = {
  totales: {
    totalCiclos: 34,
    expedientesNuevos: 8,
    noLocalizado: 2,
    archivado: 5,
    entregado: 12,
    enTransito: 4,
  },
  porEstado: [
    { estado: 'pendiente_localizar', total: 3 },
    { estado: 'en_busqueda', total: 5 },
    { estado: 'no_localizado', total: 2 },
  ],
  permanencia: [
    { estado: 'pendiente_localizar', minutosPromedio: 18 },
    { estado: 'en_busqueda', minutosPromedio: 42 },
    { estado: 'localizado', minutosPromedio: 12 },
  ],
}

describe('PanelIndicadores', () => {
  it('renderiza los indicadores con sus valores', () => {
    render(<PanelIndicadores estadisticas={ESTADISTICAS} />)

    expect(screen.getByRole('group', { name: 'Total de ciclos: 34' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Expedientes nuevos: 8' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Pendientes de localizar: 3' })).toBeInTheDocument()
    // En búsqueda (5) + en tránsito (4) = 9.
    expect(screen.getByRole('group', { name: 'En búsqueda / En tránsito: 9' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Entregados: 12' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Archivados: 5' })).toBeInTheDocument()
  })

  it('marca los no localizados como excepción', () => {
    render(<PanelIndicadores estadisticas={ESTADISTICAS} />)

    expect(screen.getByTestId('metrica-no-localizados')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'No localizados: 2' })).toBeInTheDocument()
  })

  it('muestra el tiempo promedio de localización formateado', () => {
    render(<PanelIndicadores estadisticas={ESTADISTICAS} />)

    // Promedio de 18, 42 y 12 = 24 min.
    expect(
      screen.getByRole('group', { name: 'Tiempo promedio de localización: 24 min' }),
    ).toBeInTheDocument()
  })

  it('no renderiza nada sin estadísticas', () => {
    const { container } = render(<PanelIndicadores estadisticas={null} />)

    expect(container).toBeEmptyDOMElement()
  })
})
