import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  anunciarTurno,
  buscarVozEspanol,
  construirMensajeTurno,
  estaDisponibleVoz,
  FRASE_ACTIVACION,
  hablar,
  vocesDisponibles,
} from './comunicacionVoz'

const ASIGNACION = {
  asignacionDiariaEspacioId: 1,
  espacioNumero: '103',
  nivel: 2,
  subespecialidadNombre: 'Pediatría General',
  turnoActual: 14,
  turnoSiguiente: 15,
}

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubVoz({ voces = [], speechExtra = {} } = {}) {
  const hablados = []

  class FakeUtterance {
    constructor(texto) {
      this.text = texto
    }
  }

  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => voces,
    speak: (utterance) => hablados.push(utterance),
    ...speechExtra,
  })

  return hablados
}

describe('construirMensajeTurno', () => {
  it('construye la frase exacta con turno y consultorio', () => {
    expect(construirMensajeTurno(ASIGNACION)).toBe(
      'Turno número 14. Favor pasar al consultorio 103.',
    )
  })

  it('no incluye el formato visual "#" en la voz', () => {
    const mensaje = construirMensajeTurno(ASIGNACION)

    expect(mensaje).not.toContain('#')
    expect(mensaje).not.toContain('#014')
    expect(mensaje).toContain('Turno número 14.')
  })

  it('ignora la subespecialidad aunque venga en el objeto', () => {
    const mensaje = construirMensajeTurno(ASIGNACION)

    expect(mensaje).not.toContain('Pediatría')
    expect(mensaje).not.toContain('General')
  })

  it('ignora clínica y datos personales', () => {
    const mensaje = construirMensajeTurno({
      ...ASIGNACION,
      clinicaNombre: 'Consultorio Externo',
      nombrePaciente: 'Juan Perez',
      pacienteNombreCompleto: 'Juan Perez',
      dpi: '1234567890101',
      expediente: 'HRO-123',
      telefono: '55555555',
      diagnostico: 'Gripe',
    })

    expect(mensaje).not.toContain('Juan')
    expect(mensaje).not.toContain('Perez')
    expect(mensaje).not.toContain('1234567890101')
    expect(mensaje).not.toContain('HRO-123')
    expect(mensaje).not.toContain('55555555')
    expect(mensaje).not.toContain('Gripe')
    expect(mensaje).not.toContain('Consultorio Externo')
  })

  it('no menciona el turno siguiente', () => {
    const mensaje = construirMensajeTurno({ ...ASIGNACION, turnoSiguiente: 99 })

    expect(mensaje).not.toContain('99')
    expect(mensaje).not.toContain('prepararse')
  })

  it('si falta el consultorio usa solo el turno', () => {
    expect(construirMensajeTurno({ turnoActual: 14, espacioNumero: null })).toBe(
      'Turno número 14.',
    )
    expect(construirMensajeTurno({ turnoActual: 14, espacioNumero: '   ' })).toBe(
      'Turno número 14.',
    )
  })

  it('no construye mensaje si no hay turno actual', () => {
    expect(construirMensajeTurno({ espacioNumero: '103', turnoActual: null })).toBeNull()
    expect(construirMensajeTurno({ espacioNumero: '103', turnoActual: 0 })).toBeNull()
  })
})

describe('buscarVozEspanol', () => {
  it('prioriza es-GT', () => {
    const voces = [
      { lang: 'en-US' },
      { lang: 'es-ES' },
      { lang: 'es-MX' },
      { lang: 'es-GT' },
    ]

    expect(buscarVozEspanol(voces).lang).toBe('es-GT')
  })

  it('prioriza español latinoamericano sobre es-ES', () => {
    expect(buscarVozEspanol([{ lang: 'es-ES' }, { lang: 'es-MX' }]).lang).toBe('es-MX')
    expect(buscarVozEspanol([{ lang: 'es-ES' }, { lang: 'es-CO' }]).lang).toBe('es-CO')
  })

  it('usa es-ES cuando es la única española', () => {
    expect(buscarVozEspanol([{ lang: 'en-US' }, { lang: 'es-ES' }]).lang).toBe('es-ES')
  })

  it('acepta cualquier voz cuyo idioma empiece por "es"', () => {
    expect(buscarVozEspanol([{ lang: 'en-US' }, { lang: 'es-ZZ' }]).lang).toBe('es-ZZ')
  })

  it('devuelve null si no hay voces ni voces en español', () => {
    expect(buscarVozEspanol([{ lang: 'en-US' }])).toBeNull()
    expect(buscarVozEspanol([])).toBeNull()
    expect(buscarVozEspanol()).toBeNull()
  })
})

