import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import TablaDepurados from './TablaDepurados.jsx'

const MOTIVO_LARGO =
  'Expediente extraviado definitivamente tras revisión completa de estantería y bodega'
const NOMBRE_LARGO = 'María Fernanda López García de la Cruz con un nombre extremadamente largo'

const REGISTROS = [
  {
    id: 'a',
    numeroExpediente: '927581',
    pacienteNombre: NOMBRE_LARGO,
    usuarioNombre: 'Lic. Archivo Central',
    motivo: MOTIVO_LARGO,
    depuradoEn: '2026-11-02T15:30:00-06:00',
  },
  {
    id: 'b',
    numeroExpediente: '30954',
    pacienteNombre: 'Juan Pérez',
    usuarioNombre: 'Ana López',
    motivo: null,
    depuradoEn: '2026-11-02T14:05:00-06:00',
  },
]

function filasDeTabla() {
  return within(screen.getByRole('table')).getAllByRole('row')
}

describe('TablaDepurados', () => {
  it('muestra el encabezado, el total y el estado vacío sin representaciones', () => {
    render(<TablaDepurados depurados={[]} />)

    expect(screen.getByRole('heading', { name: 'Depurados hoy', level: 3 })).toBeInTheDocument()
    expect(screen.getByText('Total: 0')).toBeInTheDocument()
    expect(screen.getByText(/aún no hay expedientes depurados hoy/i)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /tarjetas/i })).not.toBeInTheDocument()
  })

  it('renderiza la tabla de escritorio con fecha, hora y el orden recibido', () => {
    render(<TablaDepurados depurados={REGISTROS} />)

    const tabla = screen.getByRole('table')
    expect(tabla).toHaveAccessibleName(/expedientes depurados hoy/i)
    const encabezados = within(tabla)
      .getAllByRole('columnheader')
      .map((celda) => celda.textContent)
    expect(encabezados).toEqual(['Fecha', 'Hora', 'Expediente', 'Paciente', 'Usuario', 'Motivo'])
    for (const encabezado of within(tabla).getAllByRole('columnheader')) {
      expect(encabezado).toHaveAttribute('scope', 'col')
    }

    const filas = filasDeTabla()
    expect(filas).toHaveLength(3)

    const primera = within(filas[1]).getAllByRole('cell')
    expect(primera).toHaveLength(6)
    expect(primera[0]).toHaveTextContent('02/11/2026')
    expect(primera[1].textContent).toMatch(/\d{2}:\d{2}/)
    expect(primera[2]).toHaveTextContent('9275-81')
    expect(primera[3]).toHaveTextContent(NOMBRE_LARGO)
    expect(primera[4]).toHaveTextContent('Lic. Archivo Central')
    expect(primera[5]).toHaveTextContent(MOTIVO_LARGO)

    const segunda = within(filas[2]).getAllByRole('cell')
    expect(segunda[0]).toHaveTextContent('02/11/2026')
    expect(segunda[2]).toHaveTextContent('3095-4')
    expect(segunda[3]).toHaveTextContent('Juan Pérez')
  })

  it('renderiza las tarjetas móviles con los mismos datos y sin duplicar registros', () => {
    render(<TablaDepurados depurados={REGISTROS} />)

    const lista = screen.getByRole('list', { name: /tarjetas/i })
    const tarjetas = within(lista).getAllByRole('listitem')
    expect(tarjetas).toHaveLength(2)

    expect(tarjetas[0]).toHaveTextContent('9275-81')
    expect(tarjetas[0]).toHaveTextContent(NOMBRE_LARGO)
    expect(tarjetas[0]).toHaveTextContent('Lic. Archivo Central')
    expect(tarjetas[0]).toHaveTextContent(MOTIVO_LARGO)
    expect(tarjetas[0]).toHaveTextContent('02/11/2026')
    expect(within(tarjetas[0]).getByText('Fecha de depuración:')).toBeInTheDocument()
    expect(within(tarjetas[0]).getByText('Hora de depuración:')).toBeInTheDocument()

    expect(tarjetas[1]).toHaveTextContent('3095-4')
    expect(tarjetas[1]).toHaveTextContent('Juan Pérez')
    expect(within(tarjetas[1]).getByText('—')).toBeInTheDocument()
  })

  it('conserva completos los nombres y motivos largos en ambas representaciones', () => {
    render(<TablaDepurados depurados={REGISTROS} />)

    expect(screen.getAllByText(NOMBRE_LARGO)).toHaveLength(2)
    expect(screen.getAllByText(MOTIVO_LARGO)).toHaveLength(2)
  })

  it('no agrega columnas ni datos clínicos', () => {
    render(<TablaDepurados depurados={REGISTROS} />)

    expect(within(screen.getByRole('table')).getAllByRole('columnheader')).toHaveLength(6)
    expect(screen.queryByText(/dpi/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/diagnóstico/i)).not.toBeInTheDocument()
  })

  it('muestra el total completo del período y lo marca cuando es parcial o está desactualizado', () => {
    const { rerender } = render(<TablaDepurados depurados={REGISTROS} total={25} />)

    expect(screen.getByText('Total: 25')).toBeInTheDocument()

    rerender(<TablaDepurados depurados={REGISTROS} total={6} consultaIncompleta />)
    expect(screen.getByText('Parcial: 6')).toBeInTheDocument()

    rerender(<TablaDepurados depurados={REGISTROS} total={6} desactualizado />)
    expect(screen.getByText(/total: 6 · puede estar desactualizado/i)).toBeInTheDocument()
  })

  it('permite personalizar el título y el mensaje vacío del período', () => {
    render(
      <TablaDepurados
        depurados={[]}
        titulo="Depurados de la semana"
        descripcion="Semana del 2 al 8 de noviembre de 2026"
        sinRegistros="No hay expedientes depurados en esta semana"
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Depurados de la semana', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Semana del 2 al 8 de noviembre de 2026')).toBeInTheDocument()
    expect(screen.getByText('No hay expedientes depurados en esta semana')).toBeInTheDocument()
  })

  it('muestra coincidencias y conserva el total del período con búsqueda', () => {
    render(
      <TablaDepurados
        depurados={REGISTROS.slice(0, 1)}
        total={18}
        totalCoincidencias={1}
        busquedaActiva
      />,
    )

    expect(screen.getByText('Mostrando 1 de 18')).toBeInTheDocument()
    expect(screen.queryByText('Total: 18')).not.toBeInTheDocument()
  })

  it('usa contenedores internos desplazables y etiquetados', () => {
    render(<TablaDepurados depurados={REGISTROS} />)

    const region = screen.getByRole('region', {
      name: 'Listado de expedientes depurados, desplazable',
    })
    expect(region).toHaveClass('max-h-[460px]')
    expect(region).toHaveClass('overflow-auto')
    expect(region).toHaveAttribute('tabindex', '0')
    expect(within(region).getAllByRole('columnheader')[0]).toHaveClass('sticky')

    const tarjetas = screen.getByRole('list', { name: /tarjetas/i })
    expect(tarjetas).toHaveClass('max-h-[60vh]')
    expect(tarjetas).toHaveAttribute('tabindex', '0')
  })

  it('conserva cadenas largas sin espacios en tabla y tarjetas', () => {
    const registro = {
      id: 'c',
      numeroExpediente: '123456789012',
      pacienteNombre: 'B'.repeat(90),
      usuarioNombre: 'U'.repeat(40),
      motivo: 'A'.repeat(120),
      depuradoEn: '2026-11-02T15:30:00-06:00',
    }

    render(<TablaDepurados depurados={[registro]} />)

    expect(screen.getAllByText(registro.pacienteNombre)).toHaveLength(2)
    expect(screen.getAllByText(registro.motivo)).toHaveLength(2)
    expect(screen.getAllByText(registro.usuarioNombre)).toHaveLength(2)
  })
})
