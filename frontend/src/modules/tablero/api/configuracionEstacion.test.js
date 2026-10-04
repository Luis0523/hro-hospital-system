import { describe, expect, it } from 'vitest'
import {
  leerEstacionDeUrl,
  resolverConfiguracionEstacion,
} from './configuracionEstacion'

function clienteCon(data) {
  return { get: async () => ({ data }) }
}

describe('configuracionEstacion', () => {
  it('lee el parámetro ?estacion', () => {
    expect(leerEstacionDeUrl('?estacion=EST-02')).toBe('EST-02')
    expect(leerEstacionDeUrl('?sala=1')).toBeNull()
    expect(leerEstacionDeUrl('')).toBeNull()
  })

  it('sin parámetro devuelve null (modo fallback)', async () => {
    const config = await resolverConfiguracionEstacion({ search: '', cliente: clienteCon([]) })
    expect(config).toBeNull()
  })

  it('resuelve la estación por código', async () => {
    const cliente = clienteCon([
      { id: 7, codigo: 'EST-02', nombre: 'Consulta Externa — Pediatría', subespecialidades: [{ id: 3 }, { id: 5 }] },
    ])

    const config = await resolverConfiguracionEstacion({ search: '?estacion=EST-02', cliente })

    expect(config.estacionId).toBe(7)
    expect(config.nombre).toBe('Consulta Externa — Pediatría')
    expect(config.subespecialidadIds).toEqual([3, 5])
  })

  it('lanza error si la estación no existe', async () => {
    const cliente = clienteCon([{ id: 1, codigo: 'EST-01', nombre: 'Otra' }])

    await expect(
      resolverConfiguracionEstacion({ search: '?estacion=EST-99', cliente }),
    ).rejects.toMatchObject({ code: 'ESTACION_NO_CONFIGURADA' })
  })
})
