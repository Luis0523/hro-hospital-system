import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

vi.mock('@/modules/carnets/hooks/useCarnetsRealtime', () => ({
  useCarnetsRealtime: () => {},
}))

vi.mock('@/shared/context/ToastContext.jsx', () => ({
  useToast: () => ({ mostrarToast: vi.fn() }),
}))

vi.mock('@/modules/carnets/api/carnetsApi', () => ({
  listarCarnets: vi.fn(),
  salidaArchivoCarnet: vi.fn(),
}))

import { listarCarnets, salidaArchivoCarnet } from '@/modules/carnets/api/carnetsApi'
import { useSalidaArchivo } from './useSalidaArchivo'

function carnet(id, numeroExpediente, estado = 'registrado') {
  return {
    id,
    correlativo: 1,
    especialidadId: 1,
    especialidadNombre: 'Medicina Interna',
    numeroExpediente,
    pacienteNombre: 'Paciente Prueba',
    estado,
    fecha: '2026-10-12',
    registradoEn: '2026-10-12T10:00:00-06:00',
  }
}

describe('useSalidaArchivo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listarCarnets.mockResolvedValue([])
  })

  it('carga los carnets y separa pendientes de salidos', async () => {
    listarCarnets.mockResolvedValue([
      carnet('a', '243032'),
      carnet('b', '243033', 'salida_archivo'),
    ])
    const { result } = renderHook(() => useSalidaArchivo({ fecha: '2026-10-12' }))

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.pendientes).toHaveLength(1)
    expect(result.current.salidos).toHaveLength(1)
  })

  it('marca la salida de forma optimista y confirma en segundo plano', async () => {
    const pendiente = carnet('a', '243032')
    listarCarnets.mockResolvedValue([pendiente])
    salidaArchivoCarnet.mockResolvedValue({ ...pendiente, estado: 'salida_archivo' })

    const { result } = renderHook(() => useSalidaArchivo({ fecha: '2026-10-12' }))
    await waitFor(() => expect(result.current.cargando).toBe(false))

    act(() => {
      result.current.marcarSalida(pendiente)
    })

    // Optimista: la fila ya no está en pendientes y entra a la cola de confirmación.
    expect(result.current.pendientes).toHaveLength(0)
    expect(result.current.salidos).toHaveLength(1)
    expect(result.current.salidasSesion).toHaveLength(1)
    expect(result.current.salidasSesion[0].id).toBe('a')
    expect(result.current.confirmandoIds.has('a')).toBe(true)

    await waitFor(() => expect(salidaArchivoCarnet).toHaveBeenCalledWith('a'))
    await waitFor(() => expect(result.current.confirmandoIds.size).toBe(0))
  })

  it('revierte la fila cuando el backend rechaza la salida de forma definitiva', async () => {
    const pendiente = carnet('a', '243032')
    listarCarnets.mockResolvedValue([pendiente])
    salidaArchivoCarnet.mockRejectedValue(Object.assign(new Error('no'), { status: 400 }))

    const { result } = renderHook(() => useSalidaArchivo({ fecha: '2026-10-12' }))
    await waitFor(() => expect(result.current.cargando).toBe(false))

    act(() => {
      result.current.marcarSalida(pendiente)
    })

    await waitFor(() => expect(result.current.fallidos).toHaveLength(1))
    expect(result.current.pendientes).toHaveLength(1)
    expect(result.current.salidos).toHaveLength(0)
    expect(result.current.salidasSesion).toHaveLength(0)
  })

  it('no marca dos veces el mismo expediente mientras confirma', async () => {
    const pendiente = carnet('a', '243032')
    listarCarnets.mockResolvedValue([pendiente])
    salidaArchivoCarnet.mockResolvedValue({ ...pendiente, estado: 'salida_archivo' })

    const { result } = renderHook(() => useSalidaArchivo({ fecha: '2026-10-12' }))
    await waitFor(() => expect(result.current.cargando).toBe(false))

    act(() => {
      result.current.marcarSalida(pendiente)
      result.current.marcarSalida(pendiente)
    })

    await waitFor(() => expect(result.current.confirmandoIds.size).toBe(0))
    expect(salidaArchivoCarnet).toHaveBeenCalledTimes(1)
  })

  it('filtra coincidencias locales por número de expediente', async () => {
    listarCarnets.mockResolvedValue([
      carnet('a', '243032'),
      carnet('b', '243033'),
      carnet('c', '991111'),
    ])
    const { result } = renderHook(() => useSalidaArchivo({ fecha: '2026-10-12' }))
    await waitFor(() => expect(result.current.cargando).toBe(false))

    act(() => {
      result.current.setQuery('2430')
    })

    expect(result.current.coincidencias.map((c) => c.id)).toEqual(['a', 'b'])
  })
})
