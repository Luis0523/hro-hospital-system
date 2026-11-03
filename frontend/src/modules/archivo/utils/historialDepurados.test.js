import { describe, expect, it, vi } from 'vitest'
import {
  MAX_CONCURRENCIA_CONSULTAS,
  claveRegistro,
  consultarDiasDepuraciones,
  deduplicarRegistros,
  fechaIsoDeRegistro,
  ordenarRegistrosDesc,
} from './historialDepurados'

function registro(id, depuradoEn, extra = {}) {
  return {
    id,
    numeroExpediente: `90${id}`,
    pacienteNombre: `Paciente ${id}`,
    usuarioNombre: 'Archivo Central',
    motivo: null,
    depuradoEn,
    ...extra,
  }
}

async function resolverPendientes(pendientes, total) {
  for (let indice = 0; indice < total; indice += 1) {
    while (pendientes.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    pendientes.shift()()
    await Promise.resolve()
    await Promise.resolve()
  }
}

describe('historialDepurados', () => {
  it('deduplica por identificador y ordena de más reciente a más antiguo', () => {
    const registros = [
      registro('a', '2026-11-02T09:00:00-06:00'),
      registro('b', '2026-11-02T11:00:00-06:00'),
      registro('a', '2026-11-02T09:00:00-06:00'),
    ]

    expect(deduplicarRegistros(registros)).toHaveLength(2)
    expect(deduplicarRegistros(ordenarRegistrosDesc(registros)).map((item) => item.id)).toEqual([
      'b',
      'a',
    ])
    expect(claveRegistro(registros[0])).toBe('id:a')
    expect(claveRegistro({ numeroExpediente: '927581', fecha: '2026-11-02' })).toMatch(/927581/)
  })

  it('no pierde registros correctos cuando un día falla', async () => {
    const consultar = vi.fn(async (fecha) => {
      if (fecha === '2026-11-02') throw new Error('falló un día')
      return [registro(fecha, `${fecha}T10:00:00-06:00`)]
    })

    const resultado = await consultarDiasDepuraciones({
      dias: ['2026-11-01', '2026-11-02', '2026-11-03'],
      consultar,
    })

    expect(resultado.completo).toBe(false)
    expect(resultado.diasConError).toBe(1)
    expect(resultado.errores[0].fecha).toBe('2026-11-02')
    expect(resultado.registros).toHaveLength(2)
    expect(resultado.registros.map((item) => item.id)).toEqual(['2026-11-03', '2026-11-01'])
  })

  it('no lanza más de cuatro consultas diarias simultáneas', async () => {
    let activas = 0
    let maximo = 0
    const pendientes = []
    const consultar = vi.fn((fecha) => {
      activas += 1
      maximo = Math.max(maximo, activas)
      return new Promise((resolve) => {
        pendientes.push(() => {
          activas -= 1
          resolve([registro(fecha, `${fecha}T12:00:00-06:00`)])
        })
      })
    })

    const dias = [
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ]
    const promesa = consultarDiasDepuraciones({ dias, consultar })

    await Promise.resolve()
    await Promise.resolve()
    expect(maximo).toBe(MAX_CONCURRENCIA_CONSULTAS)

    await resolverPendientes(pendientes, dias.length)
    const resultado = await promesa

    expect(maximo).toBeLessThanOrEqual(MAX_CONCURRENCIA_CONSULTAS)
    expect(consultar).toHaveBeenCalledTimes(dias.length)
    expect(resultado.completo).toBe(true)
    expect(resultado.registros).toHaveLength(dias.length)
  })

  it('tolera una respuesta fuera de orden y conserva el orden final', () => {
    expect(
      ordenarRegistrosDesc([
        registro('viejo', '2026-11-01T10:00:00-06:00'),
        registro('nuevo', '2026-11-03T10:00:00-06:00'),
        registro('medio', '2026-11-02T10:00:00-06:00'),
      ]).map((item) => item.id),
    ).toEqual(['nuevo', 'medio', 'viejo'])
  })

  it('obtiene la fecha de Guatemala sin interpretar una fecha ISO como UTC', () => {
    expect(fechaIsoDeRegistro({ depuradoEn: '2026-11-03T05:30:00Z' })).toBe('2026-11-02')
    expect(fechaIsoDeRegistro({ depuradoEn: '2026-11-02' })).toBe('2026-11-02')
    expect(fechaIsoDeRegistro({ fecha: '2026-11-02' })).toBe('2026-11-02')
    expect(fechaIsoDeRegistro({})).toBe('')
  })
})
