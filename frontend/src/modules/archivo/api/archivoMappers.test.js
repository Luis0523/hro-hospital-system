import { describe, expect, it } from 'vitest'
import {
  formatearUbicacion,
  mapearCita,
  mapearExpedienteBusqueda,
  mapearJornadaArchivo,
  mapearMedico,
  mapearPaciente,
  mapearSubespecialidad,
} from './archivoMappers'

// DTOs de ejemplo tomados de respuestas reales del backend desplegado.
const MEDICO_DTO = {
  id: '23fbc04f-67f4-42b5-8ad3-7fa446881b2e',
  nombres: 'Dr. Juan Luis Morales Castillo',
  numeroColegiado: 'COL-10452',
  usuarioReferenciaId: null,
  activo: true,
  creadoEn: '2026-09-19T00:24:55.708907Z',
}

const SUBESPECIALIDAD_DTO = {
  id: 1,
  especialidadId: 1,
  especialidadNombre: 'Medicina Interna',
  nombre: 'Medicina General',
  activo: true,
  creadoEn: '2026-09-19T00:24:54.27418Z',
}

const PACIENTE_DTO = {
  id: '2951ebe5-39ce-4136-b13d-564d7491ac26',
  dpi: '2190123450901',
  nombres: 'Dora Alicia',
  apellidos: 'Ajxup Chum',
  fechaNacimiento: '1971-04-26',
  sexo: 'F',
  telefono: '50277898765',
  direccion: 'San Juan Ostuncalco',
  numeroExpediente: 'EXP-2024-035',
  creadoEn: '2026-09-19T00:24:59.514687Z',
}

const CITA_DTO = {
  id: 56,
  pacienteId: '2951ebe5-39ce-4136-b13d-564d7491ac26',
  pacienteNombreCompleto: 'Dora Alicia Ajxup Chum',
  pacienteDpi: '2190123450901',
  pacienteExpediente: 'EXP-2024-035',
  cupoDiarioId: '6eccd698-d0c0-47ff-878c-d3c730ec1b4a',
  fechaCita: '2026-09-21',
  subespecialidadNombre: 'Medicina General',
  medicoNombre: 'Dr. Juan Luis Morales Castillo',
  horaEstimada: '07:00:00',
  horaVentanaInicio: '07:00:00',
  horaVentanaFin: '07:45:00',
  posicionEnFila: 1,
  minutosEsperaEstimados: 0,
  estado: 'pendiente',
  citaOrigenId: null,
  version: 0,
}

