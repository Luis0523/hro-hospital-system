import { describe, expect, it } from 'vitest'
import { normalizarExpedienteHablado } from './normalizarExpedienteHablado.js'

describe('normalizarExpedienteHablado', () => {
  it('interpreta el dictado por pares', () => {
    expect(normalizarExpedienteHablado('noventa doce cero uno').valor).toBe('901201')
    expect(normalizarExpedienteHablado('noventa, doce, cero uno').valor).toBe('901201')
  })

  it('interpreta dígito a dígito', () => {
    expect(normalizarExpedienteHablado('nueve cero uno dos cero uno').valor).toBe('901201')
  })

  it('ignora guiones y separadores', () => {
    expect(normalizarExpedienteHablado('nueve cero uno dos guion cero uno').valor).toBe('901201')
    expect(normalizarExpedienteHablado('90 12 01').valor).toBe('901201')
    expect(normalizarExpedienteHablado('901,201').valor).toBe('901201')
    expect(normalizarExpedienteHablado('901201').valor).toBe('901201')
  })

  it('resuelve decenas compuestas', () => {
    expect(normalizarExpedienteHablado('treinta y cinco ochenta y uno doce').valor).toBe('358112')
    expect(normalizarExpedienteHablado('veintiuno treinta y cinco').valor).toBe('2135')
  })

  it('marca un grupo de más de dos dígitos como posible corrección', () => {
    const resultado = normalizarExpedienteHablado('noventa y doce cero uno')
    expect(resultado.valor).toBe('10201')
    expect(resultado.advertencias.join(' ')).toMatch(/más de 2 dígitos/i)
  })

  it('valida longitudes de 5 o 6 dígitos', () => {
    expect(normalizarExpedienteHablado('nueve cero uno dos cero uno').valido).toBe(true)
    expect(normalizarExpedienteHablado('nueve cero uno dos cero').valido).toBe(true)
    expect(normalizarExpedienteHablado('90121').valido).toBe(true)
    expect(normalizarExpedienteHablado('9012').valido).toBe(false)
    expect(normalizarExpedienteHablado('9012012').valido).toBe(false)
  })

  it('advierte cuando el número empieza con cero', () => {
    const resultado = normalizarExpedienteHablado('cero uno dos tres cuatro cinco')
    expect(resultado.valor).toBe('012345')
    expect(resultado.advertencias.join(' ')).toMatch(/empieza con 0/i)
  })

  it('informa palabras que no pudo interpretar', () => {
    const resultado = normalizarExpedienteHablado('hola noventa')
    expect(resultado.valor).toBe('90')
    expect(resultado.desconocidos).toContain('hola')
  })

  it('devuelve un motivo cuando no hay números', () => {
    const resultado = normalizarExpedienteHablado('')
    expect(resultado.valor).toBe('')
    expect(resultado.valido).toBe(false)
    expect(resultado.motivo).toMatch(/no se detectaron números/i)
  })
})
