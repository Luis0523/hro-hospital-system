import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

class AudioFalso {
  static instancias = []
  static implPlay = () => Promise.resolve()

  constructor(ruta) {
    this.ruta = ruta
    this.src = ruta
    this.preload = ''
    this.listeners = new Map()
    this.playCalls = 0
    this.pauseCalls = 0
    AudioFalso.instancias.push(this)
  }

  addEventListener(tipo, handler) {
    if (!this.listeners.has(tipo)) this.listeners.set(tipo, new Set())
    this.listeners.get(tipo).add(handler)
  }

  removeEventListener(tipo, handler) {
    this.listeners.get(tipo)?.delete(handler)
  }

  emitir(tipo) {
    for (const handler of [...(this.listeners.get(tipo) ?? [])]) handler()
  }

  contarListeners(tipo) {
    return this.listeners.get(tipo)?.size ?? 0
  }

  play() {
    this.playCalls += 1
    return AudioFalso.implPlay(this)
  }

  pause() {
    this.pauseCalls += 1
  }
}

let reproducirSecuencia
let TIMEOUT_FRAGMENTO_MS

async function dejarCorrer() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve()
}

function crearLogger() {
  return { warn: vi.fn() }
}

function opciones(extra = {}) {
  return { AudioCtor: AudioFalso, logger: crearLogger(), ...extra }
}

function rutasReproducidas() {
  return AudioFalso.instancias.map((audio) => audio.ruta)
}

