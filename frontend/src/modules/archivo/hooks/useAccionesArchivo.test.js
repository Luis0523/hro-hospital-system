import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import {
  crearActaRecepcion,
  obtenerActaRecepcionPdf,
  obtenerResumenArchivo,
  obtenerResumenArchivoPdf,
} from '../api/archivoApi'
import { descargarBlob } from '../utils/descargarBlob'
import { useAccionesArchivo } from './useAccionesArchivo'

vi.mock('../api/archivoApi', () => ({
  obtenerResumenArchivo: vi.fn(),
  obtenerResumenArchivoPdf: vi.fn(),
  crearActaRecepcion: vi.fn(),
  obtenerActaRecepcionPdf: vi.fn(),
}))

vi.mock('../utils/descargarBlob', () => ({ descargarBlob: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAccionesArchivo', () => {
  it('consulta el resumen y expone el resultado', async () => {
    obtenerResumenArchivo.mockResolvedValue({ fecha: '2026-11-09', totalCiclos: 3 })

    const { result } = renderHook(() => useAccionesArchivo())
    await act(async () => {
      await result.current.consultarResumen('2026-11-09')
    })

    expect(obtenerResumenArchivo).toHaveBeenCalledWith({ fecha: '2026-11-09' })
    expect(result.current.resumen).toEqual({ fecha: '2026-11-09', totalCiclos: 3 })
  })

  it('expone el estado de carga y lo libera al terminar', async () => {
    let resolver
    obtenerResumenArchivo.mockReturnValue(
      new Promise((res) => {
        resolver = res
      }),
    )

    const { result } = renderHook(() => useAccionesArchivo())
    let promesa
    act(() => {
      promesa = result.current.consultarResumen('2026-11-09')
    })

    await waitFor(() => expect(result.current.cargandoResumen).toBe(true))

    await act(async () => {
      resolver({ totalCiclos: 0 })
      await promesa
    })

    expect(result.current.cargandoResumen).toBe(false)
  })

  it('evita la doble ejecución mientras una acción está en curso', async () => {
    let resolver
    obtenerResumenArchivo.mockReturnValue(
      new Promise((res) => {
        resolver = res
      }),
    )

    const { result } = renderHook(() => useAccionesArchivo())
    let primera
    act(() => {
      primera = result.current.consultarResumen('2026-11-09')
    })

    await act(async () => {
      const segunda = await result.current.consultarResumen('2026-11-09')
      expect(segunda).toBeUndefined()
    })

    await act(async () => {
      resolver({ totalCiclos: 1 })
      await primera
    })

    expect(obtenerResumenArchivo).toHaveBeenCalledTimes(1)
  })

  it('propaga el error de la API', async () => {
    obtenerResumenArchivo.mockRejectedValue(new Error('backend caído'))

    const { result } = renderHook(() => useAccionesArchivo())

    await expect(result.current.consultarResumen('2026-11-09')).rejects.toThrow('backend caído')
    expect(result.current.cargandoResumen).toBe(false)
  })

  it('descarga el PDF del resumen con la fecha indicada', async () => {
    obtenerResumenArchivoPdf.mockResolvedValue(new Blob(['x'], { type: 'application/pdf' }))

    const { result } = renderHook(() => useAccionesArchivo())
    await act(async () => {
      await result.current.descargarResumenPdf('2026-11-09')
    })

    expect(obtenerResumenArchivoPdf).toHaveBeenCalledWith({ fecha: '2026-11-09' })
    expect(descargarBlob).toHaveBeenCalledTimes(1)
  })

  it('crea un acta y descarga su PDF', async () => {
    crearActaRecepcion.mockResolvedValue({ id: 5, numeroActa: 'ACT-2026-0005' })
    obtenerActaRecepcionPdf.mockResolvedValue(new Blob(['x'], { type: 'application/pdf' }))

    const { result } = renderHook(() => useAccionesArchivo())
    let acta
    await act(async () => {
      acta = await result.current.generarActa({ expedienteIds: ['uuid-1'] })
    })

    expect(acta.id).toBe(5)

    await act(async () => {
      await result.current.descargarActaPdf(acta.id)
    })

    expect(obtenerActaRecepcionPdf).toHaveBeenCalledWith(5)
    expect(descargarBlob).toHaveBeenCalledWith(expect.any(Blob), 'acta-5.pdf')
  })
})
