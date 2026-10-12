import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import client from './client.js'

function tokenCon(claims) {
  const base64 = btoa(JSON.stringify(claims))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `cabecera.${base64}.firma`
}

function respuestaToken(datos, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => datos }
}

const TOKEN_NUEVO = tokenCon({ preferred_username: 'x', realm_access: { roles: ['archivo'] } })

// Adapter de axios que responde 401 mientras el Bearer sea el token viejo y 200
// con el token nuevo. Cuenta los intentos.
function adapterConReintento() {
  return vi.fn(async (config) => {
    const auth = config.headers?.Authorization
    if (auth !== `Bearer ${TOKEN_NUEVO}`) {
      throw Object.assign(new Error('Unauthorized'), {
        isAxiosError: true,
        config,
        response: { status: 401, data: {} },
      })
    }
    return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config }
  })
}

describe('client - manejo de 401 con refresh', () => {
  beforeEach(() => {
    localStorage.clear()
    // Evita que expirarSesion intente navegar en jsdom.
    window.history.replaceState(null, '', '/login')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    window.history.replaceState(null, '', '/')
  })

  it('renueva el token y reintenta la petición una sola vez', async () => {
    localStorage.setItem('hro_token', 'token-viejo')
    localStorage.setItem('hro_refresh_token', 'refresh-1')

    const fetchMock = vi.fn(async () =>
      respuestaToken({
        access_token: TOKEN_NUEVO,
        refresh_token: 'refresh-2',
        expires_in: 1800,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const adapter = adapterConReintento()
    client.defaults.adapter = adapter

    const datos = await client.get('/algo')

    expect(datos).toEqual({ ok: true })
    expect(adapter).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][1].body)).toContain('grant_type=refresh_token')
    expect(localStorage.getItem('hro_token')).toBe(TOKEN_NUEVO)
    expect(localStorage.getItem('hro_refresh_token')).toBe('refresh-2')
  })

  it('cierra la sesión cuando el refresh falla', async () => {
    localStorage.setItem('hro_token', 'token-viejo')
    localStorage.setItem('hro_refresh_token', 'refresh-1')

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respuestaToken({ error: 'invalid_grant' }, { ok: false, status: 401 })),
    )

    const adapter = adapterConReintento()
    client.defaults.adapter = adapter

    await expect(client.get('/algo')).rejects.toMatchObject({ status: 401 })

    expect(localStorage.getItem('hro_token')).toBeNull()
    expect(localStorage.getItem('hro_refresh_token')).toBeNull()
    expect(localStorage.getItem('hro_sesion')).toBe('cerrada')
  })

  it('sin refresh token, no reintenta y cierra la sesión', async () => {
    localStorage.setItem('hro_token', 'token-viejo')

    const adapter = adapterConReintento()
    client.defaults.adapter = adapter

    await expect(client.get('/algo')).rejects.toMatchObject({ status: 401 })
    expect(adapter).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('hro_sesion')).toBe('cerrada')
  })
})
