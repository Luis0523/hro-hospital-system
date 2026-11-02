import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import TablaDepurados from './TablaDepurados.jsx'

const MOTIVO_LARGO =
  'Expediente extraviado definitivamente tras revisión completa de estantería y bodega'
const NOMBRE_LARGO = 'María Fernanda López García de la Cruz con un nombre extremadamente largo'

const REGISTROS = [
  {
    id: 'a',
    numeroExpediente: 'EXP-2024-035',
    pacienteNombre: NOMBRE_LARGO,
    usuarioNombre: 'Lic. Archivo Central',
    motivo: MOTIVO_LARGO,
    depuradoEn: '2026-11-02T15:30:00-06:00',
  },
  {
    id: 'b',
    numeroExpediente: '927581',
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

  it('renderiza la tabla de escritorio con los cinco datos y el orden recibido', () => {
    render(<TablaDepurados depurados={REGISTROS} />)

    const tabla = screen.getByRole('table')
    expect(tabla).toHaveAccessibleName(/expedientes depurados hoy/i)
    const encabezados = within(tabla)
      .getAllByRole('columnheader')
      .map((celda) => celda.textContent)
    expect(encabezados).toEqual(['Hora', 'Expediente', 'Paciente', 'Usuario', 'Motivo'])
    for (const encabezado of within(tabla).getAllByRole('columnheader')) {
      expect(encabezado).toHaveAttribute('scope', 'col')
    }

    const filas = filasDeTabla()
    expect(filas).toHaveLength(3)

    const primera = within(filas[1]).getAllByRole('cell')
    expect(primera).toHaveLength(5)
    expect(primera[0].textContent).toMatch(/\d{2}:\d{2}/)
    expect(primera[1]).toHaveTextContent('EXP-2024-035')
    expect(primera[2]).toHaveTextContent(NOMBRE_LARGO)
    expect(primera[3]).toHaveTextContent('Lic. Archivo Central')
    expect(primera[4]).toHaveTextContent(MOTIVO_LARGO)

    const segunda = within(filas[2]).getAllByRole('cell')
    expect(segunda[1]).toHaveTextContent('9275-81')
    expect(segunda[2]).toHaveTextContent('Juan Pérez')
  })

  it('renderiza las tarjetas móviles con los mismos datos y sin duplicar registros', () => {
    render(<TablaDepurados depurados={REGISTROS} />)

    const lista = screen.getByRole('list', { name: /tarjetas/i })
    const tarjetas = within(lista).getAllByRole('listitem')
    expect(tarjetas).toHaveLength(2)

    expect(tarjetas[0]).toHaveTextContent('EXP-2024-035')
    expect(tarjetas[0]).toHaveTextContent(NOMBRE_LARGO)
    expect(tarjetas[0]).toHaveTextContent('Lic. Archivo Central')
    expect(tarjetas[0]).toHaveTextContent(MOTIVO_LARGO)
    expect(within(tarjetas[0]).getByText('Hora de depuración:')).toBeInTheDocument()

    expect(tarjetas[1]).toHaveTextContent('9275-81')
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

    expect(within(screen.getByRole('table')).getAllByRole('columnheader')).toHaveLength(5)
    expect(screen.queryByText(/dpi/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/diagnóstico/i)).not.toBeInTheDocument()
  })

  it('conserva cadenas largas sin espacios en tabla y tarjetas', () => {
    const registro = {
      id: 'c',
      numeroExpediente: 'EXP-LARGO-1',
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