describe('archivoMappers', () => {
  it('mapea un médico a partir de "nombres"', () => {
    expect(mapearMedico(MEDICO_DTO)).toEqual({
      id: MEDICO_DTO.id,
      nombre: 'Dr. Juan Luis Morales Castillo',
      numeroColegiado: 'COL-10452',
      activo: true,
    })
  })

  it('mapea una subespecialidad', () => {
    expect(mapearSubespecialidad(SUBESPECIALIDAD_DTO)).toEqual({
      id: 1,
      nombre: 'Medicina General',
      especialidadId: 1,
      especialidadNombre: 'Medicina Interna',
      activo: true,
    })
  })

  it('mapea un paciente y compone el nombre completo', () => {
    const paciente = mapearPaciente(PACIENTE_DTO)

    expect(paciente.nombreCompleto).toBe('Dora Alicia Ajxup Chum')
    expect(paciente.numeroExpediente).toBe('EXP-2024-035')
    expect(paciente.dpi).toBe('2190123450901')
  })

  it('mapea una cita sin inventar campos de expediente físico', () => {
    const cita = mapearCita(CITA_DTO)

    expect(cita).toEqual({
      id: 56,
      pacienteId: CITA_DTO.pacienteId,
      pacienteNombreCompleto: 'Dora Alicia Ajxup Chum',
      pacienteDpi: '2190123450901',
      pacienteExpediente: 'EXP-2024-035',
      fechaCita: '2026-09-21',
      horaEstimada: '07:00:00',
      horaVentanaInicio: '07:00:00',
      horaVentanaFin: '07:45:00',
      subespecialidadNombre: 'Medicina General',
      medicoNombre: 'Dr. Juan Luis Morales Castillo',
      estado: 'pendiente',
    })
    expect(cita).not.toHaveProperty('ubicacion')
    expect(cita).not.toHaveProperty('historial')
    expect(cita).not.toHaveProperty('expedienteNuevo')
  })

  it('mapea el resultado de la búsqueda por código', () => {
    const expediente = mapearExpedienteBusqueda({
      id: '3f1c-uuid',
      pacienteId: '9b2a-uuid',
      numeroExpediente: 'EXP-2024-035',
      ubicacionBase: { id: 12, pasillo: 'B', estante: '14', balda: '3' },
      activo: true,
      creadoEn: '2026-09-20T10:00:00',
    })

    expect(expediente).toEqual({
      id: '3f1c-uuid',
      numeroExpediente: 'EXP-2024-035',
      codigo: 'EXP-2024-035',
      ubicacionBase: { id: 12, pasillo: 'B', estante: '14', balda: '3' },
      activo: true,
    })
  })

  it('formatea la ubicación base omitiendo campos ausentes', () => {
    expect(
      formatearUbicacion({ id: 1, pasillo: 'A', estante: '3', balda: '2', descripcion: null }),
    ).toBe('Pasillo A · Estante 3 · Balda 2')
    expect(formatearUbicacion({ descripcion: 'Bodega' })).toBe('Bodega')
    expect(formatearUbicacion(null)).toBeNull()
  })

  it('mapea una fila de jornada conservando expedienteId, cicloId y estadoActual', () => {
    const fila = mapearJornadaArchivo({
      citaId: 4821,
      horaEstimada: '08:30:00',
      pacienteId: '9b2a-uuid',
      pacienteNombre: 'Juan López',
      dpi: '2984123450901',
      numeroExpediente: 'EXP-2024-035',
      expedienteId: '3f1c-uuid',
      subespecialidadId: 2,
      subespecialidadNombre: 'Medicina General',
      cicloId: 'a1b2-uuid',
      estadoActual: 'en_busqueda',
      ubicacionBase: { id: 12, pasillo: 'B', estante: '14', balda: '3', descripcion: null },
    })

    expect(fila).toMatchObject({
      id: '3f1c-uuid',
      expedienteId: '3f1c-uuid',
      cicloId: 'a1b2-uuid',
      estadoActual: 'en_busqueda',
      numeroExpediente: 'EXP-2024-035',
      subespecialidadId: 2,
      ubicacion: 'Pasillo B · Estante 14 · Balda 3',
    })
  })

  it('mapea una fila sin expediente físico con sin_ciclo', () => {
    const fila = mapearJornadaArchivo({
      citaId: 99,
      expedienteId: null,
      cicloId: null,
      estadoActual: 'sin_ciclo',
      numeroExpediente: null,
    })

    expect(fila.expedienteId).toBeNull()
    expect(fila.cicloId).toBeNull()
    expect(fila.estadoActual).toBe('sin_ciclo')
    expect(fila.id).toBe('cita-99')
  })

  it('conserva el numeroExpediente tal cual, sin reformatear ni validar patrón', () => {
    // Formatos deliberadamente distintos: un mapper no debe asumir /^EXP-\d{6}$/.
    const formatos = ['EXP-2024-035', 'EXP-2023-8941', 'EXP-2024-1', 'A-1/B']

    for (const numeroExpediente of formatos) {
      expect(mapearExpedienteBusqueda({ id: 'x', numeroExpediente }).numeroExpediente).toBe(
        numeroExpediente,
      )
      expect(mapearJornadaArchivo({ citaId: 1, numeroExpediente }).numeroExpediente).toBe(
        numeroExpediente,
      )
      expect(mapearPaciente({ id: 'x', numeroExpediente }).numeroExpediente).toBe(numeroExpediente)
    }
  })

  it('devuelve null ante entradas vacías', () => {
    expect(mapearMedico(null)).toBeNull()
    expect(mapearExpedienteBusqueda(null)).toBeNull()
    expect(mapearSubespecialidad(undefined)).toBeNull()
    expect(mapearPaciente(null)).toBeNull()
    expect(mapearCita(null)).toBeNull()
  })

  it('tolera campos opcionales ausentes sin inventar valores', () => {
    const paciente = mapearPaciente({ id: 'x', nombres: 'Ana' })

    expect(paciente.nombreCompleto).toBe('Ana')
    expect(paciente.apellidos).toBe('')
    expect(paciente.numeroExpediente).toBeNull()
    expect(paciente.telefono).toBeNull()
  })
})
