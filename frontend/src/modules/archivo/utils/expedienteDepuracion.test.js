import { describe, expect, it } from 'vitest'
import {
  MAX_LONGITUD_EXPEDIENTE,
  formatearExpedienteDepuracion,
  limpiarEntradaExpediente,
  normalizarExpedienteDepuracion,
  validarEntradaExpediente,
  validarEntradaExpedienteManual,
} from './expedienteDepuracion'

describe('expedienteDepuracion', () => {
  it('formatea los ejemplos institucionales con un único guion', () => {
    expect(formatearExpedienteDepuracion('927581')).toBe('9275-81')
    expect(formatearExpedienteDepuracion('30954')).toBe('3095-4')
    expect(formatearExpedienteDepuracion('881203')).toBe('8812-03')
  })

  it('preserva ceros iniciales y no convierte a número', () => {
    expect(validarEntradaExpediente('001234')).toMatchObject({
      valido: true,
      numero: '001234',
    })
    expect(formatearExpedienteDepuracion('001234')).toBe('0012-34')
  })

  it('acepta dígitos con o sin guion y normaliza a la identidad canónica', () => {
    expect(validarEntradaExpediente('927581')).toMatchObject({
      valido: true,
      numero: '927581',
    })
    expect(validarEntradaExpediente('9275-81')).toMatchObject({
      valido: true,
      numero: '927581',
    })
    expect(validarEntradaExpediente(' 9275 - 81 ')).toMatchObject({
      valido: true,
      numero: '927581',
    })
  })

  it('limpia CR/LF del lector sin alterar la identidad', () => {
    expect(limpiarEntradaExpediente('\r\n927581\n')).toBe('927581')
    expect(normalizarExpedienteDepuracion('\n9275-81\r')).toBe('927581')
  })

  it('rechaza textos vacíos, letras, guiones inválidos y exceso de longitud', () => {
    expect(validarEntradaExpediente('')).toMatchObject({
      valido: false,
      error: 'requerido',
    })
    expect(validarEntradaExpediente('ABC123')).toMatchObject({
      valido: false,
      error: 'caracteres_invalidos',
    })
    expect(validarEntradaExpediente('92-75-81')).toMatchObject({
      valido: false,
      error: 'guion_invalido',
    })
    expect(validarEntradaExpediente('-927581')).toMatchObject({
      valido: false,
      error: 'guion_invalido',
    })
    expect(validarEntradaExpediente('9'.repeat(MAX_LONGITUD_EXPEDIENTE + 1))).toMatchObject({
      valido: false,
      error: 'muy_largo',
    })
  })

  it('acepta exactamente el máximo permitido', () => {
    const numero = '9'.repeat(MAX_LONGITUD_EXPEDIENTE)
    expect(validarEntradaExpediente(numero)).toMatchObject({
      valido: true,
      numero,
    })
  })

  it('mantiene la visualización de códigos heredados no numéricos', () => {
    expect(formatearExpedienteDepuracion('EXP-2024-035')).toBe('EXP-2024-035')
  })

  it('valida la captura manual con un único guion interior y conserva la identidad', () => {
    expect(validarEntradaExpedienteManual('9275-81')).toMatchObject({
      valido: true,
      numero: '927581',
    })
    expect(validarEntradaExpedienteManual('0012-34')).toMatchObject({
      valido: true,
      numero: '001234',
    })
    expect(validarEntradaExpedienteManual('927581')).toMatchObject({
      valido: false,
      error: 'guion_requerido',
    })
    expect(validarEntradaExpedienteManual('92-75-81')).toMatchObject({
      valido: false,
      error: 'guion_invalido',
    })
    expect(validarEntradaExpedienteManual('-9275')).toMatchObject({
      valido: false,
      error: 'guion_invalido',
    })
    expect(validarEntradaExpedienteManual('9275-')).toMatchObject({
      valido: false,
      error: 'guion_invalido',
    })
    expect(validarEntradaExpedienteManual('ABC-123')).toMatchObject({
      valido: false,
      error: 'caracteres_invalidos',
    })
  })
})
