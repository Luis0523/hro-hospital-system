import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TablaMovimientosExternos from './TablaMovimientosExternos.jsx'
import { MODO_VERIFICACION_REAL } from '../../api/verificacionExpedienteApi'

const HOY = '2026-11-02'

function registro(overrides = {}) {
  return {
    id: 'se-1',
    numeroExpediente: '927581',
    personaRetira: 'Ana Ramírez',
    motivo: 'Tesis',
    fechaSalida: '2026-11-02T15:00:00.000Z',
    fechaDevolucion: null,
    registradoPor: 'archivo-01',
    recuperadoManualmente: false,
    ...overrides,
  }
}

function propiedades(overrides = {}) {
  return {
    registros: [],
    vista: 'todos',
    onCambiarVista: vi.fn(),
    busquedaLocal: '',
    onBuscar: vi.fn(),
    cargando: false,
    errorCarga: null,
    onReintentar: vi.fn(),
    hoy: HOY,
    ...overrides,
  }
}

describe('TablaMovimientosExternos', () => {
  it('muestra encabezados y datos del movimiento', () => {
    render(<TablaMovimientosExternos {...propiedades({ registros: [registro()] })} />)

    const tabla = screen.getByRole('table')
    for (const encabezado of [
      'Expediente',
      'Persona',
      'Motivo',
      'Préstamo',
      'Devolución',
      'Estado',
    ]) {
      expect(within(tabla).getByRole('columnheader', { name: encabezado })).toBeInTheDocument()
    }

    expect(within(tabla).getByText('9275-81')).toBeInTheDocument()
    expect(within(tabla).getByText('Ana Ramírez')).toBeInTheDocument()
    expect(within(tabla).getByText('Tesis')).toBeInTheDocument()
    expect(within(tabla).getByText('02/11/2026 09:00')).toBeInTheDocument()
    expect(within(tabla).getByText('Pendiente')).toBeInTheDocument()
    expect(within(tabla).getByText('—')).toBeInTheDocument()
  })

  it('respeta la presentación del ingreso manual', () => {
    render(
      <TablaMovimientosExternos
        {...propiedades({
          registros: [
            registro({ numeroExpediente: '911330', numeroExpedientePresentacion: '91-1330' }),
          ],
        })}
      />,
    )

    expect(within(screen.getByRole('table')).getByText('91-1330')).toBeInTheDocument()
  })

  it('muestra el estado devuelto con su fecha', () => {
    render(
      <TablaMovimientosExternos
        {...propiedades({
          registros: [registro({ fechaDevolucion: '2026-11-02T18:00:00.000Z' })],
        })}
      />,
    )

    const tabla = screen.getByRole('table')
    expect(within(tabla).getByText('Devuelto')).toBeInTheDocument()
    expect(within(tabla).getByText('02/11/2026 12:00')).toBeInTheDocument()
    expect(within(tabla).queryByText('Pendiente')).not.toBeInTheDocument()
  })

  it('marca los registros recuperados manualmente sin cambiar el estado', () => {
    render(
      <TablaMovimientosExternos
        {...propiedades({ registros: [registro({ recuperadoManualmente: true })] })}
      />,
    )

    const tabla = screen.getByRole('table')
    expect(within(tabla).getByText('Pendiente')).toBeInTheDocument()
    expect(within(tabla).getByText('Recuperado')).toBeInTheDocument()
  })

  it('identifica los pendientes de días anteriores', () => {
    render(
      <TablaMovimientosExternos
        {...propiedades({
          vista: 'pendientes',
          registros: [registro({ fechaSalida: '2026-10-30T15:00:00.000Z' })],
        })}
      />,
    )

    const tabla = screen.getByRole('table')
    expect(within(tabla).getByText('Días anteriores')).toBeInTheDocument()
    expect(within(tabla).getByText('30/10/2026 09:00')).toBeInTheDocument()
  })

  it('no marca como anterior un préstamo del mismo día', () => {
    render(
      <TablaMovimientosExternos
        {...propiedades({ vista: 'pendientes', registros: [registro()] })}
      />,
    )

    expect(within(screen.getByRole('table')).queryByText('Días anteriores')).not.toBeInTheDocument()
  })

  it('respeta el orden recibido del hook', () => {
    render(
      <TablaMovimientosExternos
        {...propiedades({
          registros: [
            registro({
              id: 'devuelto',
              numeroExpediente: '111111',
              fechaDevolucion: '2026-11-02T18:00:00.000Z',
            }),
            registro({ id: 'pendiente', numeroExpediente: '222222' }),
          ],
        })}
      />,
    )

    const filas = within(screen.getByRole('table')).getAllByRole('row')
    // Fila 0 = encabezado; la devolución más reciente va primero.
    expect(within(filas[1]).getByText('1111-11')).toBeInTheDocument()
    expect(within(filas[2]).getByText('2222-22')).toBeInTheDocument()
  })

  it('muestra el estado vacío según la vista', () => {
    const { rerender } = render(<TablaMovimientosExternos {...propiedades()} />)
    expect(screen.getByText('No hay movimientos')).toBeInTheDocument()
    expect(
      screen.getByText('Aún no hay movimientos de la jornada ni préstamos pendientes.'),
    ).toBeInTheDocument()

    rerender(<TablaMovimientosExternos {...propiedades({ vista: 'pendientes' })} />)
    expect(screen.getByText('No hay préstamos pendientes de devolución.')).toBeInTheDocument()

    rerender(<TablaMovimientosExternos {...propiedades({ vista: 'devueltos' })} />)
    expect(
      screen.getByText('Todavía no se han registrado devoluciones en esta sesión.'),
    ).toBeInTheDocument()
  })

  it('distingue la búsqueda sin coincidencias', () => {
    render(<TablaMovimientosExternos {...propiedades({ busquedaLocal: 'no-existe' })} />)

    expect(screen.getByText('No se encontraron coincidencias')).toBeInTheDocument()
    expect(screen.queryByText('No hay movimientos')).not.toBeInTheDocument()
  })

  it('muestra el estado de carga cuando no hay datos', () => {
    render(<TablaMovimientosExternos {...propiedades({ cargando: true })} />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando movimientos')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('mantiene la tabla visible mientras actualiza', () => {
    render(
      <TablaMovimientosExternos {...propiedades({ cargando: true, registros: [registro()] })} />,
    )

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText(/actualizando/i)).toBeInTheDocument()
  })

  it('muestra el error y permite reintentar', async () => {
    const props = propiedades({
      errorCarga: { codigo: null, status: null, mensaje: 'Falla simulada' },
    })
    const usuario = userEvent.setup()
    render(<TablaMovimientosExternos {...props} />)

    expect(screen.getByText('No se pudieron cargar los movimientos')).toBeInTheDocument()
    expect(screen.getByText('Falla simulada')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /Reintentar/ }))
    expect(props.onReintentar).toHaveBeenCalledTimes(1)
  })

  it('permite cambiar de vista con botones accesibles', async () => {
    const props = propiedades({ registros: [registro()] })
    const usuario = userEvent.setup()
    render(<TablaMovimientosExternos {...props} />)

    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Pendientes' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Devueltos' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    await usuario.click(screen.getByRole('button', { name: 'Devueltos' }))
    expect(props.onCambiarVista).toHaveBeenCalledWith('devueltos')
  })

  it('filtra por el campo de búsqueda accesible', async () => {
    const props = propiedades({ registros: [registro()] })
    const usuario = userEvent.setup()
    render(<TablaMovimientosExternos {...props} />)

    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar movimientos' }), 'ana')

    expect(props.onBuscar).toHaveBeenCalled()
  })

  it('presenta tarjetas con la misma información en móvil', () => {
    render(
      <TablaMovimientosExternos
        {...propiedades({
          registros: [registro({ fechaDevolucion: '2026-11-02T18:00:00.000Z' })],
        })}
      />,
    )

    const listado = screen.getByRole('list', { name: 'Movimientos de expedientes' })
    expect(within(listado).getByText('9275-81')).toBeInTheDocument()
    expect(within(listado).getByText('Ana Ramírez')).toBeInTheDocument()
    expect(within(listado).getByText('Tesis')).toBeInTheDocument()
    expect(within(listado).getByText('Devuelto')).toBeInTheDocument()
    expect(within(listado).getByText('02/11/2026 09:00')).toBeInTheDocument()
    expect(within(listado).getByText('02/11/2026 12:00')).toBeInTheDocument()
  })

  it('en simulación indica que el paciente no se verificó (tabla y tarjetas)', () => {
    render(<TablaMovimientosExternos {...propiedades({ registros: [registro()] })} />)

    const tabla = screen.getByRole('table')
    const listado = screen.getByRole('list', { name: 'Movimientos de expedientes' })

    expect(within(tabla).getByText('Paciente: no verificado')).toBeInTheDocument()
    expect(within(listado).getByText('Paciente: no verificado')).toBeInTheDocument()
  })

  it('muestra el nombre del paciente resuelto en esta sesión', () => {
    render(
      <TablaMovimientosExternos
        {...propiedades({
          registros: [registro()],
          nombresPacientes: {
            927581: { estado: 'disponible', nombre: 'María Ejemplo López' },
          },
        })}
      />,
    )

    const tabla = screen.getByRole('table')
    const listado = screen.getByRole('list', { name: 'Movimientos de expedientes' })

    expect(within(tabla).getByText('Paciente: María Ejemplo López')).toBeInTheDocument()
    expect(within(listado).getByText('Paciente: María Ejemplo López')).toBeInTheDocument()
    // El número sigue siendo el dato principal de la fila.
    expect(within(tabla).getByText('9275-81')).toBeInTheDocument()
  })

  it('con verificación real sin nombre resuelto indica no disponible', () => {
    render(
      <TablaMovimientosExternos
        {...propiedades({
          registros: [registro()],
          modoVerificacion: MODO_VERIFICACION_REAL,
        })}
      />,
    )

    expect(
      within(screen.getByRole('table')).getByText('Paciente: no disponible'),
    ).toBeInTheDocument()
  })

  it('no confunde a la persona que retira con el paciente propietario', () => {
    render(
      <TablaMovimientosExternos
        {...propiedades({
          registros: [registro({ personaRetira: 'Ana Ramírez' })],
          modoVerificacion: MODO_VERIFICACION_REAL,
        })}
      />,
    )

    const tabla = screen.getByRole('table')
    expect(within(tabla).queryByText('Paciente: Ana Ramírez')).not.toBeInTheDocument()
    expect(within(tabla).getByText('Paciente: no disponible')).toBeInTheDocument()
  })

  it('permite que un nombre largo envuelva sin desbordar', () => {
    const nombreLargo =
      'María de los Ángeles Fernanda del Rosario López de la Cruz y Martínez de León'
    render(
      <TablaMovimientosExternos
        {...propiedades({
          registros: [registro()],
          nombresPacientes: { 927581: { estado: 'disponible', nombre: nombreLargo } },
        })}
      />,
    )

    const linea = within(screen.getByRole('table')).getByText(`Paciente: ${nombreLargo}`)
    expect(linea).toHaveClass('break-words')
    expect(linea).toHaveClass('text-label-sm')
  })

  it('mantiene el nombre en las tres vistas', () => {
    for (const vista of ['todos', 'pendientes', 'devueltos']) {
      const { unmount } = render(
        <TablaMovimientosExternos
          {...propiedades({
            vista,
            registros: [
              registro({
                fechaDevolucion: vista === 'devueltos' ? '2026-11-02T18:00:00.000Z' : null,
              }),
            ],
            nombresPacientes: {
              927581: { estado: 'disponible', nombre: 'María Ejemplo López' },
            },
          })}
        />,
      )

      expect(
        within(screen.getByRole('table')).getByText('Paciente: María Ejemplo López'),
      ).toBeInTheDocument()
      unmount()
    }
  })
})
