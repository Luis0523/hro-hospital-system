import { beforeEach, describe, expect, it } from 'vitest'
import {
  agregarAlHistorial,
  leerHistorialRecetarios,
  limpiarHistorialRecetarios,
} from './historialRecetarios'

function crearSolicitud() {
  return {
    paciente: {
      numeroExpediente: '837871',
      nombres: 'María Fernanda López Morales',
      apellidos: '',
    },
    cama: '12',
    servicio: 'Medicina Interna',
    diagnostico: 'Neumonía',
    fecha: '2026-11-03',
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
    observaciones: 'Paciente estable.',
  }
}

const SOLICITUD = crearSolicitud()

beforeEach(() => {
  localStorage.clear()
})

describe('historialRecetarios', () => {
  it('inicia vacío y guarda una copia inmutable de la solicitud', () => {
    expect(leerHistorialRecetarios()).toEqual([])

    const lista = agregarAlHistorial({ solicitud: SOLICITUD, formato: '1' })

    expect(lista).toHaveLength(1)
    expect(lista[0]).toMatchObject({
      formato: '1',
      expediente: '837871',
      pacienteNombre: 'María Fernanda López Morales',
    })
    expect(lista[0].solicitud.medicamentos[0].nombre).toBe('Amoxicilina')

    const copia = JSON.parse(JSON.stringify(SOLICITUD))
    copia.medicamentos[0].nombre = 'Cambiado'
    expect(leerHistorialRecetarios()[0].solicitud.medicamentos[0].nombre).toBe('Amoxicilina')
  })

  it('ordena del más reciente al más antiguo', () => {
    agregarAlHistorial({
      solicitud: SOLICITUD,
      formato: '1',
      generadoEn: '2026-11-03T08:00:00.000Z',
    })
    agregarAlHistorial({
      solicitud: { ...SOLICITUD, cama: '13' },
      formato: '2',
      generadoEn: '2026-11-03T09:00:00.000Z',
    })

    const lista = leerHistorialRecetarios()
    expect(lista).toHaveLength(2)
    expect(lista[0].generadoEn).toBe('2026-11-03T09:00:00.000Z')
    expect(lista[1].formato).toBe('1')
  })

  it('ignora solicitudes sin paciente y permite vaciar el historial', () => {
    agregarAlHistorial({ solicitud: { medicamentos: [] }, formato: '1' })
    expect(leerHistorialRecetarios()).toEqual([])

    agregarAlHistorial({ solicitud: SOLICITUD, formato: '1' })
    expect(limpiarHistorialRecetarios()).toEqual([])
    expect(leerHistorialRecetarios()).toEqual([])
  })
})
