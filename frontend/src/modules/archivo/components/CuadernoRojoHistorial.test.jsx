import { beforeAll, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import CuadernoRojoHistorial from './CuadernoRojoHistorial.jsx'

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
})

const REGISTROS = [
  {
    id: 'oct-15',
    fecha: '2026-10-15',
    egresosHospitalarios: 11,
    sobresEmergencia: 12,
    sobresSellados: 13,
    tia: 14,
    registradoPor: 'Ana Pérez',
    actualizadoPor: 'Luis Gómez',
    actualizadoEn: '2026-10-15T15:00:00-06:00',
  },
  {
    id: 'oct-16',
    fecha: '2026-10-16',
    egresosHospitalarios: 21,
    sobresEmergencia: 22,
    sobresSellados: 23,
    tia: 24,
    registradoPor: 'Beto Ruiz',
    actualizadoPor: 'Carla Méndez',
    actualizadoEn: '2026-10-16T16:30:00-06:00',
  },
  {
    id: 'nov-03',
    fecha: '2026-11-03',
    egresosHospitalarios: 31,
    sobresEmergencia: 32,
    sobresSellados: 33,
    tia: 34,
    registradoPor: 'Archivo',
    actualizadoPor: 'Archivo',
    actualizadoEn: '2026-11-04T02:30:00Z',
  },
]

