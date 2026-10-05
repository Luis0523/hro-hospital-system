import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TablaCitasCapturadas from './TablaCitasCapturadas.jsx'

function fila({
  idLocal,
  numeroExpediente,
  nombrePaciente,
  fecha,
  especialidadId,
  especialidadNombre,
}) {
  return {
    idLocal,
    numeroExpediente,
    pacienteId: 'pac-id-interno',
    nombrePaciente,
    fecha,
    especialidadId,
    especialidadNombre,
  }
}

const F1 = fila({
  idLocal: '1323-23|2026-10-04|1',
  numeroExpediente: '1323-23',
  nombrePaciente: 'Paciente Demo Uno',
  fecha: '2026-10-04',
  especialidadId: 1,
  especialidadNombre: 'Medicina Interna',
})

const F2 = fila({
  idLocal: '1401-24|2026-10-04|2',
  numeroExpediente: '1401-24',
  nombrePaciente: 'Paciente Demo Dos',
  fecha: '2026-10-04',
  especialidadId: 2,
  especialidadNombre: 'Medicina General',
})

describe('TablaCitasCapturadas', () => {
  it('muestra el estado vacío sin tabla', () => {
    render(<TablaCitasCapturadas filas={[]} onEliminar={vi.fn()} />)

    expect(screen.getByText('No hay citas agregadas.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('muestra expediente, nombre, fecha y especialidad', () => {
    render(<TablaCitasCapturadas filas={[F1]} onEliminar={vi.fn()} />)

    const row = screen.getByTestId(`fila-cita-${F1.idLocal}`)
    expect(within(row).getByText('1323-23')).toBeInTheDocument()
    expect(within(row).getByText('Paciente Demo Uno')).toBeInTheDocument()
    expect(within(row).getByText('2026-10-04')).toBeInTheDocument()
    expect(within(row).getByText('Medicina Interna')).toBeInTheDocument()
  })

  it('no muestra pacienteId ni idLocal', () => {
    render(<TablaCitasCapturadas filas={[F1]} onEliminar={vi.fn()} />)

    expect(screen.queryByText('pac-id-interno')).not.toBeInTheDocument()
    expect(screen.queryByText(F1.idLocal)).not.toBeInTheDocument()
  })

  it('expone un botón Eliminar contextual y accesible', () => {
    render(<TablaCitasCapturadas filas={[F1]} onEliminar={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Eliminar expediente 1323-23' })).toBeInTheDocument()
  })

  it('eliminar llama a onEliminar con el idLocal correcto', async () => {
    const onEliminar = vi.fn()
    render(<TablaCitasCapturadas filas={[F1, F2]} onEliminar={onEliminar} />)

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar expediente 1401-24' }))

    expect(onEliminar).toHaveBeenCalledTimes(1)
    expect(onEliminar).toHaveBeenCalledWith(F2.idLocal)
  })

  it('muestra múltiples filas', () => {
    render(<TablaCitasCapturadas filas={[F1, F2]} onEliminar={vi.fn()} />)

    // 1 fila de encabezado + 2 de datos
    expect(screen.getAllByRole('row')).toHaveLength(3)
  })
})
