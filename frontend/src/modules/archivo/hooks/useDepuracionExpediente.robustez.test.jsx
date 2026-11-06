import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const { deshacerUltimaDepuracion, listarDepuraciones, marcarDepurado } = vi.hoisted(() => ({
  deshacerUltimaDepuracion: vi.fn(),
  listarDepuraciones: vi.fn(),
  marcarDepurado: vi.fn(),
}))

vi.mock('../api/depuracionArchivoApi', () => ({
  USANDO_DATOS_MOCK: true,
  deshacerUltimaDepuracion,
  listarDepuraciones,
  marcarDepurado,
}))

import { useDepuracionExpediente } from './useDepuracionExpediente'

const EXPEDIENTE = {
  expedienteId: 'exp-1',
  numeroExpediente: '927581',
  pacienteNombre: 'Paciente de Prueba',
  depurado: false,
}

const REGISTRO = {
  id: 'dep-1',
  expedienteId: 'exp-1',
  numeroExpediente: '927581',
  pacienteNombre: 'Paciente de Prueba',
  motivo: null,
  usuarioNombre: 'Archivo Central',
  depuradoEn: new Date().toISOString(),
}

function errorCon(status, message = 'fallo') {
  return Object.assign(new Error(message), { status })
}

async function montar() {
  const hook = renderHook(() => useDepuracionExpediente())
  await waitFor(() => expect(hook.result.current.bitacoraCargada).toBe(true))
  return hook
}

function enviar(result, numero = EXPEDIENTE.numeroExpediente) {
  act(() => {
    result.current.agregar(numero)
  })
}

describe('useDepuracionExpediente · bitácora robusta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deshacerUltimaDepuracion.mockReset()
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

  it('no procesa si el formato del expediente es inválido', async () => {
    const { result } = await montar()

    enviar(result, 'ABC-123')

    expect(result.current.estado).toBe('formato_invalido')
    expect(marcarDepurado).not.toHaveBeenCalled()
    expect(result.current.depurados).toEqual([])
  })
})

