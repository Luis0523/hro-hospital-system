import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HistorialRecetarios from './HistorialRecetarios.jsx'

function entrada({ id, expediente, nombre }) {
  return {
    id,
    generadoEn: '2026-11-03T20:00:00.000Z',
    formato: '2',
    expediente,
    pacienteNombre: nombre,
    solicitud: {
      paciente: { numeroExpediente: expediente, nombres: nombre, apellidos: '' },
      fecha: '2026-11-03',
      cama: '3',
      servicio: 'Medicina Interna',
      diagnostico: 'Neumonía',
      medicoNombre: 'Dra. Ana Pérez',
      medicamentos: [
        {
          id: 'medicamento-1',
          nombre: 'Amoxicilina',
          dosis: '500 mg',
          via: 'Oral',
          frecuencia: 'Cada 8 horas',
          fechaHoraInicio: '2026-11-01T08:00',
          cantidadSolicitada: 21,
        },
      ],
      observaciones: '',
    },
  }
}

const ENTRADAS = [
  entrada({ id: '1', expediente: '837871', nombre: 'Adolfo Martín Ajucum Cua' }),
  entrada({ id: '2', expediente: '41002', nombre: 'María Elena Gómez' }),
]

describe('HistorialRecetarios', () => {
  it('filtra por número de expediente', async () => {
    const user = userEvent.setup()
    render(<HistorialRecetarios entradas={ENTRADAS} onReimprimir={vi.fn()} onLimpiar={vi.fn()} />)

    expect(screen.getByText('Adolfo Martín Ajucum Cua')).toBeInTheDocument()
    expect(screen.getByText('María Elena Gómez')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/buscar recetario por número de expediente/i), '837871')

    expect(screen.getByText('Adolfo Martín Ajucum Cua')).toBeInTheDocument()
    expect(screen.queryByText('María Elena Gómez')).not.toBeInTheDocument()
    expect(screen.getByText(/1 de 2 recetarios/)).toBeInTheDocument()
  })

  it('también filtra por nombre y muestra vacío sin coincidencias', async () => {
    const user = userEvent.setup()
    render(<HistorialRecetarios entradas={ENTRADAS} onReimprimir={vi.fn()} onLimpiar={vi.fn()} />)

    const buscador = screen.getByLabelText(/buscar recetario por número de expediente/i)
    await user.type(buscador, 'María Elena')

    expect(screen.getByText('María Elena Gómez')).toBeInTheDocument()
    expect(screen.queryByText('Adolfo Martín Ajucum Cua')).not.toBeInTheDocument()

    await user.clear(buscador)
    await user.type(buscador, '999999')

    expect(screen.getByText('Sin coincidencias')).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando no hay historial', () => {
    render(<HistorialRecetarios entradas={[]} onReimprimir={vi.fn()} onLimpiar={vi.fn()} />)

    expect(screen.getByText('Sin recetarios en el historial')).toBeInTheDocument()
  })
})
