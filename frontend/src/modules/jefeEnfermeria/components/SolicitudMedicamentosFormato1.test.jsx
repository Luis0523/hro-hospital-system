import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import SolicitudMedicamentosFormato1 from './SolicitudMedicamentosFormato1.jsx'

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

describe('SolicitudMedicamentosFormato1', () => {
  it('renderiza el encabezado y el título No.1', () => {
    render(<SolicitudMedicamentosFormato1 solicitud={SOLICITUD} />)

    expect(screen.getAllByText('MINISTERIO DE SALUD PÚBLICA Y ASISTENCIA SOCIAL')).toHaveLength(2)
    expect(screen.getAllByText('Hospital Regional de Occidente')).toHaveLength(2)
    expect(screen.getAllByText('SOLICITUD DE MEDICAMENTOS ESPECIALES No.1')).toHaveLength(2)
  })

  it('muestra los campos resumidos y un medicamento por página', () => {
    render(<SolicitudMedicamentosFormato1 solicitud={SOLICITUD} />)

    const paginas = screen.getAllByTestId('solicitud-formato1-pagina')
    expect(paginas).toHaveLength(2)
    expect(screen.getAllByRole('table')).toHaveLength(2)

    expect(within(paginas[0]).getByText('Amoxicilina')).toBeInTheDocument()
    expect(within(paginas[0]).getByText('500 mg / Oral')).toBeInTheDocument()
    expect(within(paginas[0]).getByText('21')).toBeInTheDocument()
    expect(within(paginas[0]).getByText('5')).toBeInTheDocument()
    expect(within(paginas[0]).getByText('2026-11-01 08:00')).toBeInTheDocument()
    expect(within(paginas[0]).queryByText('Ibuprofeno')).not.toBeInTheDocument()

    expect(within(paginas[1]).getByText('Ibuprofeno')).toBeInTheDocument()
    expect(within(paginas[1]).getByText('400 mg / Oral')).toBeInTheDocument()

    expect(within(paginas[0]).getByText('Nombre completo del paciente')).toBeInTheDocument()
    expect(within(paginas[0]).getByText('No. de Cama')).toBeInTheDocument()
    expect(within(paginas[0]).getByText('No. de Registro')).toBeInTheDocument()
    expect(within(paginas[0]).getByText('Medicamento Solicitado')).toBeInTheDocument()
    expect(within(paginas[0]).getByText('Dósis y vía de Administración')).toBeInTheDocument()
    expect(within(paginas[0]).getByText('Nombre y Firma del Médico')).toBeInTheDocument()
    expect(within(paginas[0]).getByText(/Dra. Ana Pérez/)).toBeInTheDocument()
    expect(within(paginas[0]).getByText('Paciente estable.')).toBeInTheDocument()

    expect(screen.queryByText('5555-1234')).not.toBeInTheDocument()
  })
})
