import { describe, expect, it } from 'vitest'
import { filtrarDepuradosPorExpediente, normalizarBusquedaExpediente } from './busquedaDepurados'

const REGISTROS = [
  { id: 'a', numeroExpediente: '927581', pacienteNombre: 'Uno' },
  { id: 'b', numeroExpediente: '001234', pacienteNombre: 'Dos' },
  { id: 'c', numeroExpediente: '927500', pacienteNombre: 'Tres' },
]

describe('busquedaDepurados', () => {
  it('normaliza dígitos, guiones y ceros iniciales', () => {
    expect(normalizarBusquedaExpediente('92-75')).toBe('9275')
    expect(normalizarBusquedaExpediente(' 001234 ')).toBe('001234')
    expect(normalizarBusquedaExpediente('EXP-123')).toBeNull()
    expect(normalizarBusquedaExpediente('')).toBe('')
  })

  it('encuentra coincidencias parciales solo por número de expediente', () => {
    const resultado = filtrarDepuradosPorExpediente(REGISTROS, '9275')

    expect(resultado.busquedaActiva).toBe(true)
    expect(resultado.totalCoincidencias).toBe(2)
    expect(resultado.registros.map((registro) => registro.id)).toEqual(['a', 'c'])
  })

  it('conserva el conjunto completo al limpiar la búsqueda', () => {
    const resultado = filtrarDepuradosPorExpediente(REGISTROS, '')

    expect(resultado.busquedaActiva).toBe(false)
    expect(resultado.totalCoincidencias).toBe(3)
    expect(resultado.registros).toEqual(REGISTROS)
  })

  it('no busca por nombre de paciente', () => {
    const resultado = filtrarDepuradosPorExpediente(REGISTROS, 'Uno')

    expect(resultado.busquedaActiva).toBe(false)
    expect(resultado.totalCoincidencias).toBe(3)
  })

  it('devuelve un total de coincidencias cero sin alterar el arreglo original', () => {
    const resultado = filtrarDepuradosPorExpediente(REGISTROS, '999')

    expect(resultado.busquedaActiva).toBe(true)
    expect(resultado.totalCoincidencias).toBe(0)
    expect(REGISTROS).toHaveLength(3)
  })
})
