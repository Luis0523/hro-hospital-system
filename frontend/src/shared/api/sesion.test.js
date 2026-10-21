import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  EVENTO_SESION_EXPIRADA,
  EVENTO_TOKEN_RENOVADO,
  expirarSesion,
  guardarSesion,
  leerExpiracion,
  leerRefreshToken,
  leerToken,
  limpiarSesion,
  renovarSesion,
} from './sesion.js'

function respuestaToken(datos, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => datos }
}

function tokenCon(claims) {
  const base64 = btoa(JSON.stringify(claims))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `cabecera.${base64}.firma`
}

describe('sesion', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('guarda y limpia token, refresh y expiración', () => {
    guardarSesion({ token: 't', refreshToken: 'r', expiraEn: 1234 })
    expect(leerToken()).toBe('t')
    expect(leerRefreshToken()).toBe('r')
    expect(leerExpiracion()).toBe(1234)

    limpiarSesion()
    expect(leerToken()).toBeNull()
    expect(leerRefreshToken()).toBeNull()
    expect(leerExpiracion()).toBeNull()
  })

  it('deduplica renovaciones concurrentes y emite el evento', async () => {
    const tokenNuevo = tokenCon({ preferred_username: 'x', realm_access: { roles: ['archivo'] } })
    localStorage.setItem('hro_refresh_token', 'refresh-1')
    const fetchMock = vi.fn(async () =>
      respuestaToken({ access_token: tokenNuevo, refresh_token: 'refresh-2', expires_in: 1800 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const escuchado = vi.fn()
    window.addEventListener(EVENTO_TOKEN_RENOVADO, escuchado)

    const [a, b] = await Promise.all([renovarSesion(), renovarSesion()])

    window.removeEventListener(EVENTO_TOKEN_RENOVADO, escuchado)

    expect(a).toBe(tokenNuevo)
    expect(b).toBe(tokenNuevo)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(leerToken()).toBe(tokenNuevo)
    expect(leerRefreshToken()).toBe('refresh-2')
    expect(escuchado).toHaveBeenCalledTimes(1)
  })

  it('rechaza renovar sin refresh token', async () => {
    await expect(renovarSesion()).rejects.toMatchObject({ status: 401 })
  })

  it('expira la sesión y notifica sin forzar navegación', () => {
    guardarSesion({ token: 't', refreshToken: 'r', expiraEn: 1234 })
    window.history.replaceState(null, '', '/seguimiento-enfermeria')

    const escuchado = vi.fn()
    window.addEventListener(EVENTO_SESION_EXPIRADA, escuchado)

    expirarSesion()

    window.removeEventListener(EVENTO_SESION_EXPIRADA, escuchado)

    expect(leerToken()).toBeNull()
    expect(leerRefreshToken()).toBeNull()
    expect(localStorage.getItem('hro_sesion')).toBe('cerrada')
    expect(window.location.pathname).toBe('/seguimiento-enfermeria')
    expect(escuchado).toHaveBeenCalledTimes(1)

    window.history.replaceState(null, '', '/')
  })
})
