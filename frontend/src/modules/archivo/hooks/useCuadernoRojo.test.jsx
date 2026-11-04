import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { hoyIsoGuatemala } from '@/shared/utils/fecha'
import { rangoMesActualGuatemala } from '../utils/rangoFechas'
import { useCuadernoRojo } from './useCuadernoRojo'
import {
  eliminarCuadernoRojo,
  guardarCuadernoRojo,
  listarCuadernoRojo,
  obtenerCuadernoRojo,
} from '../api/archivoApi'

vi.mock('../api/archivoApi', () => ({
  listarCuadernoRojo: vi.fn(),
  obtenerCuadernoRojo: vi.fn(),
  guardarCuadernoRojo: vi.fn(),
  eliminarCuadernoRojo: vi.fn(),
}))

const HOY = hoyIsoGuatemala()
const ANIO = HOY.slice(0, 4)
const RANGO_ACTUAL = rangoMesActualGuatemala()

function registro(fecha, cantidades = {}) {
  return {
    id: `registro-${fecha}`,
    fecha,
    egresosHospitalarios: 1,
    sobresEmergencia: 2,
    sobresSellados: 3,
    tia: 4,
    registradoPor: 'Archivo',
    actualizadoPor: 'Archivo',
    actualizadoEn: '2026-11-03T15:00:00-06:00',
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

async function renderListo() {
  const hook = renderHook(() => useCuadernoRojo())
  await waitFor(() => expect(hook.result.current.cargandoHistorial).toBe(false))
  await waitFor(() => expect(hook.result.current.cargandoDia).toBe(false))
  return hook
}

beforeEach(() => {
  vi.resetAllMocks()
  listarCuadernoRojo.mockResolvedValue([])
  obtenerCuadernoRojo.mockResolvedValue(null)
})

describe('useCuadernoRojo', () => {
  it('inicia con fecha de Guatemala y rango del mes actual', async () => {
    const { result } = await renderListo()

    expect(result.current.valores.fecha).toBe(HOY)
    expect(result.current.filtros).toEqual(RANGO_ACTUAL)
    expect(result.current.existente).toBe(false)
    expect(listarCuadernoRojo).toHaveBeenCalledWith({ anio: Number(ANIO) })
  })

  it('carga un registro existente al consultar la fecha', async () => {
    const { result } = await renderListo()

    obtenerCuadernoRojo.mockResolvedValueOnce(registro('2026-11-02', { tia: 9 }))
    act(() => result.current.cambiarCampo('fecha', '2026-11-02'))

    await waitFor(() => expect(result.current.existente).toBe(true))
    expect(result.current.valores.tia).toBe('9')
  })

  it('deja las cantidades vacías cuando la fecha no tiene registro', async () => {
    const { result } = await renderListo()

    obtenerCuadernoRojo.mockResolvedValueOnce(null)
    act(() => result.current.cambiarCampo('fecha', '2026-11-02'))

    await waitFor(() => expect(result.current.cargandoDia).toBe(false))
    expect(result.current.existente).toBe(false)
    expect(result.current.valores.egresosHospitalarios).toBe('')
  })

  it('consulta los años del rango, filtra localmente y actualiza el progreso', async () => {
    listarCuadernoRojo.mockImplementation(({ anio }) =>
      Promise.resolve([
        registro(`${anio}-01-10`, { tia: anio }),
        registro(`${anio}-12-20`, { tia: anio }),
      ]),
    )

    const { result } = await renderListo()
    act(() => result.current.aplicarFiltros({ desde: '2025-12-01', hasta: '2026-01-31' }))

    await waitFor(() => expect(result.current.cargandoHistorial).toBe(false))
    expect(listarCuadernoRojo).toHaveBeenCalledWith({ anio: 2025 })
    expect(listarCuadernoRojo).toHaveBeenCalledWith({ anio: 2026 })
    expect(result.current.registros.map((item) => item.fecha)).toEqual(['2026-01-10', '2025-12-20'])
    expect(result.current.progreso).toEqual({ completados: 2, total: 2 })
  })

  it('muestra el progreso mientras consulta varios años', async () => {
    listarCuadernoRojo.mockResolvedValueOnce([])
    const primero = diferido()
    const segundo = diferido()
    listarCuadernoRojo
      .mockImplementationOnce(() => primero.promesa)
      .mockImplementationOnce(() => segundo.promesa)

    const { result } = await renderListo()
    act(() => result.current.aplicarFiltros({ desde: '2025-12-01', hasta: '2026-01-31' }))
    await waitFor(() => expect(listarCuadernoRojo).toHaveBeenCalledTimes(3))
    expect(result.current.progreso.total).toBe(2)

    await act(async () => {
      primero.resolver([])
      await primero.promesa
    })
    await waitFor(() => expect(result.current.progreso.completados).toBe(1))

    await act(async () => {
      segundo.resolver([])
      await segundo.promesa
    })
    await waitFor(() => expect(result.current.cargandoHistorial).toBe(false))
    expect(result.current.progreso).toEqual({ completados: 2, total: 2 })
  })

  it('ignora respuestas antiguas al cambiar de rango rápidamente', async () => {
    listarCuadernoRojo.mockResolvedValueOnce([])
    const pendientes = []
    listarCuadernoRojo.mockImplementation(() => {
      const pendiente = diferido()
      pendientes.push(pendiente)
      return pendiente.promesa
    })

    const { result } = await renderListo()
    act(() => result.current.aplicarFiltros({ desde: '2025-12-01', hasta: '2026-01-31' }))
    await waitFor(() => expect(pendientes).toHaveLength(2))

    act(() => result.current.aplicarFiltros({ desde: '2024-12-01', hasta: '2025-01-31' }))
    await waitFor(() => expect(pendientes).toHaveLength(4))

    const nuevos = pendientes.slice(2)
    const antiguos = pendientes.slice(0, 2)
    await act(async () => {
      nuevos[0].resolver([registro('2024-12-20')])
      nuevos[1].resolver([registro('2025-01-10')])
      await Promise.all(nuevos.map((item) => item.promesa))
    })
    await act(async () => {
      antiguos[0].resolver([registro('2025-12-20')])
      antiguos[1].resolver([registro('2026-01-10')])
      await Promise.all(antiguos.map((item) => item.promesa))
    })

    expect(result.current.registros.map((item) => item.fecha)).toEqual(['2025-01-10', '2024-12-20'])
    expect(result.current.filtros).toEqual({
      desde: '2024-12-01',
      hasta: '2025-01-31',
    })
  })

  it('no muestra errores de consultas de historial obsoletas', async () => {
    listarCuadernoRojo.mockResolvedValueOnce([])
    const pendientes = []
    listarCuadernoRojo.mockImplementation(() => {
      const pendiente = diferido()
      pendientes.push(pendiente)
      return pendiente.promesa
    })

    const { result } = await renderListo()
    act(() => result.current.aplicarFiltros({ desde: '2025-12-01', hasta: '2026-01-31' }))
    await waitFor(() => expect(pendientes).toHaveLength(2))
    act(() => result.current.aplicarFiltros({ desde: '2024-12-01', hasta: '2025-01-31' }))
    await waitFor(() => expect(pendientes).toHaveLength(4))

    const nuevos = pendientes.slice(2)
    const antiguos = pendientes.slice(0, 2)
    await act(async () => {
      nuevos[0].resolver([registro('2024-12-20')])
      nuevos[1].resolver([registro('2025-01-10')])
      await Promise.all(nuevos.map((item) => item.promesa))
    })
    await act(async () => {
      antiguos[0].rechazar(Object.assign(new Error('viejo'), { status: 400 }))
      antiguos[1].resolver([])
      await Promise.all(antiguos.map((item) => item.promesa.catch(() => null)))
    })

    expect(result.current.error).toBeNull()
    expect(result.current.registros.map((item) => item.fecha)).toEqual(['2025-01-10', '2024-12-20'])
  })

  it('limpia el listado y conserva el rango ante error de consulta', async () => {
    listarCuadernoRojo.mockResolvedValueOnce([registro('2026-11-10')])
    const { result } = await renderListo()
    expect(result.current.registros).toHaveLength(1)

    listarCuadernoRojo.mockRejectedValueOnce(
      Object.assign(new Error('período inválido'), { status: 400 }),
    )
    act(() => result.current.aplicarFiltros({ desde: '2025-01-01', hasta: '2025-12-31' }))

    await waitFor(() => expect(result.current.error).toContain('período'))
    expect(result.current.registros).toEqual([])
    expect(result.current.filtros).toEqual({
      desde: '2025-01-01',
      hasta: '2025-12-31',
    })
  })

  it('acepta un rango sin registros sin convertirlo en error', async () => {
    listarCuadernoRojo.mockResolvedValue([])
    const { result } = await renderListo()

    act(() => result.current.aplicarFiltros({ desde: '2001-01-01', hasta: '2001-01-31' }))
    await waitFor(() => expect(result.current.cargandoHistorial).toBe(false))

    expect(result.current.registros).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('restablece el rango al mes actual', async () => {
    const { result } = await renderListo()

    act(() => result.current.aplicarFiltros({ desde: '2001-01-01', hasta: '2001-01-31' }))
    await waitFor(() => expect(result.current.filtros.desde).toBe('2001-01-01'))

    act(() => result.current.restablecerFiltros())
    await waitFor(() => expect(result.current.filtros).toEqual(RANGO_ACTUAL))
  })

  it('no guarda una fecha duplicada desde el flujo de creación', async () => {
    const { result } = await renderListo()
    obtenerCuadernoRojo.mockResolvedValueOnce(registro(HOY))
    establecerCantidades(result, {
      egresosHospitalarios: 9,
      sobres: 9,
      sobresSellados: 9,
      tia: 9,
    })

    let resultado
    await act(async () => {
      resultado = await result.current.crearRegistro()
    })

    expect(resultado).toMatchObject({ ok: false, duplicado: true })
    expect(guardarCuadernoRojo).not.toHaveBeenCalled()
  })

  it('crea un registro nuevo con un único PUT', async () => {
    const { result } = await renderListo()
    guardarCuadernoRojo.mockResolvedValue(registro(HOY, { tia: 4 }))
    establecerCantidades(result, {
      egresosHospitalarios: 1,
      sobres: 2,
      sobresSellados: 3,
      tia: 4,
    })

    let resultado
    await act(async () => {
      resultado = await result.current.crearRegistro()
    })

    expect(resultado).toMatchObject({ ok: true, fueraDePeriodo: false })
    expect(guardarCuadernoRojo).toHaveBeenCalledTimes(1)
    expect(result.current.existente).toBe(true)
  })

  it('marca un registro creado fuera del rango', async () => {
    const { result } = await renderListo()
    obtenerCuadernoRojo.mockResolvedValueOnce(null)
    act(() => result.current.cambiarCampo('fecha', '2024-05-10'))
    await waitFor(() => expect(result.current.cargandoDia).toBe(false))
    guardarCuadernoRojo.mockResolvedValue(registro('2024-05-10'))
    establecerCantidades(result, {
      egresosHospitalarios: 1,
      sobres: 2,
      sobresSellados: 3,
      tia: 4,
    })

    let resultado
    await act(async () => {
      resultado = await result.current.crearRegistro()
    })

    expect(resultado).toMatchObject({ ok: true, fueraDePeriodo: true })
  })

  it('ejecuta un solo PUT ante dos creaciones simultáneas', async () => {
    const { result } = await renderListo()
    obtenerCuadernoRojo.mockResolvedValue(null)
    const pendiente = diferido()
    guardarCuadernoRojo.mockReturnValue(pendiente.promesa)
    establecerCantidades(result, {
      egresosHospitalarios: 5,
      sobres: 6,
      sobresSellados: 7,
      tia: 8,
    })

    let primero
    let segundo
    await act(async () => {
      primero = result.current.crearRegistro()
      segundo = result.current.crearRegistro()
      pendiente.resolver(registro(HOY, { tia: 8 }))
      await Promise.all([primero, segundo])
    })

    expect(guardarCuadernoRojo).toHaveBeenCalledTimes(1)
    expect(await segundo).toMatchObject({ ok: false, omitido: true })
  })

  it('actualiza mediante guardar sin verificar duplicado', async () => {
    const { result } = await renderListo()
    guardarCuadernoRojo.mockResolvedValue(registro(HOY, { tia: 8 }))
    act(() => result.current.seleccionarRegistro(registro(HOY, { egresosHospitalarios: 5 })))
    establecerCantidades(result, { tia: 8 })

    let resultado
    await act(async () => {
      resultado = await result.current.guardar()
    })

    expect(resultado).toMatchObject({ ok: true, fueraDePeriodo: false })
    expect(guardarCuadernoRojo).toHaveBeenCalledTimes(1)
  })

  it('mantiene el guardado exitoso si falla la recarga del historial', async () => {
    listarCuadernoRojo.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('sin red'))
    guardarCuadernoRojo.mockResolvedValue(registro(HOY, { tia: 6 }))
    const { result } = await renderListo()
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
  })

  it('elimina solo en el mock y actualiza la lista local', async () => {
    listarCuadernoRojo.mockResolvedValue([registro(HOY)])
    const { result } = await renderListo()
    expect(result.current.registros).toHaveLength(1)
    eliminarCuadernoRojo.mockResolvedValue(registro(HOY))

    let resultado
    await act(async () => {
      resultado = await result.current.eliminarRegistro(HOY)
    })

    expect(resultado).toEqual({ ok: true })
    expect(result.current.registros).toEqual([])
    expect(eliminarCuadernoRojo).toHaveBeenCalledWith(HOY)
  })

  it('evita solicitudes duplicadas de eliminación', async () => {
    const { result } = await renderListo()
    const pendiente = diferido()
    eliminarCuadernoRojo.mockReturnValue(pendiente.promesa)

    let primero
    let segundo
    await act(async () => {
      primero = result.current.eliminarRegistro(HOY)
      segundo = result.current.eliminarRegistro(HOY)
      pendiente.resolver(registro(HOY))
      await Promise.all([primero, segundo])
    })

    expect(eliminarCuadernoRojo).toHaveBeenCalledTimes(1)
    expect(await segundo).toMatchObject({ ok: false, omitido: true })
  })

  it('valida antes de crear y conserva las cantidades ante error de PUT', async () => {
    const { result } = await renderListo()
    establecerCantidades(result, {
      egresosHospitalarios: -1,
      sobres: 2,
      sobresSellados: 3,
      tia: 4,
    })

    let invalido
    await act(async () => {
      invalido = await result.current.crearRegistro()
    })
    expect(invalido).toMatchObject({ ok: false, validacion: true })
    expect(guardarCuadernoRojo).not.toHaveBeenCalled()

    establecerCantidades(result, {
      egresosHospitalarios: 5,
      sobres: 6,
      sobresSellados: 7,
      tia: 8,
    })
    guardarCuadernoRojo.mockRejectedValue(Object.assign(new Error('rechazado'), { status: 400 }))
    let fallo
    await act(async () => {
      fallo = await result.current.crearRegistro()
    })
    expect(fallo.ok).toBe(false)
    expect(result.current.valores.egresosHospitalarios).toBe('5')
  })

  it('reinicia el formulario para un nuevo registro', async () => {
    const { result } = await renderListo()
    act(() => result.current.seleccionarRegistro(registro('2024-03-10', { tia: 9 })))
    expect(result.current.existente).toBe(true)

    act(() => result.current.iniciarRegistroNuevo())

    expect(result.current.valores.fecha).toBe(HOY)
    expect(result.current.valores.tia).toBe('')
    expect(result.current.existente).toBe(false)
    expect(result.current.hayCambios).toBe(false)
  })
})
