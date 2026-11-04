import { beforeEach, describe, expect, it } from 'vitest'
import {
  eliminarCuadernoRojoMock,
  guardarCuadernoRojoMock,
  listarCuadernoRojoMock,
  obtenerCuadernoRojoMock,
  reiniciarCuadernoRojoMock,
} from './cuadernoRojoMock'

const FECHA = '2026-11-03'
const VALIDO = {
  egresosHospitalarios: 3,
  sobresEmergencia: 4,
  sobresSellados: 5,
  tia: 6,
}

function capturarError(ejecutar) {
  try {
    ejecutar()
    return null
  } catch (error) {
    return error
  }
}

beforeEach(() => {
  reiniciarCuadernoRojoMock()
})

describe('cuadernoRojoMock', () => {
  it('guarda y actualiza un registro por fecha', () => {
    const creado = guardarCuadernoRojoMock(FECHA, VALIDO)
    expect(creado.fecha).toBe(FECHA)
    expect(obtenerCuadernoRojoMock(FECHA)).toMatchObject(VALIDO)

    const actualizado = guardarCuadernoRojoMock(FECHA, { ...VALIDO, tia: 9 })
    expect(actualizado.id).toBe(creado.id)
    expect(actualizado.tia).toBe(9)
    expect(listarCuadernoRojoMock()).toHaveLength(1)
  })

  it('rechaza una cantidad faltante con status 400', () => {
    const error = capturarError(() =>
      guardarCuadernoRojoMock(FECHA, {
        egresosHospitalarios: 1,
        sobresEmergencia: 2,
        sobresSellados: 3,
      }),
    )

    expect(error?.status).toBe(400)
    expect(error?.message).toContain('TIA')
  })

  it('rechaza una cantidad negativa con status 400', () => {
    const error = capturarError(() =>
      guardarCuadernoRojoMock(FECHA, { ...VALIDO, sobresSellados: -1 }),
    )

    expect(error?.status).toBe(400)
    expect(error?.message).toContain('negativo')
  })

  it('rechaza una cantidad decimal con status 400', () => {
    const error = capturarError(() =>
      guardarCuadernoRojoMock(FECHA, { ...VALIDO, egresosHospitalarios: 1.5 }),
    )

    expect(error?.status).toBe(400)
    expect(error?.message).toContain('entero')
  })

  it('rechaza valores no numéricos con status 400', () => {
    const error = capturarError(() => guardarCuadernoRojoMock(FECHA, { ...VALIDO, tia: 'abc' }))

    expect(error?.status).toBe(400)
  })

  it('filtra por año completo y por año y mes, en orden descendente', () => {
    guardarCuadernoRojoMock('2025-12-31', VALIDO)
    guardarCuadernoRojoMock('2026-01-05', VALIDO)
    guardarCuadernoRojoMock('2026-11-01', VALIDO)
    guardarCuadernoRojoMock('2026-11-03', VALIDO)

    const delAnio = listarCuadernoRojoMock({ anio: 2026 })
    expect(delAnio.map((registro) => registro.fecha)).toEqual([
      '2026-11-03',
      '2026-11-01',
      '2026-01-05',
    ])

    const deNoviembre = listarCuadernoRojoMock({ anio: 2026, mes: 11 })
    expect(deNoviembre.map((registro) => registro.fecha)).toEqual(['2026-11-03', '2026-11-01'])

    expect(listarCuadernoRojoMock()).toHaveLength(4)
  })

  it('rechaza mes sin año con status 400', () => {
    const error = capturarError(() => listarCuadernoRojoMock({ mes: 11 }))

    expect(error?.status).toBe(400)
    expect(error?.message).toContain('año')
  })

  it.each([
    [{ anio: 1999 }],
    [{ anio: 2101 }],
    [{ anio: 2026, mes: 0 }],
    [{ anio: 2026, mes: 13 }],
  ])('rechaza filtros fuera de rango: %j', (filtros) => {
    const error = capturarError(() => listarCuadernoRojoMock(filtros))

    expect(error?.status).toBe(400)
  })

  it('elimina un registro existente del mock', () => {
    guardarCuadernoRojoMock(FECHA, VALIDO)

    const eliminado = eliminarCuadernoRojoMock(FECHA)

    expect(eliminado.fecha).toBe(FECHA)
    expect(obtenerCuadernoRojoMock(FECHA)).toBeNull()
    expect(listarCuadernoRojoMock()).toEqual([])
  })

  it('devuelve 404 al eliminar una fecha inexistente', () => {
    const error = capturarError(() => eliminarCuadernoRojoMock('2026-11-04'))

    expect(error?.status).toBe(404)
  })
})
