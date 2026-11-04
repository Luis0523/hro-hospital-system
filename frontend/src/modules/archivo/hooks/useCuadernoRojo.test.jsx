import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { hoyIsoGuatemala } from '@/shared/utils/fecha'
import { useCuadernoRojo } from './useCuadernoRojo'
import { guardarCuadernoRojo, listarCuadernoRojo, obtenerCuadernoRojo } from '../api/archivoApi'

vi.mock('../api/archivoApi', () => ({
  listarCuadernoRojo: vi.fn(),
  obtenerCuadernoRojo: vi.fn(),
  guardarCuadernoRojo: vi.fn(),
}))

const HOY = hoyIsoGuatemala()
const ANIO = HOY.slice(0, 4)

function registro(fecha, cantidades = {}) {
  return {
    id: `registro-${fecha}`,
    fecha,
    egresosHospitalarios: 1,
    sobresEmergencia: 2,
    sobresSellados: 3,
    tia: 4,
    ...cantidades,
  }
}

function diferido() {
  let resolver
  let rechazar
  const promesa = new Promise((resolve, reject) => {
    resolver = resolve
    rechazar = reject
  })
  return { promesa, resolver, rechazar }
}

function establecerCantidades(resultado, cantidades) {
  act(() => {
    for (const [clave, valor] of Object.entries(cantidades)) {
      resultado.current.cambiarCampo(clave, String(valor))
    }
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  listarCuadernoRojo.mockResolvedValue([])
  obtenerCuadernoRojo.mockResolvedValue(null)
})

describe('useCuadernoRojo', () => {
  it('usa la fecha de Guatemala como valor inicial', async () => {
    const { result } = renderHook(() => useCuadernoRojo())

    await waitFor(() => expect(result.current.cargandoDia).toBe(false))

    expect(result.current.valores.fecha).toBe(HOY)
    expect(result.current.existente).toBe(false)
    expect(result.current.hayCambios).toBe(false)
  })

  it('carga un registro existente al consultar la fecha', async () => {
    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(result.current.cargandoDia).toBe(false))

    obtenerCuadernoRojo.mockResolvedValueOnce(registro('2026-11-02', { tia: 9 }))
    act(() => result.current.cambiarCampo('fecha', '2026-11-02'))

    await waitFor(() => expect(result.current.existente).toBe(true))
    expect(result.current.valores.tia).toBe('9')
  })

  it('deja las cantidades vacías cuando la fecha no tiene registro', async () => {
    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(result.current.cargandoDia).toBe(false))

    obtenerCuadernoRojo.mockResolvedValueOnce(null)
    act(() => result.current.cambiarCampo('fecha', '2026-11-02'))

    await waitFor(() => expect(result.current.cargandoDia).toBe(false))
    expect(result.current.existente).toBe(false)
    expect(result.current.valores.egresosHospitalarios).toBe('')
  })

  it('ejecuta un solo PUT ante dos intentos simultáneos', async () => {
    const pendiente = diferido()
    guardarCuadernoRojo.mockReturnValue(pendiente.promesa)

    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(result.current.cargandoDia).toBe(false))

    establecerCantidades(result, {
      egresosHospitalarios: 5,
      sobres: 6,
      sobresSellados: 7,
      tia: 8,
    })

    let primero
    let segundo
    await act(async () => {
      primero = result.current.guardar()
      segundo = result.current.guardar()
      pendiente.resolver(registro(HOY, { egresosHospitalarios: 5, sobresEmergencia: 6 }))
      await Promise.all([primero, segundo])
    })

    expect(guardarCuadernoRojo).toHaveBeenCalledTimes(1)
    expect(await segundo).toMatchObject({ ok: false, omitido: true })
  })

  it('ignora la respuesta antigua cuando se cambia de fecha rápidamente', async () => {
    const primera = diferido()
    const segunda = diferido()
    obtenerCuadernoRojo
      .mockImplementationOnce(() => primera.promesa)
      .mockImplementationOnce(() => segunda.promesa)

    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(obtenerCuadernoRojo).toHaveBeenCalledTimes(1))

    act(() => result.current.cambiarCampo('fecha', '2026-11-02'))
    await waitFor(() => expect(obtenerCuadernoRojo).toHaveBeenCalledTimes(2))

    await act(async () => {
      segunda.resolver(registro('2026-11-02', { egresosHospitalarios: 22 }))
      await segunda.promesa
    })
    await act(async () => {
      primera.resolver(registro(HOY, { egresosHospitalarios: 11 }))
      await primera.promesa
    })

    expect(result.current.valores.fecha).toBe('2026-11-02')
    expect(result.current.valores.egresosHospitalarios).toBe('22')
  })

  it('la selección desde el historial invalida el GET pendiente', async () => {
    const pendiente = diferido()
    obtenerCuadernoRojo.mockReturnValue(pendiente.promesa)

    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(obtenerCuadernoRojo).toHaveBeenCalledTimes(1))

    act(() => result.current.seleccionarRegistro(registro('2026-10-01', { tia: 9 })))
    await act(async () => {
      pendiente.resolver(registro(HOY, { tia: 1 }))
      await pendiente.promesa
    })

    expect(obtenerCuadernoRojo).toHaveBeenCalledTimes(1)
    expect(result.current.valores.fecha).toBe('2026-10-01')
    expect(result.current.valores.tia).toBe('9')
    expect(result.current.existente).toBe(true)
  })

  it('mantiene el guardado como exitoso si falla la recarga del historial', async () => {
    listarCuadernoRojo.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('sin red'))
    guardarCuadernoRojo.mockResolvedValue(registro(HOY, { tia: 6 }))

    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(result.current.cargandoHistorial).toBe(false))
    await waitFor(() => expect(result.current.cargandoDia).toBe(false))

    establecerCantidades(result, {
      egresosHospitalarios: 1,
      sobres: 2,
      sobresSellados: 3,
      tia: 6,
    })

    let resultado
    await act(async () => {
      resultado = await result.current.guardar()
    })

    expect(resultado).toMatchObject({ ok: true, historialActualizado: false })
    expect(result.current.error).toBeNull()
    expect(result.current.existente).toBe(true)
  })

  it('conserva las cantidades cuando el PUT falla con 400', async () => {
    guardarCuadernoRojo.mockRejectedValue(Object.assign(new Error('rechazado'), { status: 400 }))

    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(result.current.cargandoDia).toBe(false))

    establecerCantidades(result, {
      egresosHospitalarios: 5,
      sobres: 6,
      sobresSellados: 7,
      tia: 8,
    })

    let resultado
    await act(async () => {
      resultado = await result.current.guardar()
    })

    expect(resultado.ok).toBe(false)
    expect(resultado.error).toContain('rechazó')
    expect(result.current.valores.egresosHospitalarios).toBe('5')
  })

  it.each([
    [401, 'sesión'],
    [403, 'permiso'],
  ])('traduce el error HTTP %i a un mensaje claro', async (status, fragmento) => {
    guardarCuadernoRojo.mockRejectedValue(Object.assign(new Error('http'), { status }))

    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(result.current.cargandoDia).toBe(false))

    establecerCantidades(result, {
      egresosHospitalarios: 1,
      sobres: 2,
      sobresSellados: 3,
      tia: 4,
    })

    let resultado
    await act(async () => {
      resultado = await result.current.guardar()
    })

    expect(resultado.error.toLowerCase()).toContain(fragmento)
  })

  it('traduce un error de red sin status', async () => {
    guardarCuadernoRojo.mockRejectedValue(new Error('Network Error'))

    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(result.current.cargandoDia).toBe(false))

    establecerCantidades(result, {
      egresosHospitalarios: 1,
      sobres: 2,
      sobresSellados: 3,
      tia: 4,
    })

    let resultado
    await act(async () => {
      resultado = await result.current.guardar()
    })

    expect(resultado.error).toContain('conectar')
  })

  it('valida los valores actuales antes de enviar', async () => {
    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(result.current.cargandoDia).toBe(false))

    establecerCantidades(result, {
      egresosHospitalarios: -1,
      sobres: 2,
      sobresSellados: 3,
      tia: 4,
    })

    let resultado
    await act(async () => {
      resultado = await result.current.guardar()
    })

    expect(resultado).toMatchObject({ ok: false, validacion: true })
    expect(guardarCuadernoRojo).not.toHaveBeenCalled()
    expect(result.current.tocados.egresosHospitalarios).toBe(true)
  })

  it('inicia con el año de Guatemala y mes Todos', async () => {
    const { result } = renderHook(() => useCuadernoRojo())

    await waitFor(() => expect(result.current.cargandoHistorial).toBe(false))

    expect(result.current.filtros).toEqual({ anio: ANIO, mes: '' })
    expect(listarCuadernoRojo).toHaveBeenCalledWith({ anio: Number(ANIO) })
  })

  it('consulta por año, luego por mes y restablece el período', async () => {
    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(result.current.cargandoHistorial).toBe(false))

    act(() => result.current.cambiarFiltro('anio', '2025'))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: 2025 }))

    act(() => result.current.cambiarFiltro('mes', '03'))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: 2025, mes: 3 }))

    act(() => result.current.cambiarFiltro('mes', ''))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: 2025 }))

    act(() => result.current.restablecerFiltros())
    await waitFor(() => expect(result.current.filtros).toEqual({ anio: ANIO, mes: '' }))
    expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: Number(ANIO) })
  })

  it('acepta un período sin registros sin convertirlo en error', async () => {
    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(result.current.cargandoHistorial).toBe(false))

    act(() => result.current.cambiarFiltro('anio', '2025'))
    await waitFor(() => expect(result.current.cargandoHistorial).toBe(false))

    expect(result.current.registros).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.filtros.anio).toBe('2025')
  })

  it('limpia el listado y conserva los filtros ante un error de período', async () => {
    const registroDelPeriodoA = registro(`${ANIO}-05-15`)
    listarCuadernoRojo.mockResolvedValueOnce([registroDelPeriodoA])

    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(result.current.registros).toHaveLength(1))
    expect(result.current.registros[0].fecha).toBe(registroDelPeriodoA.fecha)

    listarCuadernoRojo.mockRejectedValueOnce(
      Object.assign(new Error('período inválido'), { status: 400 }),
    )
    act(() => result.current.cambiarFiltro('mes', '01'))

    await waitFor(() => expect(result.current.error).toContain('período'))
    expect(result.current.registros).toEqual([])
    expect(result.current.filtros).toEqual({ anio: ANIO, mes: '01' })
  })

  it('aplica solo la respuesta del filtro vigente', async () => {
    listarCuadernoRojo.mockReset()
    const inicial = diferido()
    listarCuadernoRojo.mockReturnValueOnce(inicial.promesa)

    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenCalledTimes(1))
    await act(async () => {
      inicial.resolver([])
      await inicial.promesa
    })

    const primera = diferido()
    const segunda = diferido()
    listarCuadernoRojo
      .mockImplementationOnce(() => primera.promesa)
      .mockImplementationOnce(() => segunda.promesa)

    act(() => result.current.cambiarFiltro('anio', '2025'))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenCalledTimes(2))
    act(() => result.current.cambiarFiltro('mes', '03'))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenCalledTimes(3))

    await act(async () => {
      segunda.resolver([registro('2025-03-15')])
      await segunda.promesa
    })
    await act(async () => {
      primera.resolver([registro('2025-01-15')])
      await primera.promesa
    })

    expect(result.current.registros.map((item) => item.fecha)).toEqual(['2025-03-15'])
    expect(result.current.filtros).toEqual({ anio: '2025', mes: '03' })
  })

  it('no muestra el error de una consulta de historial obsoleta', async () => {
    listarCuadernoRojo.mockReset()
    const inicial = diferido()
    listarCuadernoRojo.mockReturnValueOnce(inicial.promesa)

    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenCalledTimes(1))
    await act(async () => {
      inicial.resolver([])
      await inicial.promesa
    })

    const obsoleta = diferido()
    const vigente = diferido()
    listarCuadernoRojo
      .mockImplementationOnce(() => obsoleta.promesa)
      .mockImplementationOnce(() => vigente.promesa)

    act(() => result.current.cambiarFiltro('anio', '2025'))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenCalledTimes(2))
    act(() => result.current.cambiarFiltro('mes', '03'))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenCalledTimes(3))

    await act(async () => {
      vigente.resolver([registro('2025-03-15')])
      await vigente.promesa
    })
    await act(async () => {
      obsoleta.rechazar(Object.assign(new Error('viejo'), { status: 400 }))
      await new Promise((resolver) => setTimeout(resolver, 0))
    })

    expect(result.current.error).toBeNull()
    expect(result.current.registros.map((item) => item.fecha)).toEqual(['2025-03-15'])
  })

  it('mantiene la consulta por fecha independiente de los filtros', async () => {
    const fechaPendiente = diferido()
    obtenerCuadernoRojo.mockReturnValueOnce(fechaPendiente.promesa)

    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(obtenerCuadernoRojo).toHaveBeenCalledTimes(1))

    act(() => result.current.cambiarFiltro('anio', '2025'))
    await waitFor(() => expect(result.current.filtros.anio).toBe('2025'))
    expect(result.current.valores.fecha).toBe(HOY)

    await act(async () => {
      fechaPendiente.resolver(registro(HOY, { tia: 9 }))
      await fechaPendiente.promesa
    })

    expect(result.current.valores.fecha).toBe(HOY)
    expect(result.current.valores.tia).toBe('9')
  })

  it('refresca el historial con los filtros vigentes al guardar', async () => {
    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(result.current.cargandoHistorial).toBe(false))

    act(() => result.current.cambiarFiltro('anio', '2025'))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: 2025 }))
    act(() => result.current.cambiarFiltro('mes', '03'))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: 2025, mes: 3 }))

    obtenerCuadernoRojo.mockResolvedValueOnce(null)
    act(() => result.current.cambiarCampo('fecha', '2025-03-15'))
    await waitFor(() => expect(result.current.cargandoDia).toBe(false))

    establecerCantidades(result, {
      egresosHospitalarios: 1,
      sobres: 2,
      sobresSellados: 3,
      tia: 4,
    })
    await waitFor(() => expect(result.current.valores.tia).toBe('4'))

    guardarCuadernoRojo.mockResolvedValue(registro('2025-03-15'))
    let resultado
    await act(async () => {
      resultado = await result.current.guardar()
    })

    expect(resultado).toMatchObject({ ok: true, fueraDePeriodo: false })
    expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: 2025, mes: 3 })
  })

  it('marca el guardado como fuera del período filtrado', async () => {
    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(result.current.cargandoHistorial).toBe(false))

    act(() => result.current.cambiarFiltro('anio', '2025'))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: 2025 }))
    act(() => result.current.cambiarFiltro('mes', '03'))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: 2025, mes: 3 }))

    obtenerCuadernoRojo.mockResolvedValueOnce(null)
    act(() => result.current.cambiarCampo('fecha', '2025-04-10'))
    await waitFor(() => expect(result.current.cargandoDia).toBe(false))

    establecerCantidades(result, {
      egresosHospitalarios: 1,
      sobres: 2,
      sobresSellados: 3,
      tia: 4,
    })
    await waitFor(() => expect(result.current.valores.tia).toBe('4'))

    guardarCuadernoRojo.mockResolvedValue(registro('2025-04-10'))
    let resultado
    await act(async () => {
      resultado = await result.current.guardar()
    })

    expect(resultado).toMatchObject({ ok: true, fueraDePeriodo: true })
    expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: 2025, mes: 3 })
  })

  it('usa los filtros más recientes al refrescar después de un PUT', async () => {
    const { result } = renderHook(() => useCuadernoRojo())
    await waitFor(() => expect(result.current.cargandoHistorial).toBe(false))

    act(() => result.current.cambiarFiltro('anio', '2025'))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: 2025 }))
    act(() => result.current.cambiarFiltro('mes', '03'))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: 2025, mes: 3 }))

    obtenerCuadernoRojo.mockResolvedValueOnce(null)
    act(() => result.current.cambiarCampo('fecha', '2025-03-15'))
    await waitFor(() => expect(result.current.cargandoDia).toBe(false))

    establecerCantidades(result, {
      egresosHospitalarios: 1,
      sobres: 2,
      sobresSellados: 3,
      tia: 4,
    })
    await waitFor(() => expect(result.current.valores.tia).toBe('4'))

    const putPendiente = diferido()
    guardarCuadernoRojo.mockReturnValueOnce(putPendiente.promesa)
    let promesaGuardado
    act(() => {
      promesaGuardado = result.current.guardar()
    })
    await waitFor(() => expect(guardarCuadernoRojo).toHaveBeenCalledTimes(1))

    act(() => result.current.cambiarFiltro('anio', '2024'))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: 2024, mes: 3 }))
    act(() => result.current.cambiarFiltro('mes', '12'))
    await waitFor(() =>
      expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: 2024, mes: 12 }),
    )

    let resultado
    await act(async () => {
      putPendiente.resolver(registro('2025-03-15'))
      resultado = await promesaGuardado
    })

    expect(resultado).toMatchObject({ ok: true, fueraDePeriodo: true })
    expect(listarCuadernoRojo).toHaveBeenLastCalledWith({ anio: 2024, mes: 12 })
  })
})
