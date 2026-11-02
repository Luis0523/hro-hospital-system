import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const { buscarExpedienteParaDepurar, listarDepuraciones, marcarDepurado } = vi.hoisted(() => ({
  buscarExpedienteParaDepurar: vi.fn(),
  listarDepuraciones: vi.fn(),
  marcarDepurado: vi.fn(),
}))

vi.mock('../api/depuracionArchivoApi', () => ({
  USANDO_DATOS_MOCK: true,
  buscarExpedienteParaDepurar,
  listarDepuraciones,
  marcarDepurado,
}))

import { useDepuracionExpediente } from './useDepuracionExpediente'

const EXPEDIENTE = {
  expedienteId: 'exp-1',
  numeroExpediente: 'EXP-ROBUSTEZ-1',
  pacienteNombre: 'Paciente de Prueba',
  depurado: false,
}

const REGISTRO = {
  id: 'dep-1',
  expedienteId: 'exp-1',
  numeroExpediente: 'EXP-ROBUSTEZ-1',
  pacienteNombre: 'Paciente de Prueba',
  motivo: null,
  usuarioNombre: 'Archivo Central',
  depuradoEn: new Date().toISOString(),
}

function errorCon(status, message = 'fallo') {
  return Object.assign(new Error(message), { status })
}

async function montarConExpediente() {
  buscarExpedienteParaDepurar.mockResolvedValue(EXPEDIENTE)
  const hook = renderHook(() => useDepuracionExpediente())
  await waitFor(() => expect(hook.result.current.bitacoraCargada).toBe(true))
  act(() => hook.result.current.setNumero(EXPEDIENTE.numeroExpediente))
  await waitFor(() => expect(hook.result.current.estado).toBe('encontrado'))
  return hook
}

describe('useDepuracionExpediente · bitácora robusta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listarDepuraciones.mockResolvedValue([])
  })

  it('expone la carga pendiente sin declarar la bitácora vacía', async () => {
    let resolver
    listarDepuraciones.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolver = resolve
        }),
    )

    const { result } = renderHook(() => useDepuracionExpediente())

    expect(result.current.cargandoBitacora).toBe(true)
    expect(result.current.bitacoraCargada).toBe(false)
    expect(result.current.depurados).toEqual([])

    await act(async () => {
      resolver([REGISTRO])
    })

    expect(result.current.bitacoraCargada).toBe(true)
    expect(result.current.depurados).toEqual([REGISTRO])
  })

  it('carga registros y marca la bitácora como disponible', async () => {
    listarDepuraciones.mockResolvedValueOnce([REGISTRO])

    const { result } = renderHook(() => useDepuracionExpediente())

    await waitFor(() => expect(result.current.bitacoraCargada).toBe(true))
    expect(result.current.cargandoBitacora).toBe(false)
    expect(result.current.errorBitacora).toBeNull()
    expect(result.current.depurados).toEqual([REGISTRO])
  })

  it('muestra vacío solo cuando la primera consulta responde sin registros', async () => {
    listarDepuraciones.mockResolvedValueOnce([])

    const { result } = renderHook(() => useDepuracionExpediente())

    await waitFor(() => expect(result.current.bitacoraCargada).toBe(true))
    expect(result.current.cargandoBitacora).toBe(false)
    expect(result.current.errorBitacora).toBeNull()
    expect(result.current.depurados).toEqual([])
  })

  it('reporta un error de consulta sin destruir el arreglo', async () => {
    listarDepuraciones.mockRejectedValueOnce(errorCon(500))

    const { result } = renderHook(() => useDepuracionExpediente())

    await waitFor(() => expect(result.current.errorBitacora).toBeTruthy())
    expect(result.current.bitacoraCargada).toBe(false)
    expect(result.current.cargandoBitacora).toBe(false)
    expect(result.current.depurados).toEqual([])
    expect(result.current.errorBitacora).toMatch(/no se pudo cargar la bitácora/i)
  })

  it('distingue un error de autenticación', async () => {
    listarDepuraciones.mockRejectedValueOnce(errorCon(401))

    const { result } = renderHook(() => useDepuracionExpediente())

    await waitFor(() => expect(result.current.errorBitacora).toBeTruthy())
    expect(result.current.errorBitacora).toMatch(/autorizada|sesión/i)
  })

  it('reintenta la bitácora y limpia el error al tener éxito', async () => {
    listarDepuraciones.mockRejectedValueOnce(errorCon(500)).mockResolvedValueOnce([REGISTRO])

    const { result } = renderHook(() => useDepuracionExpediente())
    await waitFor(() => expect(result.current.errorBitacora).toBeTruthy())

    await act(async () => {
      await result.current.reintentarBitacora()
    })

    expect(result.current.errorBitacora).toBeNull()
    expect(result.current.bitacoraCargada).toBe(true)
    expect(result.current.depurados).toEqual([REGISTRO])
  })

  it('mantiene el error si el reintento vuelve a fallar', async () => {
    listarDepuraciones.mockRejectedValueOnce(errorCon(500)).mockRejectedValueOnce(errorCon(500))

    const { result } = renderHook(() => useDepuracionExpediente())
    await waitFor(() => expect(result.current.errorBitacora).toBeTruthy())

    await act(async () => {
      await result.current.reintentarBitacora()
    })

    expect(listarDepuraciones).toHaveBeenCalledTimes(2)
    expect(result.current.errorBitacora).toBeTruthy()
    expect(result.current.cargandoBitacora).toBe(false)
  })

  it('conserva los datos previos si falla una actualización', async () => {
    listarDepuraciones.mockResolvedValueOnce([REGISTRO]).mockRejectedValueOnce(errorCon(500))

    const { result } = renderHook(() => useDepuracionExpediente())
    await waitFor(() => expect(result.current.bitacoraCargada).toBe(true))

    await act(async () => {
      await result.current.reintentarBitacora()
    })

    expect(result.current.errorBitacora).toBeTruthy()
    expect(result.current.bitacoraCargada).toBe(true)
    expect(result.current.depurados).toEqual([REGISTRO])
  })
})

