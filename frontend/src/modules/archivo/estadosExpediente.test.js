import { describe, expect, it } from 'vitest'
import { ESTADOS_EXPEDIENTE, ORDEN_ESTADOS, metadatosEstado } from './estadosExpediente'

const ESTADOS_REALES = [
  'pendiente_localizar',
  'en_busqueda',
  'localizado',
  'en_transito_entrega',
  'entregado',
  'en_transito_retorno',
  'archivado',
  'no_localizado',
  'sin_ciclo',
]

describe('estadosExpediente', () => {
  it('define exactamente los estados reales del backend más sin_ciclo', () => {
    expect(Object.keys(ESTADOS_EXPEDIENTE).sort()).toEqual([...ESTADOS_REALES].sort())
  })

  it('no conserva el estado legado en_transito', () => {
    expect(ESTADOS_EXPEDIENTE.en_transito).toBeUndefined()
    expect(ESTADOS_EXPEDIENTE.en_transito_entrega).toBeDefined()
    expect(ESTADOS_EXPEDIENTE.en_transito_retorno).toBeDefined()
  })

  it('ORDEN_ESTADOS es la secuencia normal, sin no_localizado ni sin_ciclo', () => {
    expect(ORDEN_ESTADOS).toEqual([
      'pendiente_localizar',
      'en_busqueda',
      'localizado',
      'en_transito_entrega',
      'entregado',
      'en_transito_retorno',
      'archivado',
    ])
  })

  it('metadatosEstado devuelve metadatos por defecto para un estado desconocido', () => {
    expect(metadatosEstado('inexistente').etiqueta).toBe('Estado desconocido')
  })
})
