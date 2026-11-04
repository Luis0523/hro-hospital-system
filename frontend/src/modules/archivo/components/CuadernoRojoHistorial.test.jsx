import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import CuadernoRojoHistorial from './CuadernoRojoHistorial.jsx'

const REGISTROS = [
  {
    id: 'n-01',
    fecha: '2026-11-01',
    egresosHospitalarios: 11,
    sobresEmergencia: 12,
    sobresSellados: 13,
    tia: 14,
    registradoPor: 'Ana Pérez',
    actualizadoPor: 'Luis Gómez',
    actualizadoEn: '2026-11-04T02:30:00Z',
  },
  {
    id: 'n-02',
    fecha: '2026-11-02',
    egresosHospitalarios: 21,
    sobresEmergencia: 22,
    sobresSellados: 23,
    tia: 24,
    registradoPor: null,
    actualizadoPor: '   ',
    actualizadoEn: 'no-es-fecha',
  },
  {
    id: 'o-31',
    fecha: '2026-10-31',
    egresosHospitalarios: 31,
    sobresEmergencia: 32,
    sobresSellados: 33,
    tia: 34,
    registradoPor: 'Archivo',
    actualizadoPor: 'Archivo',
    actualizadoEn: '2026-11-01T15:00:00-06:00',
  },
]

function props(extra = {}) {
  return {
    registros: REGISTROS,
    filtros: { desde: '2026-10-01', hasta: '2026-11-30' },
    onAplicarFiltros: vi.fn(),
    onRestablecer: vi.fn(),
    onEditar: vi.fn(),
    onEliminar: vi.fn(),
    puedeEliminar: true,
    onGenerarPdf: vi.fn(),
    ...extra,
  }
}

function tabla() {
  return screen.getByRole('table')
}

function botonDetalle(fecha) {
  return within(tabla()).getByRole('button', {
    name: `Detalle del registro del ${fecha}`,
  })
}

function metrica(etiqueta) {
  return screen.getAllByText(etiqueta)[0].parentElement
}