beforeEach(async () => {
  vi.resetModules()
  ;({ reproducirSecuencia, TIMEOUT_FRAGMENTO_MS } = await import('./reproductorVoz'))
  AudioFalso.instancias = []
  AudioFalso.implPlay = () => Promise.resolve()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('reproducirSecuencia', () => {
  it('expone un timeout por defecto razonable', () => {
    expect(TIMEOUT_FRAGMENTO_MS).toBe(15000)
  })

  it('resuelve una secuencia vacía sin crear audios', async () => {
    await expect(reproducirSecuencia([], opciones())).resolves.toBeUndefined()
    expect(AudioFalso.instancias).toHaveLength(0)
  })

  it('ignora rutas inválidas y no falla', async () => {
    await expect(reproducirSecuencia([null, '', '   ', 42], opciones())).resolves.toBeUndefined()
    expect(AudioFalso.instancias).toHaveLength(0)
  })

  it('reproduce un fragmento y resuelve al terminar', async () => {
    const promesa = reproducirSecuencia(['/a.mp3'], opciones())
    await dejarCorrer()

    expect(AudioFalso.instancias).toHaveLength(1)
    expect(AudioFalso.instancias[0].ruta).toBe('/a.mp3')
    expect(AudioFalso.instancias[0].playCalls).toBe(1)

    AudioFalso.instancias[0].emitir('ended')
    await expect(promesa).resolves.toBeUndefined()
  })

  it('reproduce varios fragmentos en el orden recibido', async () => {
    const promesa = reproducirSecuencia(['/1.mp3', '/2.mp3', '/3.mp3'], opciones())
    await dejarCorrer()

    expect(rutasReproducidas()).toEqual(['/1.mp3'])

    AudioFalso.instancias[0].emitir('ended')
    await dejarCorrer()
    expect(rutasReproducidas()).toEqual(['/1.mp3', '/2.mp3'])

    AudioFalso.instancias[1].emitir('ended')
    await dejarCorrer()
    expect(rutasReproducidas()).toEqual(['/1.mp3', '/2.mp3', '/3.mp3'])

    AudioFalso.instancias[2].emitir('ended')
    await expect(promesa).resolves.toBeUndefined()
  })

  it('no inicia el segundo fragmento antes del "ended" del primero', async () => {
    const promesa = reproducirSecuencia(['/1.mp3', '/2.mp3'], opciones())
    await dejarCorrer()

    expect(AudioFalso.instancias).toHaveLength(1)
    await dejarCorrer()
    expect(AudioFalso.instancias).toHaveLength(1)

    AudioFalso.instancias[0].emitir('ended')
    await dejarCorrer()
    expect(AudioFalso.instancias).toHaveLength(2)

    AudioFalso.instancias[1].emitir('ended')
    await expect(promesa).resolves.toBeUndefined()
  })

  it('continúa con el siguiente fragmento si uno emite "error"', async () => {
    const logger = crearLogger()
    const promesa = reproducirSecuencia(['/roto.mp3', '/ok.mp3'], opciones({ logger }))
    await dejarCorrer()

    const roto = AudioFalso.instancias[0]
    roto.emitir('error')
    await dejarCorrer()

    expect(AudioFalso.instancias).toHaveLength(2)
    expect(AudioFalso.instancias[1].ruta).toBe('/ok.mp3')
    expect(roto.contarListeners('ended')).toBe(0)
    expect(roto.contarListeners('error')).toBe(0)

    AudioFalso.instancias[1].emitir('ended')
    await expect(promesa).resolves.toBeUndefined()
    expect(logger.warn).toHaveBeenCalled()
  })

  it('no bloquea la secuencia si play() es rechazado', async () => {
    AudioFalso.implPlay = (audio) =>
      audio.ruta === '/1.mp3' ? Promise.reject(new Error('bloqueado')) : Promise.resolve()
    const logger = crearLogger()

    const promesa = reproducirSecuencia(['/1.mp3', '/2.mp3'], opciones({ logger }))
    await dejarCorrer()
    await dejarCorrer()

    expect(AudioFalso.instancias).toHaveLength(2)
    expect(AudioFalso.instancias[1].ruta).toBe('/2.mp3')

    AudioFalso.instancias[1].emitir('ended')
    await expect(promesa).resolves.toBeUndefined()
    expect(logger.warn).toHaveBeenCalled()
  })

  it('no queda bloqueado si el audio nunca emite "ended"', async () => {
    vi.useFakeTimers()
    const logger = crearLogger()

    const promesa = reproducirSecuencia(['/colgado.mp3', '/siguiente.mp3'], {
      AudioCtor: AudioFalso,
      logger,
      timeoutMs: 100,
    })
    await dejarCorrer()
    expect(AudioFalso.instancias).toHaveLength(1)

    vi.advanceTimersByTime(100)
    await dejarCorrer()
    expect(AudioFalso.instancias).toHaveLength(2)

    vi.advanceTimersByTime(100)
    await dejarCorrer()

    await expect(promesa).resolves.toBeUndefined()
    expect(logger.warn).toHaveBeenCalled()
  })

  it('serializa dos secuencias simultáneas sin superponer audio', async () => {
    const primera = reproducirSecuencia(['/a1.mp3', '/a2.mp3'], opciones())
    const segunda = reproducirSecuencia(['/b1.mp3'], opciones())
    await dejarCorrer()

    expect(rutasReproducidas()).toEqual(['/a1.mp3'])

    AudioFalso.instancias[0].emitir('ended')
    await dejarCorrer()
    expect(rutasReproducidas()).toEqual(['/a1.mp3', '/a2.mp3'])

    AudioFalso.instancias[1].emitir('ended')
    await dejarCorrer()
    expect(rutasReproducidas()).toEqual(['/a1.mp3', '/a2.mp3', '/b1.mp3'])

    AudioFalso.instancias[2].emitir('ended')
    await expect(primera).resolves.toBeUndefined()
    await expect(segunda).resolves.toBeUndefined()
  })

  it('limpia listeners y timers al terminar cada fragmento', async () => {
    vi.useFakeTimers()
    const promesa = reproducirSecuencia(['/1.mp3'], opciones())
    await dejarCorrer()

    const audio = AudioFalso.instancias[0]
    expect(audio.contarListeners('ended')).toBe(1)
    expect(audio.contarListeners('error')).toBe(1)
    expect(vi.getTimerCount()).toBe(1)

    audio.emitir('ended')
    await dejarCorrer()

    expect(audio.contarListeners('ended')).toBe(0)
    expect(audio.contarListeners('error')).toBe(0)
    expect(audio.pauseCalls).toBe(1)
    expect(vi.getTimerCount()).toBe(0)

    await expect(promesa).resolves.toBeUndefined()
  })
})