describe('CuadernoRojoHistorial', () => {
  it('agrupa por mes y año y muestra el conteo total', () => {
    render(<CuadernoRojoHistorial registros={REGISTROS} />)

    expect(screen.getByText('3 días registrados.')).toBeInTheDocument()
    expect(screen.getAllByText('Octubre 2026').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Noviembre 2026').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2 registros').length).toBeGreaterThan(0)
  })

  it('muestra las cuatro cantidades en la tabla de escritorio', () => {
    render(<CuadernoRojoHistorial registros={REGISTROS} />)

    const tabla = screen.getByRole('table')
    const fila = within(tabla)
      .getByRole('rowheader', { name: /03\/11\/2026/ })
      .closest('tr')

    expect(within(fila).getByText('31')).toBeInTheDocument()
    expect(within(fila).getByText('32')).toBeInTheDocument()
    expect(within(fila).getByText('33')).toBeInTheDocument()
    expect(within(fila).getByText('34')).toBeInTheDocument()
  })

  it('identifica el registro seleccionado con el texto En edición', () => {
    render(<CuadernoRojoHistorial registros={REGISTROS} fechaSeleccionada="2026-11-03" />)

    expect(screen.getAllByText('En edición').length).toBeGreaterThan(0)

    const tabla = screen.getByRole('table')
    const fila = within(tabla)
      .getByRole('rowheader', { name: /03\/11\/2026/ })
      .closest('tr')
    expect(fila).toHaveClass('bg-primary/5')
  })

  it('permite editar un registro desde la acción Editar', () => {
    const onSeleccionar = vi.fn()
    render(<CuadernoRojoHistorial registros={REGISTROS} onSeleccionar={onSeleccionar} />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar registro del 03/11/2026' })[0])

    expect(onSeleccionar).toHaveBeenCalledWith(REGISTROS[2])
  })

  it('muestra el estado vacío reutilizando EmptyState', () => {
    render(<CuadernoRojoHistorial registros={[]} />)

    expect(screen.getByText('Sin registros')).toBeInTheDocument()
    expect(
      screen.getByText('Los días que guarde aparecerán aquí agrupados por mes y año.'),
    ).toBeInTheDocument()
  })

  it('muestra la carga y permite recargar', () => {
    const onRecargar = vi.fn()
    const { rerender } = render(<CuadernoRojoHistorial registros={[]} cargando />)

    expect(screen.getByText('Cargando historial…')).toBeInTheDocument()

    rerender(<CuadernoRojoHistorial registros={REGISTROS} onRecargar={onRecargar} />)
    fireEvent.click(screen.getByRole('button', { name: /actualizar/i }))

    expect(onRecargar).toHaveBeenCalledTimes(1)
  })

  it('usa encabezados semánticos y nombres accesibles en Editar', () => {
    render(<CuadernoRojoHistorial registros={REGISTROS} onSeleccionar={vi.fn()} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByRole('rowheader').length).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('button', { name: 'Editar registro del 15/10/2026' }).length,
    ).toBeGreaterThan(0)
  })

  it('renderiza los filtros y notifica cambios de año, mes y restablecimiento', async () => {
    const onCambiarFiltro = vi.fn()
    const onRestablecer = vi.fn()
    render(
      <CuadernoRojoHistorial
        registros={REGISTROS}
        filtros={{ anio: '2026', mes: '' }}
        anioActual={2026}
        onCambiarFiltro={onCambiarFiltro}
        onRestablecer={onRestablecer}
      />,
    )

    expect(screen.getByText('Año')).toBeInTheDocument()
    expect(screen.getByText('Mes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Año' })).toHaveTextContent('2026')
    expect(screen.getByRole('button', { name: 'Mes' })).toHaveTextContent('Todos')

    fireEvent.click(screen.getByRole('button', { name: 'Año' }))
    fireEvent.click(await screen.findByRole('option', { name: '2000' }))
    expect(onCambiarFiltro).toHaveBeenCalledWith('anio', '2000')

    fireEvent.click(screen.getByRole('button', { name: 'Mes' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Enero' }))
    expect(onCambiarFiltro).toHaveBeenCalledWith('mes', '01')

    fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }))
    expect(onRestablecer).toHaveBeenCalledTimes(1)
  })

  it('muestra el estado vacío del período filtrado', () => {
    render(
      <CuadernoRojoHistorial
        registros={[]}
        filtros={{ anio: '2026', mes: '11' }}
        anioActual={2026}
        onCambiarFiltro={vi.fn()}
        onRestablecer={vi.fn()}
      />,
    )

    expect(screen.getByText('Sin registros en el período seleccionado')).toBeInTheDocument()
    expect(screen.getByText('Pruebe con otro año o mes.')).toBeInTheDocument()
    expect(screen.queryByText('0 días registrados.')).not.toBeInTheDocument()
    expect(screen.queryByText('Aún no hay días registrados.')).not.toBeInTheDocument()
  })

  it('abre y contrae el detalle de trazabilidad con el mismo botón', () => {
    render(<CuadernoRojoHistorial registros={REGISTROS} />)

    const tabla = screen.getByRole('table')
    const boton = within(tabla).getByRole('button', {
      name: 'Detalle del registro del 15/10/2026',
    })

    expect(boton).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(boton)
    expect(boton).toHaveAttribute('aria-expanded', 'true')

    const control = boton.getAttribute('aria-controls')
    const detalle = document.getElementById(control)

    expect(detalle).toBeInTheDocument()
    expect(within(detalle).getByText('Ana Pérez')).toBeInTheDocument()
    expect(within(detalle).getByText('Luis Gómez')).toBeInTheDocument()
    expect(within(detalle).getByText(/15:00/)).toBeInTheDocument()
    expect(
      within(detalle).getByText(
        'El sistema conserva únicamente los datos de la última actualización.',
      ),
    ).toBeInTheDocument()

    fireEvent.click(boton)
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById(control)).not.toBeInTheDocument()
  })

  it('mantiene solo un detalle abierto a la vez', () => {
    render(<CuadernoRojoHistorial registros={REGISTROS} />)

    const tabla = screen.getByRole('table')
    const botonA = within(tabla).getByRole('button', {
      name: 'Detalle del registro del 15/10/2026',
    })
    const botonB = within(tabla).getByRole('button', {
      name: 'Detalle del registro del 03/11/2026',
    })

    fireEvent.click(botonA)
    expect(within(tabla).getByText('Ana Pérez')).toBeInTheDocument()

    fireEvent.click(botonB)
    expect(botonA).toHaveAttribute('aria-expanded', 'false')
    expect(botonB).toHaveAttribute('aria-expanded', 'true')
    expect(within(tabla).queryByText('Ana Pérez')).not.toBeInTheDocument()
    expect(within(tabla).getAllByText('Archivo').length).toBeGreaterThan(0)
  })

  it('cierra el detalle al cambiar de filtros', () => {
    const onCambiarFiltro = vi.fn()
    const { rerender } = render(
      <CuadernoRojoHistorial
        registros={REGISTROS}
        filtros={{ anio: '2026', mes: '' }}
        anioActual={2026}
        onCambiarFiltro={onCambiarFiltro}
        onRestablecer={vi.fn()}
      />,
    )

    const tabla = screen.getByRole('table')
    fireEvent.click(
      within(tabla).getByRole('button', {
        name: 'Detalle del registro del 15/10/2026',
      }),
    )
    expect(within(tabla).getByText('Ana Pérez')).toBeInTheDocument()

    rerender(
      <CuadernoRojoHistorial
        registros={REGISTROS}
        filtros={{ anio: '2025', mes: '' }}
        anioActual={2026}
        onCambiarFiltro={onCambiarFiltro}
        onRestablecer={vi.fn()}
      />,
    )

    expect(screen.queryByText('Ana Pérez')).not.toBeInTheDocument()
    expect(
      within(screen.getByRole('table')).getByRole('button', {
        name: 'Detalle del registro del 15/10/2026',
      }),
    ).toHaveAttribute('aria-expanded', 'false')
  })

  it('cierra el detalle si el registro deja de estar en el listado', () => {
    const { rerender } = render(<CuadernoRojoHistorial registros={REGISTROS} />)

    const tabla = screen.getByRole('table')
    fireEvent.click(
      within(tabla).getByRole('button', {
        name: 'Detalle del registro del 15/10/2026',
      }),
    )
    expect(within(tabla).getByText('Ana Pérez')).toBeInTheDocument()

    rerender(
      <CuadernoRojoHistorial
        registros={REGISTROS.filter((registro) => registro.id !== 'oct-15')}
      />,
    )

    expect(screen.queryByText('Ana Pérez')).not.toBeInTheDocument()
  })

  it('usa No disponible para datos ausentes o una fecha inválida', () => {
    const sinDatos = {
      id: 'sin-datos',
      fecha: '2026-10-20',
      egresosHospitalarios: 1,
      sobresEmergencia: 2,
      sobresSellados: 3,
      tia: 4,
      registradoPor: null,
      actualizadoPor: '   ',
      actualizadoEn: 'no-es-fecha',
    }
    render(<CuadernoRojoHistorial registros={[sinDatos]} />)

    const tabla = screen.getByRole('table')
    const boton = within(tabla).getByRole('button', {
      name: 'Detalle del registro del 20/10/2026',
    })
    fireEvent.click(boton)

    const detalle = document.getElementById(boton.getAttribute('aria-controls'))
    expect(within(detalle).getAllByText('No disponible')).toHaveLength(3)
    expect(within(detalle).queryByText(/Invalid Date/)).not.toBeInTheDocument()
  })

  it('formatea la última actualización en America/Guatemala', () => {
    render(<CuadernoRojoHistorial registros={REGISTROS} />)

    const tabla = screen.getByRole('table')
    const boton = within(tabla).getByRole('button', {
      name: 'Detalle del registro del 03/11/2026',
    })
    fireEvent.click(boton)

    const detalle = document.getElementById(boton.getAttribute('aria-controls'))
    expect(within(detalle).getByText(/20:30/)).toBeInTheDocument()
    expect(within(detalle).queryByText(/Invalid Date/)).not.toBeInTheDocument()
  })

  it('permite editar mientras el detalle está abierto', () => {
    const onSeleccionar = vi.fn()
    render(<CuadernoRojoHistorial registros={REGISTROS} onSeleccionar={onSeleccionar} />)

    const tabla = screen.getByRole('table')
    fireEvent.click(
      within(tabla).getByRole('button', {
        name: 'Detalle del registro del 15/10/2026',
      }),
    )
    fireEvent.click(
      within(tabla).getByRole('button', {
        name: 'Editar registro del 15/10/2026',
      }),
    )

    expect(onSeleccionar).toHaveBeenCalledWith(REGISTROS[0])
  })

  it('muestra y oculta la nota del registro fuera del período', () => {
    const onCambiarFiltro = vi.fn()
    const { rerender } = render(
      <CuadernoRojoHistorial
        registros={REGISTROS}
        filtros={{ anio: '2026', mes: '11' }}
        anioActual={2026}
        onCambiarFiltro={onCambiarFiltro}
        onRestablecer={vi.fn()}
        registroEnEdicion="2026-10-15"
      />,
    )

    expect(
      screen.getByText('El registro que está editando no pertenece al período seleccionado.'),
    ).toBeInTheDocument()

    rerender(
      <CuadernoRojoHistorial
        registros={REGISTROS}
        filtros={{ anio: '2026', mes: '10' }}
        anioActual={2026}
        onCambiarFiltro={onCambiarFiltro}
        onRestablecer={vi.fn()}
        registroEnEdicion="2026-10-15"
      />,
    )

    expect(
      screen.queryByText('El registro que está editando no pertenece al período seleccionado.'),
    ).not.toBeInTheDocument()
  })
})
