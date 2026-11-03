import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SolicitudMedicamentosFormato2 from './SolicitudMedicamentosFormato2.jsx'

const SOLICITUD = {
  paciente: {
    nombres: 'María Fernanda',
    apellidos: 'López Morales',
    fechaNacimiento: '1990-04-12',
    telefono: '5555-1234',
    numeroExpediente: '30954',
  },
  cama: '12',
  servicio: 'Medicina Interna',
  diagnostico: 'Neumonía',
  fecha: '2026-11-01',
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
      cantidadDespachada: 5,
    },
    {
      id: 'medicamento-2',
      nombre: 'Ibuprofeno',
      dosis: '400 mg',
      via: 'Oral',
      frecuencia: 'Cada 12 horas',
      fechaHoraInicio: '2026-11-01T09:00',
      cantidadSolicitada: 10,
      cantidadDespachada: null,
    },
  ],
  observaciones: 'Paciente estable.',
}

describe('SolicitudMedicamentosFormato2', () => {
  it('recrea los datos institucionales del formato', () => {
    render(<SolicitudMedicamentosFormato2 solicitud={SOLICITUD} />)

    expect(screen.getByText('MINISTERIO DE SALUD PÚBLICA Y ASISTENCIA SOCIAL')).toBeInTheDocument()
    expect(screen.getByText('HOSPITAL REGIONAL DE OCCIDENTE')).toBeInTheDocument()
    expect(screen.getByText('SOLICITUD MEDICAMENTOS ESPECIALES')).toBeInTheDocument()
    expect(screen.getByText('No. 2')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Medicamento' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Dosis/Vía/Frecuencia' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Fecha/Hora inicio' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Cantidad Solicitada' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Cantidad Despachada' })).toBeInTheDocument()
  })

  it('incluye paciente, medicamentos, observaciones y firmas sin teléfono', () => {
    render(<SolicitudMedicamentosFormato2 solicitud={SOLICITUD} />)

    expect(screen.getByText(/María Fernanda López Morales/)).toBeInTheDocument()
    expect(screen.getByText('30954')).toBeInTheDocument()
    expect(screen.queryByText('3095-4')).not.toBeInTheDocument()
    expect(screen.getByText('Neumonía')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Medicina Interna')).toBeInTheDocument()
    expect(screen.getByText('01/11/2026')).toBeInTheDocument()
    expect(screen.getByText('Amoxicilina')).toBeInTheDocument()
    expect(screen.getByText('500 mg')).toBeInTheDocument()
    expect(screen.getAllByText('Oral')).toHaveLength(2)
    expect(screen.getByText('Cada 8 horas')).toBeInTheDocument()
    expect(screen.getByText('2026-11-01 08:00')).toBeInTheDocument()
    expect(screen.getByText('21')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Ibuprofeno')).toBeInTheDocument()
    expect(screen.getByText('400 mg')).toBeInTheDocument()
    expect(screen.getByText('Cada 12 horas')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('Paciente estable.')).toBeInTheDocument()
    expect(screen.getByText('Nombre y firma del médico:')).toBeInTheDocument()
    expect(screen.getByText('Despacho de farmacia interna:')).toBeInTheDocument()
    expect(screen.getByText('Recibo conforme:')).toBeInTheDocument()
    expect(screen.getByText(/Dra. Ana Pérez/)).toBeInTheDocument()
    expect(screen.queryByText('5555-1234')).not.toBeInTheDocument()
  })

  it('completa filas vacías hasta seis y conserva los medicamentos existentes', () => {
    render(<SolicitudMedicamentosFormato2 solicitud={SOLICITUD} />)

    expect(screen.getAllByTestId('fila-impresa')).toHaveLength(2)
    expect(screen.getAllByTestId('fila-vacia')).toHaveLength(4)
  })
})
