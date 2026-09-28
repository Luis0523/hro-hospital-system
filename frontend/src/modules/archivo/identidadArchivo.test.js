import { describe, expect, it } from 'vitest'
import { USUARIO_ARCHIVO_POR_DEFECTO, resolverUsuarioArchivo } from './identidadArchivo'

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
