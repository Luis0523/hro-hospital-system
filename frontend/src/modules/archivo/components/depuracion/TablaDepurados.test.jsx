import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import TablaDepurados from './TablaDepurados.jsx'

const NOMBRE_LARGO = 'María Fernanda López García de la Cruz con un nombre extremadamente largo'

const REGISTROS = [
  {
    id: 'a',
    numeroExpediente: '927581',
    pacienteNombre: NOMBRE_LARGO,
    usuarioNombre: 'Lic. Archivo Central',
    motivo: 'Expediente extraviado',
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
  it('muestra la cabecera, el total y el estado vacío sin representaciones', () => {
    render(<TablaDepurados depurados={[]} />)

    expect(screen.getByRole('heading', { name: 'Depurados de hoy', level: 3 })).toBeInTheDocument()
    expect(screen.getByText('Total: 0')).toBeInTheDocument()
    expect(screen.getByText(/aún no hay expedientes depurados hoy/i)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /tarjetas/i })).not.toBeInTheDocument()
  })

  it('renderiza exactamente las columnas Expediente, Paciente y Hora', () => {
    render(<TablaDepurados depurados={REGISTROS} />)

    const tabla = screen.getByRole('table')
    const encabezados = within(tabla)
      .getAllByRole('columnheader')
      .map((celda) => celda.textContent)
    expect(encabezados).toEqual(['EXPEDIENTE', 'PACIENTE', 'HORA'])
    for (const encabezado of within(tabla).getAllByRole('columnheader')) {
      expect(encabezado).toHaveAttribute('scope', 'col')
    }

    const filas = filasDeTabla()
    expect(filas).toHaveLength(3)

    const primera = within(filas[1]).getAllByRole('cell')
    expect(primera).toHaveLength(3)
    expect(primera[0]).toHaveTextContent('9275-81')
    expect(primera[1]).toHaveTextContent(NOMBRE_LARGO)
    expect(primera[2].textContent).toMatch(/\d{2}:\d{2}/)
    expect(segunda(filas)).toHaveLength(3)
  })

  it('muestra la fecha secundaria dentro de Hora solo para rangos de varios días', () => {
    const { rerender } = render(<TablaDepurados depurados={REGISTROS} />)
    expect(screen.queryByText('02/11/2026')).not.toBeInTheDocument()

    rerender(<TablaDepurados depurados={REGISTROS} mostrarFecha />)
    expect(screen.getAllByText('02/11/2026')).toHaveLength(4)
    expect(within(screen.getByRole('table')).getAllByRole('columnheader')).toHaveLength(3)
  })

  it('renderiza las tarjetas móviles con los mismos tres datos', () => {
    render(<TablaDepurados depurados={REGISTROS} />)

    const lista = screen.getByRole('list', { name: /tarjetas/i })
    const tarjetas = within(lista).getAllByRole('listitem')
    expect(tarjetas).toHaveLength(2)

    expect(tarjetas[0]).toHaveTextContent('9275-81')
    expect(tarjetas[0]).toHaveTextContent(NOMBRE_LARGO)
    expect(tarjetas[0]).toHaveTextContent(/\d{2}:\d{2}/)
    expect(tarjetas[0]).not.toHaveTextContent('Lic. Archivo Central')
    expect(tarjetas[0]).not.toHaveTextContent('Expediente extraviado')
    expect(tarjetas[0]).not.toHaveTextContent('02/11/2026')

    expect(tarjetas[1]).toHaveTextContent('3095-4')
    expect(tarjetas[1]).toHaveTextContent('Juan Pérez')
  })

  it('muestra fecha y hora en tarjetas cuando el rango incluye varios días', () => {
    render(<TablaDepurados depurados={REGISTROS} mostrarFecha />)

    const tarjetas = within(screen.getByRole('list', { name: /tarjetas/i })).getAllByRole(
      'listitem',
    )
    expect(tarjetas[0]).toHaveTextContent('02/11/2026')
    expect(within(tarjetas[0]).getByText('Fecha de depuración:')).toBeInTheDocument()
  })

  it('conserva nombres largos sin agregar usuario ni motivo', () => {
    render(<TablaDepurados depurados={REGISTROS} />)

    expect(screen.getAllByText(NOMBRE_LARGO)).toHaveLength(2)
    expect(screen.queryByText('Lic. Archivo Central')).not.toBeInTheDocument()
    expect(screen.queryByText('Expediente extraviado')).not.toBeInTheDocument()
  })

  it('muestra el total completo del período y lo marca cuando es parcial o está desactualizado', () => {
    const { rerender } = render(<TablaDepurados depurados={REGISTROS} total={25} />)
    expect(screen.getByText('Total: 25')).toBeInTheDocument()

    rerender(<TablaDepurados depurados={REGISTROS} total={6} consultaIncompleta />)
    expect(screen.getByText('Parcial: 6')).toBeInTheDocument()

    rerender(<TablaDepurados depurados={REGISTROS} total={6} desactualizado />)
    expect(screen.getByText(/total: 6 · puede estar desactualizado/i)).toBeInTheDocument()
  })

  it('permite personalizar el título, el mensaje vacío y las acciones de cabecera', () => {
    render(
      <TablaDepurados
        depurados={[]}
        titulo="Depurados de la semana"
        descripcion="Semana del 2 al 8 de noviembre de 2026"
        sinRegistros="No hay expedientes depurados en esta semana"
        acciones={<button type="button">Descargar PDF</button>}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Depurados de la semana', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Semana del 2 al 8 de noviembre de 2026')).toBeInTheDocument()
    expect(screen.getByText('No hay expedientes depurados en esta semana')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar PDF' })).toBeInTheDocument()
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

  it('usa contenedores internos desplazables y etiquetados con encabezados sticky', () => {
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
    expect(screen.queryByText(registro.motivo)).not.toBeInTheDocument()
    expect(screen.queryByText(registro.usuarioNombre)).not.toBeInTheDocument()
  })

  it('no agrega columnas ni datos clínicos', () => {
    render(<TablaDepurados depurados={REGISTROS} />)

    expect(within(screen.getByRole('table')).getAllByRole('columnheader')).toHaveLength(3)
    expect(screen.queryByText(/dpi/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/diagnóstico/i)).not.toBeInTheDocument()
  })
})

function segunda(filas) {
  return within(filas[2]).getAllByRole('cell')
}
