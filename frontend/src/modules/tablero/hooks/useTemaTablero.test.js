import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  CLAVE_TEMA,
  guardarTema,
  leerTemaGuardado,
  normalizarTema,
  useTemaTablero,
} from './useTemaTablero'

function crearStorage({ datos = {}, lanzaLectura = false, lanzaEscritura = false } = {}) {
  const almacen = { ...datos }
  return {
    almacen,
    getItem: vi.fn((clave) => {
      if (lanzaLectura) throw new Error('lectura bloqueada')
      return clave in almacen ? almacen[clave] : null
    }),
    setItem: vi.fn((clave, valor) => {
      if (lanzaEscritura) throw new Error('escritura bloqueada')
      almacen[clave] = valor
    }),
  }
}

describe('useTemaTablero · utilidades', () => {
  it('normaliza valores inválidos a light', () => {
    expect(normalizarTema('light')).toBe('light')
    expect(normalizarTema('dark')).toBe('dark')
    expect(normalizarTema(null)).toBe('light')
    expect(normalizarTema('')).toBe('light')
    expect(normalizarTema('blue')).toBe('light')
  })

  it('sin preferencia usa light', () => {
    expect(leerTemaGuardado(crearStorage())).toBe('light')
  })

  it('lee dark y light guardados', () => {
    expect(leerTemaGuardado(crearStorage({ datos: { [CLAVE_TEMA]: 'dark' } }))).toBe('dark')
    expect(leerTemaGuardado(crearStorage({ datos: { [CLAVE_TEMA]: 'light' } }))).toBe('light')
  })

  it('valor inválido guardado usa light', () => {
    expect(leerTemaGuardado(crearStorage({ datos: { [CLAVE_TEMA]: 'blue' } }))).toBe('light')
  })

  it('si la lectura lanza, usa light', () => {
    expect(leerTemaGuardado(crearStorage({ lanzaLectura: true }))).toBe('light')
  })

  it('guardarTema persiste y devuelve true/false', () => {
    const storage = crearStorage()
    expect(guardarTema('dark', storage)).toBe(true)
    expect(storage.almacen[CLAVE_TEMA]).toBe('dark')

    expect(guardarTema('light', crearStorage({ lanzaEscritura: true }))).toBe(false)
  })
})

describe('useTemaTablero · hook', () => {
  it('sin preferencia inicia en light', () => {
    const { result } = renderHook(() => useTemaTablero({ storage: crearStorage() }))

    expect(result.current.tema).toBe('light')
  })

  it('con dark guardado inicia en dark', () => {
    const storage = crearStorage({ datos: { [CLAVE_TEMA]: 'dark' } })
    const { result } = renderHook(() => useTemaTablero({ storage }))

    expect(result.current.tema).toBe('dark')
  })

  it('alternar light -> dark y persiste', () => {
    const storage = crearStorage()
    const { result } = renderHook(() => useTemaTablero({ storage }))

    act(() => result.current.alternarTema())

    expect(result.current.tema).toBe('dark')
    expect(storage.almacen[CLAVE_TEMA]).toBe('dark')
  })

  it('alternar dark -> light y persiste', () => {
    const storage = crearStorage({ datos: { [CLAVE_TEMA]: 'dark' } })
    const { result } = renderHook(() => useTemaTablero({ storage }))

    act(() => result.current.alternarTema())

    expect(result.current.tema).toBe('light')
    expect(storage.almacen[CLAVE_TEMA]).toBe('light')
  })

  it('si la escritura lanza, el cambio visual continúa', () => {
    const storage = crearStorage({ lanzaEscritura: true })
    const { result } = renderHook(() => useTemaTablero({ storage }))

    act(() => result.current.alternarTema())

    expect(result.current.tema).toBe('dark')
  })
})