describe('useDepuracionExpediente · registro y recarga separados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deshacerUltimaDepuracion.mockReset()
    listarDepuraciones.mockResolvedValue([])
  })

  it('POST y GET correctos: muestra éxito y recarga la bitácora', async () => {
    listarDepuraciones.mockResolvedValueOnce([]).mockResolvedValueOnce([REGISTRO])
    marcarDepurado.mockResolvedValue(REGISTRO)

    const { result } = await montar()
    enviar(result)

    await waitFor(() => expect(marcarDepurado).toHaveBeenCalledTimes(1))
    expect(marcarDepurado).toHaveBeenCalledWith({ numeroExpediente: EXPEDIENTE.numeroExpediente })
    await waitFor(() => expect(result.current.exito).toMatch(/depurado/i))
    expect(result.current.errorBitacora).toBeNull()
    await waitFor(() => expect(result.current.depurados).toEqual([REGISTRO]))
  })

  it('POST fallido: muestra el error y no recarga la bitácora', async () => {
    marcarDepurado.mockRejectedValueOnce(errorCon(500))

    const { result } = await montar()
    enviar(result)

    await waitFor(() => expect(result.current.estado).toBe('error'))
    expect(result.current.exito).toBeNull()
    expect(result.current.mensaje).toMatch(/no se pudo registrar la depuración/i)
    expect(result.current.depurados).toEqual([])
  })

  it('POST con fallo de red: mantiene un mensaje prudente', async () => {
    marcarDepurado.mockRejectedValueOnce(new Error('Network Error'))

    const { result } = await montar()
    enviar(result)

    await waitFor(() => expect(result.current.estado).toBe('error'))
    expect(result.current.mensaje).toMatch(/no se pudo consultar el hospital/i)
  })

  it('POST correcto y GET fallido: conserva el éxito y expone el aviso de bitácora', async () => {
    listarDepuraciones.mockResolvedValueOnce([]).mockRejectedValueOnce(errorCon(500))
    marcarDepurado.mockResolvedValue(REGISTRO)

    const { result } = await montar()
    enviar(result)

    await waitFor(() => expect(result.current.exito).toMatch(/depurado/i))
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

    const { result } = await montar()
    enviar(result)
    await waitFor(() => expect(result.current.errorBitacora).toBeTruthy())

    await act(async () => {
      await result.current.reintentarBitacora()
    })

    expect(marcarDepurado).toHaveBeenCalledTimes(1)
    expect(result.current.errorBitacora).toBeNull()
    expect(result.current.depurados).toEqual([REGISTRO])
    expect(result.current.exito).toMatch(/depurado/i)
  })

  it('no duplica el POST ante dos envíos del mismo expediente', async () => {
    let resolver
    marcarDepurado.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolver = resolve
        }),
    )

    const { result } = await montar()
    act(() => {
      result.current.agregar(EXPEDIENTE.numeroExpediente)
    })
    act(() => {
      result.current.agregar(EXPEDIENTE.numeroExpediente)
    })

    expect(marcarDepurado).toHaveBeenCalledTimes(1)
    expect(result.current.estado).toBe('duplicado')

    await act(async () => {
      resolver(REGISTRO)
    })
    await waitFor(() => expect(result.current.exito).toBeTruthy())
  })

  it('conserva el tratamiento de 404 y 409', async () => {
    marcarDepurado.mockRejectedValueOnce(errorCon(404))

    const primero = await montar()
    enviar(primero.result)
    await waitFor(() => expect(primero.result.current.estado).toBe('no_encontrado'))
    expect(primero.result.current.mensaje).toMatch(/no existe/i)
    primero.unmount()

    marcarDepurado.mockRejectedValueOnce(errorCon(409))
    const segundo = await montar()
    enviar(segundo.result)
    await waitFor(() => expect(segundo.result.current.estado).toBe('duplicado'))
    expect(segundo.result.current.mensaje).toMatch(/ya está depurado/i)
  })

  it('actualiza el historial según el filtro vigente sin inyectar la baja', async () => {
    marcarDepurado.mockResolvedValue(REGISTRO)
    const { result } = await montar()

    act(() => result.current.seleccionarPeriodo('personalizado'))
    act(() => result.current.cambiarRango('desde', '2000-01-01'))
    act(() => result.current.cambiarRango('hasta', '2000-01-02'))
    act(() => result.current.aplicarRangoPersonalizado())

    await waitFor(() => expect(result.current.filtroActivo).toBe('personalizado'))
    await waitFor(() => expect(result.current.cargandoBitacora).toBe(false))
    vi.clearAllMocks()

    enviar(result)

    await waitFor(() => expect(result.current.exito).toMatch(/depurado/i))
    expect(result.current.depurados).toEqual([])
    expect(listarDepuraciones).toHaveBeenCalledTimes(2)
    expect(listarDepuraciones.mock.calls.map(([opciones]) => opciones.fecha).sort()).toEqual([
      '2000-01-01',
      '2000-01-02',
    ])
  })

  it('no duplica la reversión ante dos confirmaciones en el mismo tick', async () => {
    let resolver
    marcarDepurado.mockResolvedValue(REGISTRO)
    deshacerUltimaDepuracion.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolver = resolve
        }),
    )
    listarDepuraciones
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([REGISTRO])
      .mockResolvedValueOnce([])

    const { result } = await montar()
    enviar(result)
    await waitFor(() => expect(result.current.ultimaDepuracion).toBeTruthy())

    act(() => result.current.abrirDeshacer())
    await act(async () => {
      const primera = result.current.confirmarDeshacer()
      const segunda = result.current.confirmarDeshacer()
      await Promise.resolve()
      expect(deshacerUltimaDepuracion).toHaveBeenCalledTimes(1)
      resolver(REGISTRO)
      await Promise.all([primera, segunda])
    })

    await waitFor(() => expect(result.current.ultimaDepuracion).toBeNull())
    expect(result.current.depurados).toEqual([])
  })

  it('conserva el modal y muestra el error si la reversión falla', async () => {
    marcarDepurado.mockResolvedValue(REGISTRO)
    deshacerUltimaDepuracion.mockRejectedValueOnce(errorCon(409))
    listarDepuraciones.mockResolvedValueOnce([]).mockResolvedValueOnce([REGISTRO])

    const { result } = await montar()
    enviar(result)
    await waitFor(() => expect(result.current.ultimaDepuracion).toBeTruthy())

    act(() => result.current.abrirDeshacer())
    await act(async () => {
      await result.current.confirmarDeshacer()
    })

    expect(result.current.confirmacionDeshacerAbierta).toBe(true)
    expect(result.current.ultimaDepuracion?.numeroExpediente).toBe(REGISTRO.numeroExpediente)
    expect(result.current.errorDeshacer).toMatch(/no hay una depuración reversible/i)
  })
})