describe('CuadernoRojoHistorial', () => {
  it('muestra el resumen calculado solo con los registros del período', () => {
    render(<CuadernoRojoHistorial {...props()} />)

    expect(within(metrica('Días registrados')).getByText('3')).toBeInTheDocument()
    expect(within(metrica('Egresos hospitalarios')).getByText('63')).toBeInTheDocument()
    expect(within(metrica('Sobres emergencia')).getByText('66')).toBeInTheDocument()
    expect(within(metrica('Sobres sellados')).getByText('69')).toBeInTheDocument()
    expect(within(metrica('TIA')).getByText('72')).toBeInTheDocument()
  })

  it('muestra las cuatro cantidades y agrupa por mes en escritorio', () => {
    render(<CuadernoRojoHistorial {...props()} />)

    const fila = within(tabla())
      .getByRole('rowheader', { name: /02\/11\/2026/ })
      .closest('tr')
    expect(within(fila).getByText('21')).toBeInTheDocument()
    expect(within(fila).getByText('22')).toBeInTheDocument()
    expect(within(fila).getByText('23')).toBeInTheDocument()
    expect(within(fila).getByText('24')).toBeInTheDocument()
    expect(screen.getAllByText('Noviembre 2026').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Octubre 2026').length).toBeGreaterThan(0)
  })

  it('habilita el reporte solo con registros y lo solicita al pulsar', () => {
    const onGenerarPdf = vi.fn()
    render(<CuadernoRojoHistorial {...props({ onGenerarPdf })} />)

    const boton = screen.getByRole('button', { name: /generar reporte pdf/i })
    expect(boton).toBeEnabled()
    fireEvent.click(boton)
    expect(onGenerarPdf).toHaveBeenCalledTimes(1)
  })

  it('mantiene el reporte fuera del scroll y fija el encabezado de la tabla', () => {
    render(<CuadernoRojoHistorial {...props()} />)

    const scrollEscritorio = screen.getByTestId('historial-scroll-escritorio')
    const scrollMovil = screen.getByTestId('historial-scroll-movil')
    const botonReporte = screen.getByRole('button', { name: /generar reporte pdf/i })

    expect(scrollEscritorio).toHaveClass('overflow-y-auto')
    expect(scrollMovil).toHaveClass('overflow-y-auto')
    expect(scrollEscritorio.contains(botonReporte)).toBe(false)
    expect(scrollMovil.contains(botonReporte)).toBe(false)
    expect(within(tabla()).getByRole('columnheader', { name: 'Acciones' })).toHaveClass('sticky')
    expect(within(tabla()).getByRole('columnheader', { name: 'Fecha' })).toHaveClass('sticky')
  })

  it('deshabilita el reporte y no muestra resumen en un período vacío', () => {
    render(<CuadernoRojoHistorial {...props({ registros: [] })} />)

    expect(screen.getByText('Sin registros en el período seleccionado')).toBeInTheDocument()
    expect(
      screen.getByText('Ajuste el rango de fechas o registre un nuevo día.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generar reporte pdf/i })).toBeDisabled()
    expect(screen.queryByText('Días registrados')).not.toBeInTheDocument()
  })

  it('muestra el progreso y oculta la tabla mientras carga', () => {
    render(
      <CuadernoRojoHistorial
        {...props({ cargando: true, progreso: { completados: 1, total: 3 } })}
      />,
    )

    expect(screen.getByText('Consultando 1 de 3 años…')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generar reporte pdf/i })).toBeDisabled()
  })

  it('edita y elimina desde las acciones de la derecha', () => {
    const onEditar = vi.fn()
    const onEliminar = vi.fn()
    render(<CuadernoRojoHistorial {...props({ onEditar, onEliminar })} />)

    fireEvent.click(within(tabla()).getByRole('button', { name: 'Editar registro del 01/11/2026' }))
    expect(onEditar).toHaveBeenCalledWith(REGISTROS[0])

    fireEvent.click(
      within(tabla()).getByRole('button', { name: 'Eliminar registro del 01/11/2026' }),
    )
    expect(onEliminar).toHaveBeenCalledWith(REGISTROS[0])
  })

  it('deshabilita Eliminar cuando el backend real no expone DELETE', () => {
    render(<CuadernoRojoHistorial {...props({ puedeEliminar: false })} />)

    const boton = within(tabla()).getByRole('button', {
      name: 'Eliminar no disponible para el registro del 01/11/2026',
    })
    expect(boton).toBeDisabled()
    expect(boton).toHaveAttribute('title', 'Eliminar no disponible: el backend no expone DELETE')
  })

  it('abre, contrae y mantiene un solo detalle de trazabilidad', () => {
    render(<CuadernoRojoHistorial {...props()} />)

    const botonA = botonDetalle('01/11/2026')
    const botonB = botonDetalle('02/11/2026')
    expect(botonA).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(botonA)
    expect(botonA).toHaveAttribute('aria-expanded', 'true')
    const controlA = botonA.getAttribute('aria-controls')
    const detalleA = document.getElementById(controlA)
    expect(detalleA).toBeInTheDocument()
    expect(within(detalleA).getByText('Ana Pérez')).toBeInTheDocument()
    expect(within(detalleA).getByText('Luis Gómez')).toBeInTheDocument()
    expect(within(detalleA).getByText(/20:30/)).toBeInTheDocument()

    fireEvent.click(botonB)
    expect(botonA).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById(controlA)).not.toBeInTheDocument()
    const detalleB = document.getElementById(botonB.getAttribute('aria-controls'))
    expect(within(detalleB).getAllByText('No disponible')).toHaveLength(3)

    fireEvent.click(botonB)
    expect(botonB).toHaveAttribute('aria-expanded', 'false')
  })

  it('cierra el detalle al cambiar filtros o al desaparecer el registro', () => {
    const { rerender } = render(<CuadernoRojoHistorial {...props()} />)
    fireEvent.click(botonDetalle('01/11/2026'))
    expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)

    rerender(
      <CuadernoRojoHistorial
        {...props({ filtros: { desde: '2026-11-01', hasta: '2026-11-30' } })}
      />,
    )
    expect(screen.queryAllByText('Ana Pérez')).toHaveLength(0)

    fireEvent.click(botonDetalle('01/11/2026'))
    expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)

    rerender(
      <CuadernoRojoHistorial
        {...props({ registros: REGISTROS.filter((registro) => registro.id !== 'n-01') })}
      />,
    )
    expect(screen.queryAllByText('Ana Pérez')).toHaveLength(0)
  })

  it('mantiene Editar operativo con el detalle abierto', () => {
    const onEditar = vi.fn()
    render(<CuadernoRojoHistorial {...props({ onEditar })} />)

    fireEvent.click(botonDetalle('01/11/2026'))
    fireEvent.click(within(tabla()).getByRole('button', { name: 'Editar registro del 01/11/2026' }))

    expect(onEditar).toHaveBeenCalledWith(REGISTROS[0])
  })
})
