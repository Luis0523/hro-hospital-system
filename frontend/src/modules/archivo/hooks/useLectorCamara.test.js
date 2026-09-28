import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useLectorCamara } from './useLectorCamara'

const getUserMediaMock = vi.fn()
const detectMock = vi.fn()
let trackStop

class BarcodeDetectorMock {
  static getSupportedFormats() {
    return Promise.resolve(['qr_code'])
  }

  detect(...args) {
    return detectMock(...args)
  }
}

beforeEach(() => {
  detectMock.mockReset()
  getUserMediaMock.mockReset()
  trackStop = vi.fn()
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: getUserMediaMock },
  })
  window.BarcodeDetector = BarcodeDetectorMock
})

afterEach(() => {
  delete window.BarcodeDetector
})

describe('useLectorCamara', () => {
  it('informa cuando BarcodeDetector no está disponible sin abrir la cámara', async () => {
    delete window.BarcodeDetector

    const { result } = renderHook(() => useLectorCamara(() => {}))
    expect(result.current.soporteDetector).toBe(false)

    await act(async () => {
      await result.current.iniciar()
    })

    expect(result.current.error).toMatch(/no soporta la detección de códigos/i)
    expect(result.current.activo).toBe(false)
    expect(getUserMediaMock).not.toHaveBeenCalled()
  })

  it('informa cuando el permiso de cámara es denegado', async () => {
    const error = new Error('denied')
    error.name = 'NotAllowedError'
    getUserMediaMock.mockRejectedValue(error)

    const { result } = renderHook(() => useLectorCamara(() => {}))
    await act(async () => {
      await result.current.iniciar()
    })

    expect(result.current.error).toMatch(/permiso de cámara denegado/i)
    expect(result.current.activo).toBe(false)
  })

  it('informa cuando el dispositivo no tiene cámara', async () => {
    const error = new Error('no device')
    error.name = 'NotFoundError'
    getUserMediaMock.mockRejectedValue(error)

    const { result } = renderHook(() => useLectorCamara(() => {}))
    await act(async () => {
      await result.current.iniciar()
    })

    expect(result.current.error).toMatch(/no se encontró una cámara/i)
  })

  it('abre la cámara, libera los tracks al cerrar y permite reabrir', async () => {
    getUserMediaMock.mockResolvedValue({ getTracks: () => [{ stop: trackStop }] })

    const { result } = renderHook(() => useLectorCamara(() => {}))

    await act(async () => {
      await result.current.iniciar()
    })
    expect(result.current.activo).toBe(true)

    act(() => {
      result.current.detener()
    })
    expect(result.current.activo).toBe(false)
    expect(trackStop).toHaveBeenCalledTimes(1)

    getUserMediaMock.mockClear()
    await act(async () => {
      await result.current.iniciar()
    })
    expect(getUserMediaMock).toHaveBeenCalledTimes(1)
    expect(result.current.activo).toBe(true)

    act(() => {
      result.current.detener()
    })
  })

  it('detecta un código una sola vez y no repite la misma lectura', async () => {
    getUserMediaMock.mockResolvedValue({ getTracks: () => [{ stop: trackStop }] })
    detectMock.mockResolvedValue([{ rawValue: 'EXP-1' }])
    const onCodigo = vi.fn()

    const { result } = renderHook(() => useLectorCamara(onCodigo))

    await act(async () => {
      await result.current.iniciar()
    })

    // La cámara no tiene un <video> real en este test; se simula el elemento.
    result.current.videoRef.current = { srcObject: null }

    await waitFor(() => expect(onCodigo).toHaveBeenCalledWith('EXP-1'), { timeout: 2000 })

    await act(async () => {
      await new Promise((resolver) => setTimeout(resolver, 400))
    })
    expect(onCodigo).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.detener()
    })
  })
})
