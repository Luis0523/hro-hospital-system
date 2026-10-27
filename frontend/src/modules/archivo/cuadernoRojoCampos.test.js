import { describe, expect, it } from 'vitest'
import {
  CAMPOS_CUADERNO_ROJO,
  COLUMNAS_HISTORIAL,
  ETIQUETA_SOBRES_EMERGENCIA,
  MENSAJE_CANTIDAD_ENTERA,
  MENSAJE_CANTIDAD_NEGATIVA,
  MENSAJE_CANTIDAD_REQUERIDA,
  MENSAJE_FECHA_REQUERIDA,
  validarCantidad,
  validarFecha,
  validarFormulario,
  valoresIniciales,
} from './cuadernoRojoCampos'

describe('cuadernoRojoCampos · definición centralizada', () => {
  it('define los cinco campos en el orden requerido', () => {
    expect(CAMPOS_CUADERNO_ROJO.map((campo) => campo.etiqueta)).toEqual([
      'Fecha',
      'Egresos hospitalarios',
      ETIQUETA_SOBRES_EMERGENCIA,
      'Sobres sellados',
      'TIA',
    ])
  })

  it('usa la denominación definitiva "Sobres emergencia" en el tercer campo', () => {
    expect(ETIQUETA_SOBRES_EMERGENCIA).toBe('Sobres emergencia')
    expect(CAMPOS_CUADERNO_ROJO[2].etiqueta).toBe(ETIQUETA_SOBRES_EMERGENCIA)
  })

  it('conserva literalmente la etiqueta TIA sin puntos ni desarrollar las siglas', () => {
    expect(CAMPOS_CUADERNO_ROJO[4].etiqueta).toBe('TIA')
  })

  it('las columnas del historial replican las columnas del formulario en orden', () => {
    expect(COLUMNAS_HISTORIAL.map((columna) => columna.etiqueta)).toEqual(
      CAMPOS_CUADERNO_ROJO.map((campo) => campo.etiqueta),
    )
  })

  it('valoresIniciales devuelve una clave vacía por cada campo', () => {
    const valores = valoresIniciales()
    expect(Object.keys(valores)).toEqual(CAMPOS_CUADERNO_ROJO.map((campo) => campo.clave))
    expect(Object.values(valores).every((valor) => valor === '')).toBe(true)
  })
})

describe('cuadernoRojoCampos · validarCantidad', () => {
  it('acepta enteros no negativos, incluido cero y espacios externos', () => {
    expect(validarCantidad('0')).toBeNull()
    expect(validarCantidad('5')).toBeNull()
    expect(validarCantidad(' 12 ')).toBeNull()
  })

  it('exige una cantidad cuando el campo está vacío', () => {
    expect(validarCantidad('')).toBe(MENSAJE_CANTIDAD_REQUERIDA)
    expect(validarCantidad('   ')).toBe(MENSAJE_CANTIDAD_REQUERIDA)
    expect(validarCantidad(null)).toBe(MENSAJE_CANTIDAD_REQUERIDA)
  })

  it('rechaza cantidades negativas', () => {
    expect(validarCantidad('-1')).toBe(MENSAJE_CANTIDAD_NEGATIVA)
    expect(validarCantidad('-20')).toBe(MENSAJE_CANTIDAD_NEGATIVA)
  })

  it('rechaza decimales', () => {
    expect(validarCantidad('1.5')).toBe(MENSAJE_CANTIDAD_ENTERA)
    expect(validarCantidad('2,5')).toBe(MENSAJE_CANTIDAD_ENTERA)
  })

  it('rechaza entradas no numéricas', () => {
    expect(validarCantidad('abc')).toBe(MENSAJE_CANTIDAD_ENTERA)
    expect(validarCantidad('5a')).toBe(MENSAJE_CANTIDAD_ENTERA)
  })
})

describe('cuadernoRojoCampos · validarFecha y formulario', () => {
  it('exige una fecha', () => {
    expect(validarFecha('')).toBe(MENSAJE_FECHA_REQUERIDA)
    expect(validarFecha('2026-10-13')).toBeNull()
  })

  it('marca todos los campos como faltantes cuando el formulario está vacío', () => {
    const { valido, errores } = validarFormulario(valoresIniciales())
    expect(valido).toBe(false)
    expect(Object.keys(errores)).toHaveLength(CAMPOS_CUADERNO_ROJO.length)
  })

  it('marca el formulario como válido con entradas correctas', () => {
    const { valido, errores } = validarFormulario({
      fecha: '2026-10-13',
      egresosHospitalarios: '3',
      sobres: '2',
      sobresSellados: '1',
      tia: '0',
    })
    expect(valido).toBe(true)
    expect(errores).toEqual({})
  })
})
