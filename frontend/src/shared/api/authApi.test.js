import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  autenticar,
  expiracionDeToken,
  inicioPorRol,
  refrescarToken,
  usuarioDesdeToken,
} from './authApi'

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

describe('expiracionDeToken', () => {
  it('devuelve el exp del JWT en milisegundos', () => {
    expect(expiracionDeToken(tokenCon({ exp: 1_700_000_000 }))).toBe(1_700_000_000_000)
  })

  it('devuelve null si no hay exp o el token es inválido', () => {
    expect(expiracionDeToken(tokenCon({ sub: 'x' }))).toBeNull()
    expect(expiracionDeToken(null)).toBeNull()
    expect(expiracionDeToken('no-es-un-jwt')).toBeNull()
  })
})

function respuestaToken(datos, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => datos }
}

describe('autenticar', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('devuelve token, refresh y expiración desde la respuesta de Keycloak', async () => {
    const access_token = tokenCon({
      preferred_username: 'archivo01',
      realm_access: { roles: ['archivo'] },
    })
    const fetchMock = vi.fn(async () =>
      respuestaToken({ access_token, refresh_token: 'refresh-1', expires_in: 1800 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const sesion = await autenticar({ username: 'archivo01', password: 'archivo' })

    expect(sesion.token).toBe(access_token)
    expect(sesion.refreshToken).toBe('refresh-1')
    expect(sesion.usuario.rol).toBe('archivo')
    expect(sesion.expiraEn).toBeGreaterThan(Date.now())

    const cuerpo = String(fetchMock.mock.calls[0][1].body)
    expect(cuerpo).toContain('grant_type=password')
    expect(cuerpo).toContain('username=archivo01')
  })

  it('lanza con status cuando las credenciales son inválidas', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respuestaToken({ error: 'invalid_grant' }, { ok: false, status: 401 })),
    )
    await expect(autenticar({ username: 'x', password: 'y' })).rejects.toMatchObject({
      status: 401,
    })
  })
})

describe('refrescarToken', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('usa grant_type=refresh_token y devuelve la nueva sesión', async () => {
    const access_token = tokenCon({ preferred_username: 'x', realm_access: { roles: ['archivo'] } })
    const fetchMock = vi.fn(async () =>
      respuestaToken({ access_token, refresh_token: 'refresh-2', expires_in: 1800 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const sesion = await refrescarToken('refresh-1')

    expect(sesion.token).toBe(access_token)
    expect(sesion.refreshToken).toBe('refresh-2')
    const cuerpo = String(fetchMock.mock.calls[0][1].body)
    expect(cuerpo).toContain('grant_type=refresh_token')
    expect(cuerpo).toContain('refresh_token=refresh-1')
  })

  it('rechaza sin refresh token', async () => {
    await expect(refrescarToken(null)).rejects.toMatchObject({ status: 401 })
  })
})
