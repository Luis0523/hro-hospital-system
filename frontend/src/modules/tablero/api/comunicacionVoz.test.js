import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  anunciarTurno,
  buscarVozEspanol,
  construirMensajeTurno,
  estaDisponibleVoz,
  FRASE_ACTIVACION,
  hablar,
} from './comunicacionVoz'

const ASIGNACION = {
  asignacionDiariaEspacioId: 1,
  espacioNumero: '201',
  nivel: 2,
  subespecialidadNombre: 'Pediatría General',
  turnoActual: 7,
  turnoSiguiente: 8,
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('construirMensajeTurno', () => {
  it('construye el mensaje completo con turno actual, subespecialidad, consultorio y siguiente', () => {
    expect(construirMensajeTurno(ASIGNACION)).toBe(
      'Turno número 7, favor pasar a Pediatría General, consultorio 201. Turno número 8, favor prepararse.',
    )
  })

  it('omite la preparación cuando no hay turno siguiente', () => {
    expect(construirMensajeTurno({ ...ASIGNACION, turnoSiguiente: null })).toBe(
      'Turno número 7, favor pasar a Pediatría General, consultorio 201.',
    )
  })

  it('usa el formato sin subespecialidad cuando esta no existe', () => {
    expect(construirMensajeTurno({ espacioNumero: '201', turnoActual: 7 })).toBe(
      'Turno número 7, favor pasar al consultorio 201.',
    )
  })

  it('no construye mensaje si no hay turno actual', () => {
    expect(construirMensajeTurno({ espacioNumero: '201', turnoActual: null })).toBeNull()
    expect(construirMensajeTurno({ espacioNumero: '201', turnoActual: 0 })).toBeNull()
  })

  it('descarta cualquier dato personal que llegue en el objeto', () => {
    const mensaje = construirMensajeTurno({
      ...ASIGNACION,
      nombrePaciente: 'Juan Perez',
      pacienteNombreCompleto: 'Juan Perez',
      dpi: '1234567890101',
      expediente: 'HRO-123',
      telefono: '55555555',
    })

    expect(mensaje).not.toContain('Juan')
    expect(mensaje).not.toContain('Perez')
    expect(mensaje).not.toContain('1234567890101')
    expect(mensaje).not.toContain('HRO-123')
    expect(mensaje).not.toContain('55555555')
  })
})

describe('buscarVozEspanol', () => {
  it('prioriza es-GT, luego es-MX y es-ES', () => {
    const voces = [{ lang: 'en-US' }, { lang: 'es-ES' }, { lang: 'es-MX' }, { lang: 'es-GT' }]

    expect(buscarVozEspanol(voces).lang).toBe('es-GT')
    expect(buscarVozEspanol([{ lang: 'es-ES' }, { lang: 'es-MX' }]).lang).toBe('es-MX')
  })

  it('acepta cualquier voz cuyo idioma empiece por "es"', () => {
    expect(buscarVozEspanol([{ lang: 'en-US' }, { lang: 'es-CO' }]).lang).toBe('es-CO')
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

  it('habla en español con una velocidad clara y la voz preferida', () => {
    const hablados = []

    class FakeUtterance {
      constructor(texto) {
        this.text = texto
      }
    }

    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => [{ lang: 'en-US' }, { lang: 'es-MX', name: 'México' }],
      speak: (utterance) => hablados.push(utterance),
    })

    expect(estaDisponibleVoz()).toBe(true)
    expect(hablar('Hola')).toBe(true)
    expect(hablados).toHaveLength(1)
    expect(hablados[0].text).toBe('Hola')
    expect(hablados[0].lang).toBe('es-GT')
    expect(hablados[0].rate).toBe(0.9)
    expect(hablados[0].voice.lang).toBe('es-MX')
  })

  it('anuncia el turno usando el mensaje construido', () => {
    const hablados = []

    class FakeUtterance {
      constructor(texto) {
        this.text = texto
      }
    }

    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => [{ lang: 'es-GT' }],
      speak: (utterance) => hablados.push(utterance),
    })

    const mensaje = anunciarTurno(ASIGNACION)

    expect(mensaje).toBe(construirMensajeTurno(ASIGNACION))
    expect(hablados[0].text).toBe(mensaje)
  })

  it('expone la frase de activación', () => {
    expect(FRASE_ACTIVACION).toBe('Comunicación por voz activada.')
  })
})
