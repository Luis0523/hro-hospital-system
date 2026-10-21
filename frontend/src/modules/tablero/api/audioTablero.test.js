import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  anunciarTurnoMock,
  detenerHablaMock,
  detenerReproduccionMock,
  reproducirSecuenciaMock,
  estaDisponibleVozMock,
} = vi.hoisted(() => ({
  anunciarTurnoMock: vi.fn(),
  detenerHablaMock: vi.fn(),
  detenerReproduccionMock: vi.fn(),
  reproducirSecuenciaMock: vi.fn(),
  estaDisponibleVozMock: vi.fn(),
}))

vi.mock('./reproductorVoz', () => ({
  reproducirSecuencia: reproducirSecuenciaMock,
  detenerReproduccion: detenerReproduccionMock,
}))

vi.mock('./comunicacionVoz', () => ({
  anunciarTurno: anunciarTurnoMock,
  detenerHabla: detenerHablaMock,
  estaDisponibleVoz: estaDisponibleVozMock,
}))

import {
  detenerAudioTablero,
  estaDisponibleAudioTablero,
  estaDisponibleVozTablero,
  precargarAudioTablero,
  reproducirLlamado,
} from './audioTablero'

class AudioFalso {
  static instancias = []

  constructor(src) {
    this.src = src
    this.preload = ''
    this.listeners = new Map()
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

  pause() {
    this.pauseCalls += 1
  }
}

const SECUENCIA_25_6A = [
  '/audio/tablero/generales/sonidoprevio.mp3',
  '/audio/tablero/generales/paciente.mp3',
  '/audio/tablero/generales/numero.mp3',
  '/audio/tablero/numeros/025.mp3',
  '/audio/tablero/generales/pasar_a.mp3',
  '/audio/tablero/generales/clinica.mp3',
  '/audio/tablero/numeros/6a.mp3',
]

const SECUENCIA_300_6B = [
  '/audio/tablero/generales/sonidoprevio.mp3',
  '/audio/tablero/generales/paciente.mp3',
  '/audio/tablero/generales/numero.mp3',
  '/audio/tablero/numeros/300.mp3',
  '/audio/tablero/generales/pasar_a.mp3',
  '/audio/tablero/generales/clinica.mp3',
  '/audio/tablero/numeros/6b.mp3',
]

beforeEach(() => {
  vi.stubGlobal('Audio', AudioFalso)
  AudioFalso.instancias = []
  detenerAudioTablero()

  reproducirSecuenciaMock.mockReset()
  reproducirSecuenciaMock.mockResolvedValue(undefined)
  anunciarTurnoMock.mockReset()
  detenerHablaMock.mockReset()
  detenerReproduccionMock.mockReset()
  estaDisponibleVozMock.mockReset()
  estaDisponibleVozMock.mockReturnValue(true)
})

afterEach(() => {
  detenerAudioTablero()
  vi.unstubAllGlobals()
})

describe('audioTablero · reproducción local', () => {
  it('usa la secuencia exacta para 25 + 6A y llama onEnd', async () => {
    const onEnd = vi.fn()

    reproducirLlamado({ turno: 25, clinicaNumero: '6A', onEnd })

    await vi.waitFor(() => expect(onEnd).toHaveBeenCalledTimes(1))
    expect(reproducirSecuenciaMock).toHaveBeenCalledWith(SECUENCIA_25_6A, {
      pausasPorIndice: { 3: 350 },
    })
    expect(anunciarTurnoMock).not.toHaveBeenCalled()
  })

  it('usa la secuencia exacta para 300 + 6B', async () => {
    const onEnd = vi.fn()

    reproducirLlamado({ turno: 300, clinicaNumero: '6B', onEnd })

    await vi.waitFor(() => expect(onEnd).toHaveBeenCalledTimes(1))
    expect(reproducirSecuenciaMock).toHaveBeenCalledWith(SECUENCIA_300_6B, {
      pausasPorIndice: { 3: 350 },
    })
  })

  it('turno > 300 usa TTS sin intentar MP3', async () => {
    const onEnd = vi.fn()
    anunciarTurnoMock.mockImplementation((_, { onEnd: terminar }) => {
      terminar?.()
      return 'mensaje'
    })

    reproducirLlamado({ turno: 301, clinicaNumero: '6A', onEnd })

    expect(reproducirSecuenciaMock).not.toHaveBeenCalled()
    expect(anunciarTurnoMock).toHaveBeenCalledWith(
      { turnoActual: 301, espacioNumero: '6A' },
      expect.objectContaining({ onEnd: expect.any(Function), onError: expect.any(Function) }),
    )
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('reproduce la clínica numérica con los MP3 locales', async () => {
    const onEnd = vi.fn()

    reproducirLlamado({ turno: 55, clinicaNumero: '3', onEnd })

    expect(reproducirSecuenciaMock).toHaveBeenCalledWith(
      [
        '/audio/tablero/generales/sonidoprevio.mp3',
        '/audio/tablero/generales/paciente.mp3',
        '/audio/tablero/generales/numero.mp3',
        '/audio/tablero/numeros/055.mp3',
        '/audio/tablero/generales/pasar_a.mp3',
        '/audio/tablero/generales/clinica.mp3',
        '/audio/tablero/numeros/003.mp3',
      ],
      { pausasPorIndice: { 3: 350 } },
    )
    await vi.waitFor(() => expect(onEnd).toHaveBeenCalledTimes(1))
  })

  it('si falla la reproducción local usa TTS con la frase completa', async () => {
    const onEnd = vi.fn()
    reproducirSecuenciaMock.mockRejectedValue(new Error('fallo'))
    anunciarTurnoMock.mockImplementation((_, { onEnd: terminar }) => {
      terminar?.()
      return 'mensaje'
    })

    reproducirLlamado({ turno: 25, clinicaNumero: '6A', onEnd })

    await vi.waitFor(() => expect(onEnd).toHaveBeenCalledTimes(1))
    expect(anunciarTurnoMock).toHaveBeenCalledWith(
      { turnoActual: 25, espacioNumero: '6A' },
      expect.objectContaining({ onEnd: expect.any(Function), onError: expect.any(Function) }),
    )
  })

  it('si TTS también falla llama onError', async () => {
    const onError = vi.fn()
    reproducirSecuenciaMock.mockRejectedValue(new Error('fallo'))
    anunciarTurnoMock.mockImplementation((_, { onError: fallar }) => {
      fallar?.()
      return 'mensaje'
    })

    reproducirLlamado({ turno: 25, clinicaNumero: '6A', onError })

    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
  })

  it('no duplica callbacks si TTS dispara onEnd y onError', async () => {
    const onEnd = vi.fn()
    const onError = vi.fn()
    reproducirSecuenciaMock.mockRejectedValue(new Error('fallo'))
    anunciarTurnoMock.mockImplementation((_, { onEnd: terminar, onError: fallar }) => {
      terminar?.()
      fallar?.()
      return 'mensaje'
    })

    reproducirLlamado({ turno: 25, clinicaNumero: '6A', onEnd, onError })

    await vi.waitFor(() => expect(onEnd).toHaveBeenCalledTimes(1))
    expect(onError).not.toHaveBeenCalled()
  })
})

describe('audioTablero · disponibilidad y precarga', () => {
  it('expone disponibilidad local y de fallback por separado', () => {
    expect(estaDisponibleAudioTablero()).toBe(true)
    expect(estaDisponibleVozTablero()).toBe(true)

    vi.stubGlobal('Audio', undefined)
    expect(estaDisponibleAudioTablero()).toBe(false)
  })

  it('precarga primero generales y destinos', async () => {
    const promesa = precargarAudioTablero()

    await vi.waitFor(() => expect(AudioFalso.instancias.length).toBeGreaterThanOrEqual(7))
    for (const audio of AudioFalso.instancias.slice(0, 7)) {
      audio.emitir('canplaythrough')
    }

    await expect(promesa).resolves.toBe(true)
    expect(AudioFalso.instancias.slice(0, 7).map((audio) => audio.src)).toEqual([
      '/audio/tablero/generales/sonidoprevio.mp3',
      '/audio/tablero/generales/paciente.mp3',
      '/audio/tablero/generales/numero.mp3',
      '/audio/tablero/generales/pasar_a.mp3',
      '/audio/tablero/generales/clinica.mp3',
      '/audio/tablero/numeros/6a.mp3',
      '/audio/tablero/numeros/6b.mp3',
    ])
  })

  it('marca fallido un archivo ausente y usa TTS sin intentar MP3', async () => {
    const promesa = precargarAudioTablero()

    await vi.waitFor(() => expect(AudioFalso.instancias.length).toBeGreaterThanOrEqual(7))
    const [sonidoPrevio, paciente, numero, pasarA, clinica, seisA, seisB] = AudioFalso.instancias
    sonidoPrevio.emitir('canplaythrough')
    paciente.emitir('canplaythrough')
    numero.emitir('error')
    pasarA.emitir('canplaythrough')
    clinica.emitir('canplaythrough')
    seisA.emitir('canplaythrough')
    seisB.emitir('canplaythrough')

    await expect(promesa).resolves.toBe(false)

    const onEnd = vi.fn()
    anunciarTurnoMock.mockImplementation((_, { onEnd: terminar }) => {
      terminar?.()
      return 'mensaje'
    })

    reproducirLlamado({ turno: 25, clinicaNumero: '6A', onEnd })

    expect(reproducirSecuenciaMock).not.toHaveBeenCalled()
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('sin Audio usa TTS', () => {
    vi.stubGlobal('Audio', undefined)
    const onEnd = vi.fn()
    anunciarTurnoMock.mockImplementation((_, { onEnd: terminar }) => {
      terminar?.()
      return 'mensaje'
    })

    reproducirLlamado({ turno: 25, clinicaNumero: '6A', onEnd })

    expect(reproducirSecuenciaMock).not.toHaveBeenCalled()
    expect(onEnd).toHaveBeenCalledTimes(1)
  })
})

describe('audioTablero · detener', () => {
  it('detiene reproducción, TTS y limpia la caché', () => {
    detenerAudioTablero()

    expect(detenerReproduccionMock).toHaveBeenCalled()
    expect(detenerHablaMock).toHaveBeenCalled()
  })

  it('ignora callbacks tardíos después de detener', async () => {
    const onEnd = vi.fn()
    const onError = vi.fn()
    let rechazar
    reproducirSecuenciaMock.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rechazar = reject
        }),
    )

    reproducirLlamado({ turno: 25, clinicaNumero: '6A', onEnd, onError })
    detenerAudioTablero()

    rechazar(new Error('tardío'))
    await Promise.resolve()

    expect(onEnd).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })
})
