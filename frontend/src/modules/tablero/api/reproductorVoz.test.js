import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

class SourceFalso {
  constructor(contexto) {
    this.contexto = contexto
    this.started = null
    this.stopped = 0
    this.buffer = null
    this.connected = null
  }

  connect(nodo) {
    this.connected = nodo
  }

  start(cuando) {
    this.started = cuando
    this.contexto.sources.push(this)
  }

  stop() {
    this.stopped += 1
  }
}

class ContextoFalso {
  static instancias = []
  static duraciones = {}
  static decodeError = null

  constructor() {
    this.currentTime = 0
    this.state = 'running'
    this.destination = { tipo: 'destino' }
    this.sources = []
    this.closed = 0
    ContextoFalso.instancias.push(this)
  }

  resume() {
    return Promise.resolve()
  }

  close() {
    this.closed += 1
    return Promise.resolve()
  }

  createBufferSource() {
    return new SourceFalso(this)
  }

  decodeAudioData(datos) {
    if (ContextoFalso.decodeError) {
      return Promise.reject(new Error(ContextoFalso.decodeError))
    }
    return Promise.resolve({ duration: ContextoFalso.duraciones[datos.ruta] })
  }
}

let reproducirSecuencia
let detenerReproduccion
let SOLAPAMIENTO_FRAGMENTOS_MS
let TIMEOUT_FRAGMENTO_MS
const fetchFalso = vi.fn()

async function dejarCorrer() {
  for (let i = 0; i < 20; i += 1) await Promise.resolve()
}

function opciones(extra = {}) {
  return {
    AudioContextCtor: ContextoFalso,
    fetchImpl: fetchFalso,
    timeoutMs: 100,
    ...extra,
  }
}

function configurarDuraciones(rutas, duraciones) {
  ContextoFalso.duraciones = Object.fromEntries(
    rutas.map((ruta, indice) => [ruta, duraciones[indice]]),
  )
}

beforeEach(async () => {
  vi.useFakeTimers()
  vi.resetModules()
  ;({
    reproducirSecuencia,
    detenerReproduccion,
    SOLAPAMIENTO_FRAGMENTOS_MS,
    TIMEOUT_FRAGMENTO_MS,
  } = await import('./reproductorVoz'))

  ContextoFalso.instancias = []
  ContextoFalso.duraciones = {}
  ContextoFalso.decodeError = null
  fetchFalso.mockReset()
  fetchFalso.mockImplementation(async (ruta) => ({
    ok: true,
    status: 200,
    arrayBuffer: async () => ({ ruta }),
  }))
})