describe('disponibilidad y locución', () => {
  it('detecta que SpeechSynthesis no está disponible y no falla', () => {
    expect(estaDisponibleVoz({})).toBe(false)
    expect(hablar('Hola', { entorno: {} })).toBe(false)
    expect(anunciarTurno(ASIGNACION, { entorno: {} })).toBeNull()
  })

  it('habla en español con prosodia natural y la voz preferida', () => {
    const hablados = stubVoz({ voces: [{ lang: 'en-US' }, { lang: 'es-MX', name: 'México' }] })

    expect(estaDisponibleVoz()).toBe(true)
    expect(hablar('Hola')).toBe(true)
    expect(hablados).toHaveLength(1)
    expect(hablados[0].text).toBe('Hola')
    expect(hablados[0].rate).toBe(1.5)
    expect(hablados[0].pitch).toBe(1)
    expect(hablados[0].volume).toBe(1)
    expect(hablados[0].voice.lang).toBe('es-MX')
    expect(hablados[0].lang).toBe('es-MX')
  })

  it('usa lang es-GT cuando no hay voz española', () => {
    const hablados = stubVoz({ voces: [{ lang: 'en-US' }] })

    expect(hablar('Hola')).toBe(true)
    expect(hablados[0].lang).toBe('es-GT')
    expect(hablados[0].voice).toBeUndefined()
  })

  it('permite sobreescribir rate, pitch y volume', () => {
    const hablados = stubVoz({ voces: [{ lang: 'es-GT' }] })

    hablar('Hola', { rate: 0.95, pitch: 1, volume: 0.5 })

    expect(hablados[0].rate).toBe(0.95)
    expect(hablados[0].pitch).toBe(1)
    expect(hablados[0].volume).toBe(0.5)
  })

  it('anuncia el turno usando el mensaje construido', () => {
    const hablados = stubVoz({ voces: [{ lang: 'es-GT' }] })

    const mensaje = anunciarTurno(ASIGNACION)

    expect(mensaje).toBe('Turno número 14. Favor pasar al consultorio 103.')
    expect(hablados[0].text).toBe(mensaje)
  })

  it('conecta onEnd y onError a la utterance', () => {
    const hablados = stubVoz({ voces: [{ lang: 'es-GT' }] })

    const onEnd = vi.fn()
    const onError = vi.fn()

    expect(hablar('Hola', { onEnd, onError })).toBe(true)

    const utterance = hablados[0]
    expect(typeof utterance.onend).toBe('function')
    expect(typeof utterance.onerror).toBe('function')

    utterance.onend()
    expect(onEnd).toHaveBeenCalledTimes(1)

    utterance.onerror({ error: 'synthesis-failed' })
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('propaga los callbacks de anunciarTurno hacia hablar', () => {
    const hablados = stubVoz({ voces: [{ lang: 'es-GT' }] })

    const onEnd = vi.fn()

    expect(anunciarTurno(ASIGNACION, { onEnd })).toBe(
      'Turno número 14. Favor pasar al consultorio 103.',
    )
    hablados[0].onend()

    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('habla sin callbacks sin romper el comportamiento existente', () => {
    const hablados = stubVoz({ voces: [] })

    expect(hablar('Hola')).toBe(true)
    expect(hablados[0].text).toBe('Hola')
    expect(hablados[0].onend).toBeUndefined()
    expect(hablados[0].onerror).toBeUndefined()
  })

  it('expone la frase de activación', () => {
    expect(FRASE_ACTIVACION).toBe('Comunicación por voz activada.')
  })
})

describe('vocesDisponibles y voiceschanged', () => {
  function stubConLista(vocesIniciales) {
    const estado = { voces: vocesIniciales }
    const listeners = []

    class FakeUtterance {
      constructor(texto) {
        this.text = texto
      }
    }

    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => estado.voces,
      addEventListener: (evento, callback) => {
        if (evento === 'voiceschanged') listeners.push(callback)
      },
      speak: () => {},
    })

    return { estado, listeners }
  }

  it('refresca la caché cuando se dispara voiceschanged', () => {
    const { estado, listeners } = stubConLista([])

    expect(vocesDisponibles()).toEqual([])

    estado.voces = [{ lang: 'es-MX', name: 'México' }]
    listeners.forEach((callback) => callback())

    expect(vocesDisponibles()).toEqual([{ lang: 'es-MX', name: 'México' }])
  })

  it('registra un único listener voiceschanged aunque haya varios llamados', () => {
    const { listeners } = stubConLista([])

    hablar('uno')
    hablar('dos')
    hablar('tres')

    expect(listeners).toHaveLength(1)
  })

  it('funciona cuando addEventListener no existe', () => {
    const hablados = stubVoz({ voces: [{ lang: 'es-GT' }] })

    expect(() => hablar('Hola')).not.toThrow()
    expect(hablados[0].lang).toBe('es-GT')
  })
})
