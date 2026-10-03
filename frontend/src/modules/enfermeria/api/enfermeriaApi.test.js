import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  agendarCita,
  buscarPaciente,
  buscarPacientes,
  construirPayloadCita,
  listarCuposDelDia,
} from './enfermeriaApi'

vi.mock('@/shared/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

describe('enfermeriaApi (mock)', () => {
  it('busca pacientes por apellido', async () => {
    const resultados = await buscarPacientes('López')

    expect(resultados.length).toBeGreaterThan(0)
    expect(resultados[0]).toHaveProperty('dpi')
  })

  it('busca un paciente por código de expediente', async () => {
    const paciente = await buscarPaciente('EXP-004521')

    expect(paciente).not.toBeNull()
    expect(paciente.numeroExpediente).toBe('EXP-004521')
    expect(paciente.apellidos).toBe('López García')
  })

  it('mantiene la búsqueda por DPI como respaldo', async () => {
    const paciente = await buscarPaciente('2456789010101')

    expect(paciente).not.toBeNull()
    expect(paciente.dpi).toBe('2456789010101')
  })

  it('lista cupos del día filtrados por clínica', async () => {
    const cupos = await listarCuposDelDia('2026-09-20', [1])

    expect(cupos).toHaveLength(1)
    expect(cupos[0]).toHaveProperty('id')
    expect(cupos[0]).toHaveProperty('cuposDisponibles')
  })

  it('agenda una cita y calcula la ventana de presentación', async () => {
    const [cupo] = await listarCuposDelDia('2026-09-20', [1])
    const cita = await agendarCita({ pacienteId: 1, cupo, usuarioId: 2 })

    expect(cita.pacienteId).toBe(1)
    expect(cita).toHaveProperty('horaEstimada')
    expect(cita).toHaveProperty('horaVentanaInicio')
    expect(cita).toHaveProperty('horaVentanaFin')
  })

  it('rechaza con status 409 cuando no hay cupo', async () => {
    const cupoSinCupo = { id: 999, cuposDisponibles: 0, horaInicio: '08:00:00', cuposOcupados: 10 }

    await expect(
      agendarCita({ pacienteId: 1, cupo: cupoSinCupo, usuarioId: 2 }),
    ).rejects.toMatchObject({ status: 409 })
  })
})

describe('construirPayloadCita', () => {
  it('conserva los UUID como string (no los convierte a número)', () => {
    const pacienteId = 'b1f0c8e2-3a4d-4c21-9c01-000000000101'
    const cupo = { id: '7c2d9f10-1a11-4d21-9c01-000000000202' }

    expect(construirPayloadCita({ pacienteId, cupo })).toEqual({
      pacienteId,
      cupoDiarioId: cupo.id,
    })
    expect(construirPayloadCita({ pacienteId, cupo }).pacienteId).toBe(pacienteId)
  })
})

describe('agendarCita contra backend real', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('hace POST /citas con los UUID sin mutarlos a null', async () => {
    vi.resetModules()
    vi.stubEnv('MODE', 'production')
    vi.stubEnv('VITE_USE_MOCK', 'false')

    const { default: client } = await import('@/shared/api/client')
    client.post.mockResolvedValueOnce({
      data: { id: 42, pacienteId: 'b1f0c8e2-3a4d-4c21-9c01-000000000101' },
    })
    const { agendarCita: agendarReal } = await import('./enfermeriaApi')

    const pacienteId = 'b1f0c8e2-3a4d-4c21-9c01-000000000101'
    const cupo = { id: '7c2d9f10-1a11-4d21-9c01-000000000202' }
    await agendarReal({ pacienteId, cupo })

    expect(client.post).toHaveBeenCalledWith('/citas', {
      pacienteId,
      cupoDiarioId: cupo.id,
    })
    const [, cuerpo] = client.post.mock.calls[0]
    expect(cuerpo.pacienteId).not.toBeNull()
  })
})
