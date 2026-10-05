import { describe, expect, it } from 'vitest'
import { resumirPorEspecialidad } from './resumenEspecialidades'

function fila(idLocal, especialidadId, especialidadNombre) {
  return {
    idLocal,
    numeroExpediente: '1323-23',
    pacienteId: 'pac-1323',
    nombrePaciente: 'Paciente Demo Uno',
    fecha: '2026-10-04',
    especialidadId,
    especialidadNombre,
  }
}

describe('resumirPorEspecialidad', () => {
  it('devuelve resumen vacío para lista vacía', () => {
    expect(resumirPorEspecialidad([])).toEqual([])
  })

  it('cuenta 1 para una sola fila', () => {
    expect(resumirPorEspecialidad([fila('a', 1, 'Medicina Interna')])).toEqual([
      { especialidadId: 1, especialidadNombre: 'Medicina Interna', cantidad: 1 },
    ])
  })

  it('acumula la cantidad por especialidad', () => {
    const resultado = resumirPorEspecialidad([
      fila('a', 1, 'Medicina Interna'),
      fila('b', 1, 'Medicina Interna'),
    ])

    expect(resultado).toEqual([
      { especialidadId: 1, especialidadNombre: 'Medicina Interna', cantidad: 2 },
    ])
  })

  it('incluye ambas especialidades presentes', () => {
    const resultado = resumirPorEspecialidad([
      fila('a', 1, 'Medicina Interna'),
      fila('b', 2, 'Medicina General'),
    ])

    expect(resultado).toEqual([
      { especialidadId: 1, especialidadNombre: 'Medicina Interna', cantidad: 1 },
      { especialidadId: 2, especialidadNombre: 'Medicina General', cantidad: 1 },
    ])
  })

  it('mantiene orden determinista del catálogo (Interna → General) aunque las filas vengan al revés', () => {
    const resultado = resumirPorEspecialidad([
      fila('b', 2, 'Medicina General'),
      fila('a', 1, 'Medicina Interna'),
    ])

    expect(resultado.map((item) => item.especialidadId)).toEqual([1, 2])
  })

  it('recalcula al cambiar las filas (no muta las originales)', () => {
    const filas = [fila('a', 1, 'Medicina Interna'), fila('b', 2, 'Medicina General')]
    const copia = JSON.parse(JSON.stringify(filas))

    resumirPorEspecialidad(filas)

    expect(filas).toEqual(copia)
  })
})
