import { beforeEach, describe, expect, it } from 'vitest'
import { guardarCache, leerCache, limpiarCache, limpiarCachePrefijo } from './cache'

describe('cache', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('guarda y lee un valor', () => {
    guardarCache('k', { valor: 1 })
    expect(leerCache('k')).toEqual({ valor: 1 })
  })

  it('respeta el TTL', async () => {
    guardarCache('k', 1, 1)
    await new Promise((resolver) => setTimeout(resolver, 5))
    expect(leerCache('k')).toBeNull()
  })

  it('limpia una clave y un prefijo', () => {
    guardarCache('cupos_a', 1)
    guardarCache('cupos_b', 2)
    guardarCache('otro', 3)

    limpiarCache('otro')
    limpiarCachePrefijo('cupos')

    expect(leerCache('otro')).toBeNull()
    expect(leerCache('cupos_a')).toBeNull()
    expect(leerCache('cupos_b')).toBeNull()
  })
})