afterEach(() => {
  detenerReproduccion?.()
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('reproductorVoz · Web Audio y solapamiento', () => {
  it('expone el solapamiento aprobado de 1000 ms', () => {
    expect(SOLAPAMIENTO_FRAGMENTOS_MS).toBe(1000)
    expect(TIMEOUT_FRAGMENTO_MS).toBe(15000)
  })

  it('resuelve una secuencia vacía sin cargar audios', async () => {
    await expect(reproducirSecuencia([], opciones())).resolves.toBeUndefined()
    expect(fetchFalso).not.toHaveBeenCalled()
    expect(ContextoFalso.instancias).toHaveLength(0)
  })

  it('rechaza una secuencia no vacía con rutas inválidas', async () => {
    await expect(
      reproducirSecuencia([null, '', '   ', 42], opciones()),
    ).rejects.toThrow(/ruta inválida/i)
    expect(fetchFalso).not.toHaveBeenCalled()
  })

  it('carga y decodifica todos los fragmentos en orden', async () => {
    const rutas = ['/a.mp3', '/b.mp3', '/c.mp3']
    configurarDuraciones(rutas, [1.5, 1.2, 0.8])

    const promesa = reproducirSecuencia(rutas, opciones())
    await dejarCorrer()

    expect(fetchFalso.mock.calls.map(([ruta]) => ruta)).toEqual(rutas)
    expect(ContextoFalso.instancias[0].sources).toHaveLength(3)

    detenerReproduccion()
    await expect(promesa).rejects.toThrow(/cancel/i)
  })

  it('programa los inicios con duración - 1000 ms', async () => {
    const rutas = ['/1.mp3', '/2.mp3', '/3.mp3']
    configurarDuraciones(rutas, [1.5, 1.2, 0.8])

    const promesa = reproducirSecuencia(rutas, opciones())
    await dejarCorrer()

    const inicios = ContextoFalso.instancias[0].sources.map((s) => s.started)
    expect(inicios).toEqual([0.05, 0.55, 0.75])

    detenerReproduccion()
    await expect(promesa).rejects.toThrow(/cancel/i)
  })

  it('no genera avance negativo para fragmentos menores a 1 s', async () => {
    const rutas = ['/corto1.mp3', '/corto2.mp3']
    configurarDuraciones(rutas, [0.8, 0.8])

    const promesa = reproducirSecuencia(rutas, opciones())
    await dejarCorrer()

    const inicios = ContextoFalso.instancias[0].sources.map((s) => s.started)
    expect(inicios).toEqual([0.05, 0.05])

    detenerReproduccion()
    await expect(promesa).rejects.toThrow(/cancel/i)
  })

  it('resuelve una sola vez al terminar y cierra el contexto', async () => {
    const rutas = ['/1.mp3', '/2.mp3']
    configurarDuraciones(rutas, [1.5, 1.2])

    let resoluciones = 0
    const promesa = reproducirSecuencia(rutas, opciones())
    promesa.then(() => {
      resoluciones += 1
    })

    await dejarCorrer()
    vi.advanceTimersByTime(3000)
    await promesa

    expect(resoluciones).toBe(1)
    expect(ContextoFalso.instancias[0].closed).toBe(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('rechaza si falla la carga de un fragmento', async () => {
    fetchFalso.mockResolvedValue({ ok: false, status: 404 })

    await expect(reproducirSecuencia(['/falta.mp3'], opciones())).rejects.toThrow(
      /No se pudo cargar/,
    )

    expect(ContextoFalso.instancias[0].sources).toHaveLength(0)
    expect(ContextoFalso.instancias[0].closed).toBe(1)
  })

  it('rechaza si falla la decodificación de un fragmento', async () => {
    ContextoFalso.decodeError = 'decode roto'

    await expect(
      reproducirSecuencia(['/roto.mp3'], opciones()),
    ).rejects.toThrow(/decode roto/)

    expect(ContextoFalso.instancias[0].sources).toHaveLength(0)
  })

  it('detiene sources activos y programados', async () => {
    const rutas = ['/1.mp3', '/2.mp3', '/3.mp3']
    configurarDuraciones(rutas, [1.5, 1.2, 0.8])

    const promesa = reproducirSecuencia(rutas, opciones())
    const rechazo = expect(promesa).rejects.toThrow(/cancel/i)
    await dejarCorrer()

    const contexto = ContextoFalso.instancias[0]
    detenerReproduccion()
    await rechazo

    expect(contexto.sources.every((s) => s.stopped === 1)).toBe(true)
    expect(contexto.closed).toBe(1)

    vi.advanceTimersByTime(5000)
    await dejarCorrer()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('no resuelve una secuencia vieja después de detener', async () => {
    const rutas = ['/1.mp3', '/2.mp3']
    configurarDuraciones(rutas, [1.5, 1.2])

    let resuelta = false
    let rechazada = false
    const promesa = reproducirSecuencia(rutas, opciones())
    promesa.then(
      () => {
        resuelta = true
      },
      () => {
        rechazada = true
      },
    )

    await dejarCorrer()
    detenerReproduccion()
    vi.advanceTimersByTime(5000)
    await dejarCorrer()

    expect(resuelta).toBe(false)
    expect(rechazada).toBe(true)
  })

  it('permite una nueva reproducción después de detener', async () => {
    const primera = reproducirSecuencia(['/a.mp3'], opciones())
    configurarDuraciones(['/a.mp3'], [1.5])
    await dejarCorrer()
    detenerReproduccion()
    await expect(primera).rejects.toThrow(/cancel/i)

    const segunda = reproducirSecuencia(['/b.mp3'], opciones())
    configurarDuraciones(['/b.mp3'], [1.2])
    await dejarCorrer()

    expect(ContextoFalso.instancias).toHaveLength(2)
    expect(ContextoFalso.instancias[1].sources).toHaveLength(1)

    vi.advanceTimersByTime(3000)
    await expect(segunda).resolves.toBeUndefined()
  })
})
