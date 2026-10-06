import { describe, expect, it } from 'vitest'
import {
  IDENTIDAD_API_ARCHIVO,
  USUARIO_ARCHIVO_POR_DEFECTO,
  resolverIdentidadApiArchivo,
  resolverUsuarioArchivo,
} from './identidadArchivo'

describe('resolverUsuarioArchivo', () => {
  it('usa la identidad de Archivo cuando no hay usuario', () => {
    expect(resolverUsuarioArchivo(null)).toEqual(USUARIO_ARCHIVO_POR_DEFECTO)
  })

  it('no adopta una identidad de otra estación', () => {
    const ajeno = { nombre: 'Usuario Ajeno', puesto: 'Otra estación', rol: 'enfermeria' }

    expect(resolverUsuarioArchivo(ajeno)).toEqual(USUARIO_ARCHIVO_POR_DEFECTO)
  })

  it('adopta la identidad autenticada cuando el rol es de Archivo', () => {
    const archivo = { nombre: 'Ana Registro', puesto: 'Encargada de Archivo', rol: 'archivo' }

    expect(resolverUsuarioArchivo(archivo)).toEqual({
      nombre: 'Ana Registro',
      puesto: 'Encargada de Archivo',
    })
  })
})

describe('resolverIdentidadApiArchivo', () => {
  it('genera el rol efectivo archivo cuando no hay usuario', () => {
    expect(resolverIdentidadApiArchivo(null)).toEqual(IDENTIDAD_API_ARCHIVO)
    expect(resolverIdentidadApiArchivo(null).rol).toBe('archivo')
  })

  it('no adopta un rol ajeno (enfermeria) para las transiciones de Archivo', () => {
    const identidad = resolverIdentidadApiArchivo({
      rol: 'enfermeria',
      idExterno: 'enfermeria-01',
    })

    expect(identidad.rol).toBe('archivo')
    expect(identidad.idExterno).toBe('archivo-01')
  })

  it('conserva idExterno y nombre cuando el rol ya es de Archivo', () => {
    const identidad = resolverIdentidadApiArchivo({
      rol: 'archivo',
      idExterno: 'archivo-99',
      nombre: 'Ana Registro',
    })

    expect(identidad).toMatchObject({
      rol: 'archivo',
      idExterno: 'archivo-99',
      nombre: 'Ana Registro',
    })
  })
})
