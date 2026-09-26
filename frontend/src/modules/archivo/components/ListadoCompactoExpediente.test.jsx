import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ListadoCompactoExpediente from './ListadoCompactoExpediente.jsx'

const EXPEDIENTE = {
  id: 1,
  pacienteNombre: 'María Fernanda López García',
  numeroExpediente: 'EXP-004521',
  clinicaNombre: 'Clínica 01 - Medicina General',
  medicoNombre: 'Dr. Jorge Castillo',
  horaEstimada: '10:20:00',
  ubicacion: 'Estante A · Fila 3 · Caja 12',
  estado: 'pendiente_localizar',
}

function renderFila(props = {}) {
  return render(
    <ul>
      <ListadoCompactoExpediente expediente={EXPEDIENTE} onToggle={() => {}} {...props} />
    </ul>,
  )
}

describe('ListadoCompactoExpediente', () => {
  it('prioriza el número de expediente', () => {
    renderFila()

    expect(screen.getByText('EXP-004521')).toBeInTheDocument()
  })

  it('muestra información secundaria discreta: paciente, ubicación y hora', () => {
    renderFila()

    expect(screen.getByText('María Fernanda López García')).toBeInTheDocument()
    expect(screen.getByText('Estante A · Fila 3 · Caja 12')).toBeInTheDocument()
    expect(screen.getByText('10:20')).toBeInTheDocument()
  })

  it('no muestra la clínica ni el médico en la fila', () => {
    renderFila()

    expect(screen.queryByText('Clínica 01 - Medicina General')).not.toBeInTheDocument()
    expect(screen.queryByText('Dr. Jorge Castillo')).not.toBeInTheDocument()
  })

  it('inicia con el checkbox sin marcar y con nombre accesible', () => {
    renderFila()

    const checkbox = screen.getByRole('checkbox', {
      name: /seleccionar expediente EXP-004521 de María Fernanda López García/i,
    })
    expect(checkbox).not.toBeChecked()
  })

  it('refleja el estado seleccionado', () => {
    renderFila({ seleccionado: true })

    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(screen.getByRole('listitem')).toHaveAttribute('data-seleccionado', 'true')
  })

  it('resalta la fila encontrada por el buscador sin marcarla', () => {
    renderFila({ resaltado: true })

    const fila = screen.getByRole('listitem')
    expect(fila).toHaveAttribute('data-resaltado', 'true')
    expect(fila).toHaveAttribute('data-seleccionado', 'false')
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(screen.getByText('Resultado de búsqueda')).toBeInTheDocument()
  })

  it('notifica el toggle con el id de la fila', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    renderFila({ onToggle })

    await user.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith(EXPEDIENTE.id)
  })

  it('no muestra los textos legacy de expediente nuevo', () => {
    renderFila()

    expect(screen.queryByText('Sin expediente físico')).not.toBeInTheDocument()
    expect(screen.queryByText('Expediente nuevo')).not.toBeInTheDocument()
    expect(screen.queryByText('Crear expediente físico')).not.toBeInTheDocument()
  })

  it('no falla con textos largos', () => {
    const largo = 'Paciente con nombres y apellidos extremadamente largos '.repeat(4).trim()
    renderFila({
      expediente: {
        ...EXPEDIENTE,
        pacienteNombre: largo,
        ubicacion: largo,
      },
    })

    expect(screen.getByRole('listitem')).toBeInTheDocument()
    expect(screen.getAllByText(largo).length).toBeGreaterThan(0)
  })
})
