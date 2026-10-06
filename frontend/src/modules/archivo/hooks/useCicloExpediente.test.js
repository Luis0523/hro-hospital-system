import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  archivarCiclo,
  checkInExpediente,
  despacharCiclo,
  iniciarBusquedaCiclo,
  localizarCiclo,
  noLocalizadoCiclo,
  obtenerCicloPorCita,
  reintentarBusquedaCiclo,
} from '../api/archivoApi'
import { useCicloExpediente } from './useCicloExpediente'

vi.mock('../api/archivoApi', () => ({
  checkInExpediente: vi.fn(),
  obtenerCicloPorCita: vi.fn(),
  iniciarBusquedaCiclo: vi.fn(),
  localizarCiclo: vi.fn(),
  despacharCiclo: vi.fn(),
  archivarCiclo: vi.fn(),
  noLocalizadoCiclo: vi.fn(),
  reintentarBusquedaCiclo: vi.fn(),
}))

const CICLO = {
  cicloId: 'c1',
  expedienteId: 'e1',
  citaId: 10,
  estadoActual: 'en_busqueda',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useCicloExpediente', () => {
  it('expone las acciones de Archivo y NO entregar/retornar', () => {
    const { result } = renderHook(() => useCicloExpediente())

    expect(result.current.ciclo).toBeNull()
    expect(result.current.cargando).toBe(false)
    expect(result.current.error).toBeNull()

    for (const accion of [
      'checkIn',
      'obtenerCiclo',
      'iniciarBusqueda',
      'localizar',
      'despachar',
      'archivar',
      'marcarNoLocalizado',
      'reintentarBusqueda',
    ]) {
      expect(typeof result.current[accion]).toBe('function')
    }

    expect(result.current.entregar).toBeUndefined()
    expect(result.current.retornar).toBeUndefined()
  })

  it('el check-in actualiza el ciclo con la respuesta del backend', async () => {
    checkInExpediente.mockResolvedValue(CICLO)

    const { result } = renderHook(() => useCicloExpediente())

    await act(async () => {
      await result.current.checkIn('e1', { citaId: 10 })
    })

    expect(checkInExpediente).toHaveBeenCalledWith('e1', { citaId: 10 })
    expect(result.current.ciclo).toEqual(CICLO)
  })

  it('consulta el ciclo por cita', async () => {
    obtenerCicloPorCita.mockResolvedValue({ ...CICLO, citaId: 77 })

    const { result } = renderHook(() => useCicloExpediente())

    await act(async () => {
      await result.current.obtenerCiclo(77)
    })

    expect(obtenerCicloPorCita).toHaveBeenCalledWith(77)
    expect(result.current.ciclo.citaId).toBe(77)
  })

  it('ejecuta las transiciones de Archivo y reemplaza el estado', async () => {
    iniciarBusquedaCiclo.mockResolvedValue({ ...CICLO, estadoActual: 'en_busqueda' })
    localizarCiclo.mockResolvedValue({ ...CICLO, estadoActual: 'localizado' })
    despacharCiclo.mockResolvedValue({ ...CICLO, estadoActual: 'en_transito_entrega' })
    archivarCiclo.mockResolvedValue({ ...CICLO, estadoActual: 'archivado' })
    noLocalizadoCiclo.mockResolvedValue({ ...CICLO, estadoActual: 'no_localizado' })
    reintentarBusquedaCiclo.mockResolvedValue({ ...CICLO, estadoActual: 'en_busqueda' })

    const { result } = renderHook(() => useCicloExpediente())

    await act(async () => {
      await result.current.iniciarBusqueda('c1')
    })
    expect(result.current.ciclo.estadoActual).toBe('en_busqueda')

    await act(async () => {
      await result.current.localizar('c1')
    })
    expect(result.current.ciclo.estadoActual).toBe('localizado')

    await act(async () => {
      await result.current.despachar('c1')
    })
    expect(result.current.ciclo.estadoActual).toBe('en_transito_entrega')

    await act(async () => {
      await result.current.archivar('c1')
    })
    expect(result.current.ciclo.estadoActual).toBe('archivado')

    await act(async () => {
      await result.current.marcarNoLocalizado('c1', { observacion: 'No estaba' })
    })
    expect(noLocalizadoCiclo).toHaveBeenCalledWith('c1', { observacion: 'No estaba' })
    expect(result.current.ciclo.estadoActual).toBe('no_localizado')

    await act(async () => {
      await result.current.reintentarBusqueda('c1')
    })
    expect(result.current.ciclo.estadoActual).toBe('en_busqueda')
  })

  it('propaga el error y lo expone sin dejar el hook en carga', async () => {
    const fallo = Object.assign(new Error('Transición inválida'), { status: 400 })
    localizarCiclo.mockRejectedValue(fallo)

    const { result } = renderHook(() => useCicloExpediente())

    await act(async () => {
      await expect(result.current.localizar('c1')).rejects.toMatchObject({ status: 400 })
    })

    expect(result.current.error).toBe(fallo)
    expect(result.current.cargando).toBe(false)
  })
})
