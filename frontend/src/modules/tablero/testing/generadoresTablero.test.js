import { describe, expect, it } from 'vitest'
import {
  generarAsignacionesPrueba,
  generarEventoPrueba,
  generarIdsSala,
  generarJornadaPrueba,
} from './generadoresTablero'

describe('generadoresTablero · determinismo', () => {
  it('genera asignaciones idénticas en llamadas repetidas (sin aleatoriedad)', () => {
    expect(generarAsignacionesPrueba(50)).toEqual(generarAsignacionesPrueba(50))
  })

  it('genera la cantidad solicitada con IDs únicos y base configurable', () => {
    const lista = generarAsignacionesPrueba(25, { idBase: 1000 })

    expect(lista).toHaveLength(25)
    const ids = lista.map((a) => a.asignacionDiariaEspacioId)
    expect(new Set(ids).size).toBe(25)
    expect(ids[0]).toBe(1000)
    expect(ids[24]).toBe(1024)
  })

  it('los campos son públicos y ficticios', () => {
    const [asignacion] = generarAsignacionesPrueba(1)

    expect(asignacion.subespecialidadNombre).toBe('Clínica 001')
    expect(asignacion).not.toHaveProperty('nombrePaciente')
    expect(asignacion).not.toHaveProperty('dpi')
  })

  it('generarIdsSala es continuo y determinista', () => {
    expect(generarIdsSala(5, { desde: 21 })).toEqual([21, 22, 23, 24, 25])
  })

  it('generarEventoPrueba respeta el contrato y permite campos extra', () => {
    const evento = generarEventoPrueba({
      asignacionDiariaEspacioId: 7,
      turnoActual: 8,
      intentosLlamado: 2,
      tipoEvento: 'LLAMADO',
      nombrePaciente: 'Ficticio',
    })

    expect(evento.asignacionDiariaEspacioId).toBe(7)
    expect(evento.turnoActual).toBe(8)
    expect(evento.intentosLlamado).toBe(2)
    expect(evento.tipoEvento).toBe('LLAMADO')
    expect(evento.nombrePaciente).toBe('Ficticio')
  })

  it('generarJornadaPrueba es determinista y usa el contrato real', () => {
    const asignaciones = generarAsignacionesPrueba(20)
    const jornada = generarJornadaPrueba({ asignaciones, totalEventos: 700 })

    expect(jornada).toHaveLength(700)
    expect(jornada).toEqual(generarJornadaPrueba({ asignaciones, totalEventos: 700 }))

    const idsValidos = new Set(asignaciones.map((a) => a.asignacionDiariaEspacioId))
    expect(jornada.every((e) => idsValidos.has(e.asignacionDiariaEspacioId))).toBe(true)
    expect(jornada.some((e) => e.tipoEvento === 'LLAMADO')).toBe(true)
    expect(jornada.some((e) => e.tipoEvento === 'ACTUALIZACION')).toBe(true)
  })
})
