import { describe, expect, it } from 'vitest'
import {
  COOLDOWN_MS,
  calcularRestanteMs,
  evaluarLlamado,
  ordenarCola,
  primerElegible,
} from './doctorAcciones'
import { normalizarTurno } from './doctorMappers'

function turno(id, orden, estado, correlativo) {
  return {
    id,
    orden,
    estado,
    correlativo,
    pacienteNombre: `Paciente ${id}`,
    expediente: '',
    identificado: false,
    intentosLlamado: 0,
  }
}

describe('reglas de cola y cooldown', () => {
  it('ordena por campo explícito, no por texto del correlativo', () => {
    const cola = [
      turno(10, 2, 'en_espera', 'MI-2'),
      turno(2, 10, 'en_espera', 'MI-10'),
      turno(1, 1, 'en_espera', 'MI-1'),
    ]

    expect(ordenarCola(cola).map((registro) => registro.correlativo)).toEqual([
      'MI-1',
      'MI-2',
      'MI-10',
    ])
    expect(primerElegible(cola).correlativo).toBe('MI-1')
  })

  it('normaliza correlativos numéricos a texto', () => {
    expect(normalizarTurno({ id: 1, numeroTurno: 7, estado: 'en_espera' })).toMatchObject({
      correlativo: '7',
    })
    expect(normalizarTurno({ id: 2, numeroTurno: 'REUMA-2', estado: 'en_espera' })).toMatchObject({
      correlativo: 'REUMA-2',
    })
  })

  it('impide llamar fuera de orden o con otro turno activo', () => {
    const cola = [turno(1, 1, 'en_espera', 'MI-1'), turno(2, 2, 'en_espera', 'MI-2')]

    expect(evaluarLlamado(cola[1], cola, 1000, 0)).toMatchObject({
      permitido: false,
      codigo: 'ORDEN_COLA',
    })

    const conActivo = [{ ...cola[0], estado: 'llamado' }, cola[1]]
    expect(evaluarLlamado(conActivo[1], conActivo, 1000, 0)).toMatchObject({
      permitido: false,
      codigo: 'TURNO_ACTIVO',
    })
  })

  it('aplica cooldown y luego habilita el rellamado del turno activo', () => {
    const cola = [
      { ...turno(1, 1, 'llamado', 'MI-1'), expediente: '0000000001', identificado: true },
      turno(2, 2, 'en_espera', 'MI-2'),
    ]

    const bloqueado = evaluarLlamado(cola[0], cola, 1000 + 2000, 1000)
    expect(bloqueado).toMatchObject({
      permitido: false,
      codigo: 'COOLDOWN',
      cooldownSegundos: 8,
    })

    expect(evaluarLlamado(cola[0], cola, 1000 + COOLDOWN_MS, 1000)).toMatchObject({
      permitido: true,
      cooldownSegundos: 0,
    })
    expect(calcularRestanteMs(1000, 1000 + COOLDOWN_MS)).toBe(0)
    expect(calcularRestanteMs(1000, 1000 + 2000)).toBe(8000)
  })

  it('permite rellamar un no_responde solo si no hay otro activo', () => {
    const sinActivo = [turno(1, 1, 'en_espera', 'MI-1'), turno(3, 3, 'no_responde', 'MI-3')]
    expect(evaluarLlamado(sinActivo[1], sinActivo, 1000, 0).permitido).toBe(true)

    const conActivo = [{ ...turno(1, 1, 'llamado', 'MI-1') }, turno(3, 3, 'no_responde', 'MI-3')]
    expect(evaluarLlamado(conActivo[1], conActivo, 1000, 0)).toMatchObject({
      permitido: false,
      codigo: 'TURNO_ACTIVO',
    })
  })
})
