import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const {
  buscarExpedienteParaDepurar,
  deshacerUltimaDepuracion,
  listarDepuraciones,
  marcarDepurado,
} = vi.hoisted(() => ({
  buscarExpedienteParaDepurar: vi.fn(),
  deshacerUltimaDepuracion: vi.fn(),
  listarDepuraciones: vi.fn(),
  marcarDepurado: vi.fn(),
}))

vi.mock('../api/depuracionArchivoApi', () => ({
  USANDO_DATOS_MOCK: true,
  buscarExpedienteParaDepurar,
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

async function montarConExpediente({ abrir = true } = {}) {
  buscarExpedienteParaDepurar.mockResolvedValue(EXPEDIENTE)
  const hook = renderHook(() => useDepuracionExpediente())
  await waitFor(() => expect(hook.result.current.bitacoraCargada).toBe(true))
  act(() => hook.result.current.setNumero(EXPEDIENTE.numeroExpediente))
  await waitFor(() => expect(hook.result.current.estado).toBe('encontrado'))
  if (abrir) act(() => hook.result.current.abrirConfirmacion())
  return hook
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

  it('no busca si el formato del expediente es inválido', async () => {
    const { result } = renderHook(() => useDepuracionExpediente())

    act(() => result.current.setNumero('ABC-123'))

    await waitFor(() => expect(result.current.estado).toBe('formato_invalido'))
    expect(buscarExpedienteParaDepurar).not.toHaveBeenCalled()
    expect(result.current.resultado).toBeNull()
  })
})

describe('useDepuracionExpediente · registro y recarga separados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deshacerUltimaDepuracion.mockReset()
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
    expect(marcarDepurado).toHaveBeenCalledWith({ numeroExpediente: EXPEDIENTE.numeroExpediente })
    expect(result.current.exito).toMatch(/depurado/i)
    expect(result.current.numero).toBe('')
    expect(result.current.errorBitacora).toBeNull()
    expect(result.current.depurados).toEqual([REGISTRO])
    expect(result.current.confirmacionAbierta).toBe(false)
  })

  it('POST fallido: conserva el contexto y muestra el error en la tarjeta', async () => {
    marcarDepurado.mockRejectedValueOnce(errorCon(500))

    const { result } = await montarConExpediente()

    await act(async () => {
      await result.current.confirmarDepuracion()
    })

    expect(result.current.exito).toBeNull()
    expect(result.current.estado).toBe('encontrado')
    expect(result.current.errorConfirmacion).toMatch(/no se pudo registrar la depuración/i)
    expect(result.current.numero).toBe(EXPEDIENTE.numeroExpediente)
    expect(result.current.confirmacionAbierta).toBe(true)
  })

  it('POST con fallo de red: mantiene un mensaje prudente', async () => {
    marcarDepurado.mockRejectedValueOnce(new Error('Network Error'))

    const { result } = await montarConExpediente()

    await act(async () => {
      await result.current.confirmarDepuracion()
    })

    expect(result.current.exito).toBeNull()
    expect(result.current.estado).toBe('encontrado')
    expect(result.current.errorConfirmacion).toMatch(/conexión/i)
    expect(result.current.confirmacionAbierta).toBe(true)
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
    expect(result.current.confirmacionAbierta).toBe(false)
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

  it('no confirma si la confirmación integrada está cerrada', async () => {
    const { result } = await montarConExpediente({ abrir: false })

    await act(async () => {
      await result.current.confirmarDepuracion()
    })

    expect(marcarDepurado).not.toHaveBeenCalled()
    expect(result.current.confirmacionAbierta).toBe(false)
  })

  it('conserva el tratamiento de 404 y 409', async () => {
    marcarDepurado.mockRejectedValueOnce(errorCon(404))

    const primero = await montarConExpediente()
    await act(async () => {
      await primero.result.current.confirmarDepuracion()
    })
    expect(primero.result.current.estado).toBe('no_encontrado')
    expect(primero.result.current.mensaje).toMatch(/no existe/i)
    expect(primero.result.current.confirmacionAbierta).toBe(false)
    primero.unmount()

    marcarDepurado.mockRejectedValueOnce(errorCon(409))
    const segundo = await montarConExpediente()
    await act(async () => {
      await segundo.result.current.confirmarDepuracion()
    })
    expect(segundo.result.current.estado).toBe('duplicado')
    expect(segundo.result.current.mensaje).toMatch(/ya estaba depurado/i)
    expect(segundo.result.current.confirmacionAbierta).toBe(false)
  })

  it('actualiza el historial según el filtro vigente sin inyectar la baja', async () => {
    marcarDepurado.mockResolvedValue(REGISTRO)
    const { result } = await montarConExpediente({ abrir: false })

    act(() => result.current.seleccionarPeriodo('personalizado'))
    act(() => result.current.cambiarRango('desde', '2000-01-01'))
    act(() => result.current.cambiarRango('hasta', '2000-01-02'))
    act(() => result.current.aplicarRangoPersonalizado())

    await waitFor(() => expect(result.current.filtroActivo).toBe('personalizado'))
    await waitFor(() => expect(result.current.cargandoBitacora).toBe(false))
    vi.clearAllMocks()

    act(() => result.current.abrirConfirmacion())
    await act(async () => {
      await result.current.confirmarDepuracion()
    })

    expect(result.current.exito).toMatch(/depurado/i)
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

    const { result } = await montarConExpediente()
    await act(async () => {
      await result.current.confirmarDepuracion()
    })
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

    const { result } = await montarConExpediente()
    await act(async () => {
      await result.current.confirmarDepuracion()
    })
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
