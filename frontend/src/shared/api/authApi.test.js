import { describe, expect, it } from 'vitest'
import { inicioPorRol, usuarioDesdeToken } from './authApi'

function tokenCon(claims) {
  const base64 = btoa(JSON.stringify(claims))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `cabecera.${base64}.firma`
}

describe('usuarioDesdeToken', () => {
  it('extrae id, nombre y rol reconocido del token', () => {
    const token = tokenCon({
      preferred_username: 'archivo01',
      name: 'Operador Archivo',
      realm_access: { roles: ['offline_access', 'archivo'] },
    })

    expect(usuarioDesdeToken(token)).toEqual({
      idExterno: 'archivo01',
      nombre: 'Operador Archivo',
      rol: 'archivo',
    })
  })

  it('usa el primer rol cuando ninguno es reconocido', () => {
    const token = tokenCon({
      preferred_username: 'x1',
      realm_access: { roles: ['rol_raro'] },
    })
    expect(usuarioDesdeToken(token).rol).toBe('rol_raro')
  })

  it('reconoce roles nuevos creados en Keycloak e ignora los internos', () => {
    const token = tokenCon({
      preferred_username: 'lufi',
      realm_access: {
        roles: ['default-roles-hro', 'tecnico', 'offline_access', 'uma_authorization'],
      },
    })
    expect(usuarioDesdeToken(token).rol).toBe('tecnico')
  })

  it('cae a sub cuando no hay preferred_username', () => {
    const token = tokenCon({ sub: 'abc-123', realm_access: { roles: ['enfermeria'] } })
    expect(usuarioDesdeToken(token).idExterno).toBe('abc-123')
  })
})

describe('inicioPorRol', () => {
  it('mapea cada rol a su pantalla', () => {
    expect(inicioPorRol('archivo')).toBe('/archivo')
    expect(inicioPorRol('enfermeria')).toBe('/enfermeria')
    expect(inicioPorRol('administrador')).toBe('/administracion')
    expect(inicioPorRol('jefe_enfermeria')).toBe('/jefe-enfermeria')
    expect(inicioPorRol(undefined)).toBe('/enfermeria')
  })
})
