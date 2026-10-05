import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { cargarLoteEstacion } from '../api/coexApi'
import { useLoteCoex } from './useLoteCoex'

vi.mock('../api/coexApi', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, cargarLoteEstacion: vi.fn() }
})

const fila = (over = {}) => ({
  citaId: 1,
  horaEstimada: '08:30:00',
  pacienteId: 'p1',
  pacienteNombre: 'María López',
  numeroExpediente: 'EXP-001',
  expedienteId: 'e1',
  subespecialidadId: 1,
  subespecialidadNombre: 'Medicina General',
  cicloId: 'c1',
  estadoActual: 'en_transito_entrega',
  ubicacionBase: null,
  ...over,
})

const lote = (filas) => ({ subespecialidades: [{ id: 1 }], filas })

function activarEstacion() {
  localStorage.setItem(
    'hro_estacion',
    JSON.stringify({ id: 3, codigo: 'BOX-03', nombre: 'COEX Consulta Externa', ubicacion: 'Nivel 1' }),
  )
}

const wrapper = ({ children }) => <EstacionProvider>{children}</EstacionProvider>

const renderLote = () => renderHook(() => useLoteCoex(), { wrapper })

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  activarEstacion()
})

describe('useLoteCoex - Fase 4 (refresco silencioso)', () => {
  it('1. la carga inicial mantiene el comportamiento actual (cargando y error propios)', async () => {
    cargarLoteEstacion.mockResolvedValue(lote([fila()]))

    const { result } = renderLote()
    await waitFor(() => expect(result.current.cargando).toBe(false))

    expect(result.current.filas).toHaveLength(1)
    expect(result.current.error).toBeNull()
    expect(result.current.errorRefresco).toBeNull()
    expect(result.current.ultimaActualizacion).toBeInstanceOf(Date)
  })

  it('2. el refresco silencioso NO activa `cargando`', async () => {
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila()]))

    const { result } = renderLote()
    await waitFor(() => expect(result.current.cargando).toBe(false))

    let resolver
    cargarLoteEstacion.mockImplementationOnce(() => new Promise((r) => (resolver = r)))

    let promesa
    act(() => {
      promesa = result.current.refrescarSilencioso()
    })

    await waitFor(() => expect(result.current.refrescando).toBe(true))
    expect(result.current.cargando).toBe(false)

    await act(async () => {
      resolver(lote([fila()]))
      await promesa
    })

    expect(result.current.cargando).toBe(false)
    expect(result.current.refrescando).toBe(false)
  })

  it('3. un refresco exitoso actualiza las filas', async () => {
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila({ numeroExpediente: 'EXP-1' })]))

    const { result } = renderLote()
    await waitFor(() => expect(result.current.filas).toHaveLength(1))

    cargarLoteEstacion.mockResolvedValueOnce(lote([fila({ numeroExpediente: 'EXP-2' })]))
    await act(async () => {
      await result.current.refrescarSilencioso()
    })

    expect(result.current.filas[0].numeroExpediente).toBe('EXP-2')
  })

  it('4. un refresco exitoso actualiza `ultimaActualizacion`', async () => {
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila()]))

    const { result } = renderLote()
    await waitFor(() => expect(result.current.ultimaActualizacion).toBeInstanceOf(Date))
    const anterior = result.current.ultimaActualizacion

    cargarLoteEstacion.mockResolvedValueOnce(lote([fila()]))
    await act(async () => {
      await result.current.refrescarSilencioso()
    })

    expect(result.current.ultimaActualizacion).toBeInstanceOf(Date)
    expect(result.current.ultimaActualizacion).not.toBe(anterior)
  })

  it('5. un refresco fallido conserva las filas anteriores', async () => {
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila({ numeroExpediente: 'EXP-1' })]))

    const { result } = renderLote()
    await waitFor(() => expect(result.current.filas).toHaveLength(1))

    cargarLoteEstacion.mockRejectedValueOnce(new Error('red caída'))
    await act(async () => {
      await result.current.refrescarSilencioso()
    })

    expect(result.current.filas).toHaveLength(1)
    expect(result.current.filas[0].numeroExpediente).toBe('EXP-1')
  })

  it('6. un refresco fallido conserva la última actualización previa', async () => {
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila()]))

    const { result } = renderLote()
    await waitFor(() => expect(result.current.ultimaActualizacion).toBeInstanceOf(Date))
    const anterior = result.current.ultimaActualizacion

    cargarLoteEstacion.mockRejectedValueOnce(new Error('red caída'))
    await act(async () => {
      await result.current.refrescarSilencioso()
    })

    expect(result.current.ultimaActualizacion).toBe(anterior)
  })

  it('7. expone `errorRefresco` cuando falla el refresco silencioso', async () => {
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila()]))

    const { result } = renderLote()
    await waitFor(() => expect(result.current.cargando).toBe(false))

    cargarLoteEstacion.mockRejectedValueOnce(new Error('red caída'))
    await act(async () => {
      await result.current.refrescarSilencioso()
    })

    expect(result.current.errorRefresco).toBeInstanceOf(Error)
    expect(result.current.errorRefresco.message).toBe('red caída')
    expect(result.current.error).toBeNull()
  })

  it('8. un refresco exitoso posterior limpia `errorRefresco`', async () => {
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila()]))

    const { result } = renderLote()
    await waitFor(() => expect(result.current.cargando).toBe(false))

    cargarLoteEstacion.mockRejectedValueOnce(new Error('red caída'))
    await act(async () => {
      await result.current.refrescarSilencioso()
    })
    expect(result.current.errorRefresco).toBeInstanceOf(Error)

    cargarLoteEstacion.mockResolvedValueOnce(lote([fila()]))
    await act(async () => {
      await result.current.refrescarSilencioso()
    })

    expect(result.current.errorRefresco).toBeNull()
  })

  it('9. el lock evita iniciar dos peticiones simultáneas (coalesce uno)', async () => {
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila()]))

    const { result } = renderLote()
    await waitFor(() => expect(result.current.cargando).toBe(false))

    let resolver
    cargarLoteEstacion.mockImplementationOnce(() => new Promise((r) => (resolver = r)))
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila({ numeroExpediente: 'COALESCIDO' })]))

    let p1
    let p2
    act(() => {
      p1 = result.current.refrescarSilencioso()
    })
    act(() => {
      p2 = result.current.refrescarSilencioso()
    })

    // Sólo la primera inició petición (inicial + 1); la segunda se coalesció.
    expect(cargarLoteEstacion).toHaveBeenCalledTimes(2)
    expect(await p2).toBeNull()

    await act(async () => {
      resolver(lote([fila({ numeroExpediente: 'PRIMERO' })]))
      await p1
    })

    await waitFor(() => expect(cargarLoteEstacion).toHaveBeenCalledTimes(3))
    expect(result.current.filas[0].numeroExpediente).toBe('COALESCIDO')
  })

  it('10. una respuesta obsoleta no sobrescribe una más reciente', async () => {
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila({ numeroExpediente: 'INICIAL' })]))

    const { result } = renderLote()
    await waitFor(() => expect(result.current.filas[0]?.numeroExpediente).toBe('INICIAL'))

    let resolverViejo
    cargarLoteEstacion.mockImplementationOnce(() => new Promise((r) => (resolverViejo = r)))

    let promesaVieja
    act(() => {
      promesaVieja = result.current.refrescarSilencioso()
    })

    // Nueva operación (cambio de fecha) que invalida la respuesta en vuelo.
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila({ numeroExpediente: 'NUEVO' })]))
    act(() => {
      result.current.setFecha('2026-01-02')
    })
    await waitFor(() => expect(result.current.filas[0]?.numeroExpediente).toBe('NUEVO'))

    // La respuesta vieja llega tarde y debe descartarse.
    await act(async () => {
      resolverViejo(lote([fila({ numeroExpediente: 'VIEJO' })]))
      await promesaVieja
    })

    expect(result.current.filas[0].numeroExpediente).toBe('NUEVO')
  })

  it('11. al desmontar no aplica el resultado del refresco en vuelo', async () => {
    cargarLoteEstacion.mockResolvedValueOnce(lote([fila()]))

    const { result, unmount } = renderLote()
    await waitFor(() => expect(result.current.cargando).toBe(false))

    let resolver
    cargarLoteEstacion.mockImplementationOnce(() => new Promise((r) => (resolver = r)))

    let promesa
    act(() => {
      promesa = result.current.refrescarSilencioso()
    })

    unmount()

    await act(async () => {
      resolver(lote([fila({ numeroExpediente: 'TARDE' })]))
      expect(await promesa).toBeNull()
    })
  })
})
