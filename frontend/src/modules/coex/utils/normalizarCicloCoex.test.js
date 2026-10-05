import { describe, expect, it } from 'vitest'
import {
  CICLOS_COEX_FIXTURE,
  CICLO_EN_TRANSITO_ENTREGA,
} from '../api/fixturesCiclosCoex'
import { normalizarCicloCoex, normalizarCiclosCoex } from './normalizarCicloCoex'

describe('normalizarCicloCoex - mapeo de campos', () => {
  it('mapea id a cicloId', () => {
    expect(normalizarCicloCoex({ id: 'ciclo-9' }).cicloId).toBe('ciclo-9')
  })

  it('mapea expedienteId y numeroExpediente', () => {
    const fila = normalizarCicloCoex({ id: 'c1', expedienteId: 'e1', numeroExpediente: 'EXP-1' })
    expect(fila.expedienteId).toBe('e1')
    expect(fila.numeroExpediente).toBe('EXP-1')
  })

  it('mapea citaId y estadoActual', () => {
    const fila = normalizarCicloCoex({ id: 'c1', citaId: 42, estadoActual: 'entregado' })
    expect(fila.citaId).toBe(42)
    expect(fila.estadoActual).toBe('entregado')
  })

  it('compone pacienteNombre desde nombres y apellidos', () => {
    const fila = normalizarCicloCoex({
      id: 'c1',
      paciente: { id: 'p1', nombres: 'María', apellidos: 'López García', dpi: '123' },
    })
    expect(fila.pacienteNombre).toBe('María López García')
    expect(fila.pacienteId).toBe('p1')
    expect(fila.dpi).toBe('123')
  })

  it('los campos que el backend no provee quedan en null', () => {
    const fila = normalizarCicloCoex(CICLO_EN_TRANSITO_ENTREGA)
    expect(fila.subespecialidadId).toBeNull()
    expect(fila.subespecialidadNombre).toBeNull()
    expect(fila.horaEstimada).toBeNull()
    expect(fila.ubicacionBase).toBeNull()
  })
})

describe('normalizarCicloCoex - tolerancia', () => {
  it('paciente parcial compone solo con las partes presentes', () => {
    const fila = normalizarCicloCoex({
      id: 'c1',
      paciente: { nombres: 'Ana', apellidos: null },
    })
    expect(fila.pacienteNombre).toBe('Ana')
  })

  it('paciente null no rompe y deja los campos de paciente en null', () => {
    const fila = normalizarCicloCoex({ id: 'c1', paciente: null })
    expect(fila.pacienteNombre).toBeNull()
    expect(fila.pacienteId).toBeNull()
    expect(fila.dpi).toBeNull()
  })

  it('paciente sin nombres válidos produce pacienteNombre null', () => {
    const fila = normalizarCicloCoex({ id: 'c1', paciente: { nombres: '  ', apellidos: '' } })
    expect(fila.pacienteNombre).toBeNull()
  })

  it('DTO null devuelve null', () => {
    expect(normalizarCicloCoex(null)).toBeNull()
  })

  it('DTO sin identidad útil devuelve null', () => {
    expect(normalizarCicloCoex({ estadoActual: 'entregado' })).toBeNull()
  })
})

describe('normalizarCiclosCoex - listas', () => {
  it('normaliza una lista de DTOs', () => {
    const filas = normalizarCiclosCoex(CICLOS_COEX_FIXTURE)
    expect(filas).toHaveLength(CICLOS_COEX_FIXTURE.length)
    expect(filas[0].cicloId).toBe(CICLOS_COEX_FIXTURE[0].id)
  })

  it('ignora entradas inválidas sin lanzar', () => {
    const filas = normalizarCiclosCoex([null, undefined, {}, { id: 'c1' }])
    expect(filas).toHaveLength(1)
    expect(filas[0].cicloId).toBe('c1')
  })

  it('una entrada no-lista devuelve lista vacía', () => {
    expect(normalizarCiclosCoex(null)).toEqual([])
    expect(normalizarCiclosCoex(undefined)).toEqual([])
  })
})
