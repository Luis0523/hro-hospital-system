import { describe, expect, it } from 'vitest'
import {
  ACCIONES_SUGERIDAS,
  TABLAS_SUGERIDAS,
  etiquetaAccion,
  formatearTabla,
  parsearJsonAuditoria,
  textoDetalleJson,
} from './auditoria.js'

describe('parsearJsonAuditoria', () => {
  it('devuelve null para null, undefined, vacío y solo espacios', () => {
    expect(parsearJsonAuditoria(null)).toBeNull()
    expect(parsearJsonAuditoria(undefined)).toBeNull()
    expect(parsearJsonAuditoria('')).toBeNull()
    expect(parsearJsonAuditoria('   ')).toBeNull()
  })

  it('parsea un objeto JSON', () => {
    expect(parsearJsonAuditoria('{"estado":"confirmada","activo":true}')).toEqual({
      estado: 'confirmada',
      activo: true,
    })
  })

  it('parsea un array anidado', () => {
    expect(parsearJsonAuditoria('[{"a":[1,2]},"x"]')).toEqual([{ a: [1, 2] }, 'x'])
  })

  it('parsea strings, números y booleanos JSON', () => {
    expect(parsearJsonAuditoria('"hola"')).toBe('hola')
    expect(parsearJsonAuditoria('42')).toBe(42)
    expect(parsearJsonAuditoria('false')).toBe(false)
  })

  it('conserva el texto original cuando el JSON es inválido', () => {
    const invalido = 'texto plano no JSON (registro heredado)'
    expect(parsearJsonAuditoria(invalido)).toBe(invalido)
  })

  it('no evalúa ni ejecuta el contenido', () => {
    const peligroso = 'process.exit(1)'
    expect(parsearJsonAuditoria(peligroso)).toBe(peligroso)
  })

  it('devuelve el valor tal cual si no es string', () => {
    const objeto = { a: 1 }
    expect(parsearJsonAuditoria(objeto)).toBe(objeto)
  })
})

describe('etiquetaAccion', () => {
  it('humaniza acciones conocidas', () => {
    expect(etiquetaAccion('crear')).toBe('Crear')
    expect(etiquetaAccion('actualizar')).toBe('Actualizar')
  })

  it('no restringe: muestra valores desconocidos tal cual', () => {
    expect(etiquetaAccion('accion_rara')).toBe('accion_rara')
    expect(etiquetaAccion(null)).toBe('')
  })
})

describe('formatearTabla', () => {
  it('hace legibles los guiones bajos', () => {
    expect(formatearTabla('dia_no_laborable')).toBe('dia no laborable')
  })

  it('devuelve cadena vacía si no hay valor', () => {
    expect(formatearTabla(null)).toBe('')
  })
})

describe('textoDetalleJson', () => {
  it('devuelve null cuando no hay contenido', () => {
    expect(textoDetalleJson(null)).toBeNull()
    expect(textoDetalleJson('')).toBeNull()
  })

  it('formatea objetos y arrays de forma legible', () => {
    expect(textoDetalleJson('{"a":1}')).toBe('{\n  "a": 1\n}')
    expect(textoDetalleJson('[1,2]')).toBe('[\n  1,\n  2\n]')
  })

  it('conserva el texto original si el JSON es inválido', () => {
    expect(textoDetalleJson('no json')).toBe('no json')
  })
})

describe('sugerencias', () => {
  it('incluye acciones documentadas sin ser un catálogo cerrado', () => {
    expect(ACCIONES_SUGERIDAS).toEqual(
      expect.arrayContaining(['crear', 'actualizar', 'eliminar', 'activar', 'desactivar', 'reactivar']),
    )
  })

  it('incluye tablas confirmadas en el backend', () => {
    expect(TABLAS_SUGERIDAS).toEqual(
      expect.arrayContaining(['cita', 'medico', 'especialidad', 'dia_no_laborable']),
    )
  })
})
