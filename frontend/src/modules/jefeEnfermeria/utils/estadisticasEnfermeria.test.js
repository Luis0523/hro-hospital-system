import { describe, expect, it } from 'vitest'
import {
  calcularEstadisticasEnfermeria,
  lineasConsolidadoEnfermeria,
} from './estadisticasEnfermeria'

const libro = {
  especialidades: [
    {
      id: 'MI',
      codigo: 'MI',
      nombre: 'Medicina Interna',
      turnos: [
        {
          id: 'MI-1',
          numero: 1,
          etapa: 'registrado',
          clinicaId: 1,
          clinicaNombre: 'Clínica 1',
          tipoRegistro: 'presentacion',
        },
        {
          id: 'MI-2',
          numero: 2,
          etapa: 'en_clinica',
          clinicaId: 1,
          clinicaNombre: 'Clínica 1',
          tipoRegistro: null,
        },
        {
          id: 'MI-3',
          numero: 3,
          etapa: 'devuelto',
          clinicaId: 2,
          clinicaNombre: 'Clínica 2',
          tipoRegistro: 'privado_libertad',
        },
      ],
    },
    {
      id: 'MUJ',
      codigo: 'MUJ',
      nombre: 'Clínica de la Mujer',
      turnos: [
        {
          id: 'MUJ-1',
          numero: 1,
          etapa: 'archivo',
          clinicaId: 2,
          clinicaNombre: 'Clínica 2',
          tipoRegistro: 'presentacion',
        },
      ],
    },
  ],
}

const clinicas = [
  { id: 1, nombre: 'Clínica 1', expedientesEnClinica: 4 },
  { id: 2, nombre: 'Clínica 2', expedientesEnClinica: 2 },
]

const salidas = [
  { id: 1, tipo: 'personal', primeraVez: true },
  { id: 2, tipo: 'normal', primeraVez: false },
  { id: 3, tipo: 'personal', primeraVez: false },
  { id: 4, tipo: 'presentacion', primeraVez: true },
]

describe('calcularEstadisticasEnfermeria', () => {
  it('agrega pacientes, etiquetas, clínica de la mujer y salidas', () => {
    const resultado = calcularEstadisticasEnfermeria({ libro, clinicas, salidas })

    expect(resultado.totalPacientes).toBe(4)
    expect(resultado.totalSalidas).toBe(4)
    expect(resultado.primeraVez).toBe(2)
    expect(resultado.presentaciones).toBe(2)
    expect(resultado.privadosLibertad).toBe(1)
    expect(resultado.sinMarca).toBe(1)
    expect(resultado.personal).toBe(2)
    expect(resultado.clinicaMujer).toBe(1)
    expect(resultado.etapaConteo).toMatchObject({
      registrado: 1,
      en_clinica: 1,
      devuelto: 1,
      archivo: 1,
    })
  })

  it('compara especialidades y reparte por clínica', () => {
    const resultado = calcularEstadisticasEnfermeria({ libro, clinicas, salidas })

    expect(resultado.porEspecialidad[0]).toMatchObject({
      nombre: 'Medicina Interna',
      total: 3,
      presentaciones: 1,
      privadosLibertad: 1,
    })
    expect(
      resultado.porEspecialidad.find((item) => item.nombre === 'Clínica de la Mujer'),
    ).toMatchObject({ total: 1, clinicaMujer: true })

    const clinica1 = resultado.porClinica.find((item) => item.id === 1)
    expect(clinica1).toMatchObject({ pacientes: 2, presentaciones: 1, pendientes: 4 })
  })

  it('genera las líneas del consolidado del día', () => {
    const resultado = calcularEstadisticasEnfermeria({ libro, clinicas, salidas })
    const lineas = lineasConsolidadoEnfermeria({
      estacion: { codigo: 'ENF-01', nombre: 'Enfermería Central' },
      fecha: '2026-10-28',
      estadisticas: resultado,
    })

    expect(lineas).toContain('ESTADÍSTICAS DE LA ESTACIÓN DE ENFERMERÍA')
    expect(lineas).toContain('Estación: ENF-01 · Enfermería Central')
    expect(lineas).toContain('Pacientes registrados: 4')
    expect(lineas).toContain('Clínica de la Mujer: 1')
  })
})