describe('useDepuracionExpediente · registro y recarga separados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listarDepuraciones.mockResolvedValue([])
  })

  it('POST y GET correctos: muestra éxito, limpia y recarga', async () => {
    listarDepuraciones.mockResolvedValueOnce([]).mockResolvedValueOnce([REGISTRO])
    marcarDepurado.mockResolvedValue(REGISTRO)

    const { result } = await montarConExpediente()

    await act(async () => {
      await result.current.confirmarDepuracion()
    })

    expect(marcarDepurado).toHaveBeenCalledTimes(1)
    expect(result.current.exito).toMatch(/depurado/i)
    expect(result.current.numero).toBe('')
    expect(result.current.errorBitacora).toBeNull()
    expect(result.current.depurados).toEqual([REGISTRO])
  })

  it('POST fallido: reporta error sin declarar éxito ni limpiar los datos', async () => {
    marcarDepurado.mockRejectedValueOnce(errorCon(500))

    const { result } = await montarConExpediente()

    await act(async () => {
      await result.current.confirmarDepuracion()
    })

    expect(result.current.exito).toBeNull()
    expect(result.current.estado).toBe('error')
    expect(result.current.mensaje).toMatch(/no se pudo registrar la depuración/i)
    expect(result.current.numero).toBe(EXPEDIENTE.numeroExpediente)
  })

  it('POST con fallo de red: mantiene un mensaje prudente', async () => {
    marcarDepurado.mockRejectedValueOnce(new Error('Network Error'))

    const { result } = await montarConExpediente()

    await act(async () => {
      await result.current.confirmarDepuracion()
    })

    expect(result.current.exito).toBeNull()
    expect(result.current.estado).toBe('error')
    expect(result.current.mensaje).toMatch(/conexión/i)
  })

  it('POST correcto y GET fallido: conserva el éxito y expone el aviso de bitácora', async () => {
    listarDepuraciones.mockResolvedValueOnce([]).mockRejectedValueOnce(errorCon(500))
    marcarDepurado.mockResolvedValue(REGISTRO)

    const { result } = await montarConExpediente()

    await act(async () => {
      await result.current.confirmarDepuracion()
    })

    expect(result.current.exito).toMatch(/depurado/i)
    expect(result.current.errorBitacora).toMatch(/no se pudo cargar la bitácora/i)
    expect(result.current.depurados).toEqual([])
    expect(result.current.mensaje).toBeNull()
  })

  it('reintenta solo el GET tras un POST exitoso', async () => {
    listarDepuraciones
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(errorCon(500))
      .mockResolvedValueOnce([REGISTRO])
    marcarDepurado.mockResolvedValue(REGISTRO)

    const { result } = await montarConExpediente()

    await act(async () => {
      await result.current.confirmarDepuracion()
    })
    expect(result.current.errorBitacora).toBeTruthy()

    await act(async () => {
      await result.current.reintentarBitacora()
    })

    expect(marcarDepurado).toHaveBeenCalledTimes(1)
    expect(result.current.errorBitacora).toBeNull()
    expect(result.current.depurados).toEqual([REGISTRO])
    expect(result.current.exito).toMatch(/depurado/i)
  })

  it('no duplica el POST ante dos confirmaciones en el mismo tick', async () => {
    let resolver
    marcarDepurado.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolver = resolve
        }),
    )

    const { result } = await montarConExpediente()

    await act(async () => {
      const primera = result.current.confirmarDepuracion()
      const segunda = result.current.confirmarDepuracion()
      await Promise.resolve()
      expect(marcarDepurado).toHaveBeenCalledTimes(1)
      resolver(REGISTRO)
      await Promise.all([primera, segunda])
    })

    await waitFor(() => expect(result.current.exito).toBeTruthy())
  })

  it('conserva el tratamiento de 404 y 409', async () => {
    marcarDepurado.mockRejectedValueOnce(errorCon(404))

    const primero = await montarConExpediente()
    await act(async () => {
      await primero.result.current.confirmarDepuracion()
    })
    expect(primero.result.current.estado).toBe('no_encontrado')
    expect(primero.result.current.mensaje).toMatch(/no existe/i)
    primero.unmount()

    marcarDepurado.mockRejectedValueOnce(errorCon(409))
    const segundo = await montarConExpediente()
    await act(async () => {
      await segundo.result.current.confirmarDepuracion()
    })
    expect(segundo.result.current.estado).toBe('duplicado')
    expect(segundo.result.current.mensaje).toMatch(/ya estaba depurado/i)
  })
})
