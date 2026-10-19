import { describe, expect, it } from 'vitest'
import {
  construirSecuenciaPaciente,
  RUTA_BASE_AUDIO,
  RUTAS_GENERALES,
  rutaDestino,
  rutaNumero,
} from './segmentosVoz'

describe('RUTAS_GENERALES', () => {
  it('expone la ruta base del audio del tablero', () => {
    expect(RUTA_BASE_AUDIO).toBe('/audio/tablero/')
  })

  it('resuelve la ruta de paciente', () => {
    expect(RUTAS_GENERALES.paciente).toBe('/audio/tablero/generales/paciente.mp3')
  })

  it('resuelve la ruta de pasar_a', () => {
    expect(RUTAS_GENERALES.pasarA).toBe('/audio/tablero/generales/pasar_a.mp3')
  })

  it('resuelve la ruta de pasara_a', () => {
    expect(RUTAS_GENERALES.pasaraA).toBe('/audio/tablero/generales/pasara_a.mp3')
  })

  it('resuelve la ruta de siguientes pacientes a la clínica', () => {
    expect(RUTAS_GENERALES.siguientesPacientesClinica).toBe(
      '/audio/tablero/generales/siguientes_pacientes_clinica.mp3',
    )
  })
})

describe('rutaNumero', () => {
  it('normaliza el número 1 a 001.mp3', () => {
    expect(rutaNumero(1)).toBe('/audio/tablero/numeros/001.mp3')
  })

  it('normaliza el número 7 a 007.mp3', () => {
    expect(rutaNumero(7)).toBe('/audio/tablero/numeros/007.mp3')
  })

  it('normaliza el número 9 a 009.mp3', () => {
    expect(rutaNumero(9)).toBe('/audio/tablero/numeros/009.mp3')
  })

  it('normaliza el número 25 a 025.mp3', () => {
    expect(rutaNumero(25)).toBe('/audio/tablero/numeros/025.mp3')
  })

  it('normaliza el número 150 a 150.mp3', () => {
    expect(rutaNumero(150)).toBe('/audio/tablero/numeros/150.mp3')
  })

  it('acepta strings numéricos y los normaliza', () => {
    expect(rutaNumero('25')).toBe('/audio/tablero/numeros/025.mp3')
    expect(rutaNumero('025')).toBe('/audio/tablero/numeros/025.mp3')
    expect(rutaNumero(' 150 ')).toBe('/audio/tablero/numeros/150.mp3')
  })

  it('rechaza el número 0', () => {
    expect(rutaNumero(0)).toBeNull()
    expect(rutaNumero('0')).toBeNull()
  })

  it('rechaza números mayores a 150', () => {
    expect(rutaNumero(151)).toBeNull()
    expect(rutaNumero('151')).toBeNull()
  })

  it('rechaza números negativos', () => {
    expect(rutaNumero(-1)).toBeNull()
    expect(rutaNumero('-1')).toBeNull()
  })

  it('rechaza decimales', () => {
    expect(rutaNumero(1.5)).toBeNull()
    expect(rutaNumero('1.5')).toBeNull()
  })

  it('rechaza valores no numéricos', () => {
    expect(rutaNumero('6A')).toBeNull()
    expect(rutaNumero('abc')).toBeNull()
    expect(rutaNumero('')).toBeNull()
    expect(rutaNumero('   ')).toBeNull()
    expect(rutaNumero(null)).toBeNull()
    expect(rutaNumero(undefined)).toBeNull()
    expect(rutaNumero(true)).toBeNull()
    expect(rutaNumero(NaN)).toBeNull()
    expect(rutaNumero(Infinity)).toBeNull()
  })
})

describe('rutaDestino', () => {
  it('acepta 6A y normaliza a 6a.mp3', () => {
    expect(rutaDestino('6A')).toBe('/audio/tablero/numeros/6a.mp3')
  })

  it('acepta 6a en minúsculas', () => {
    expect(rutaDestino('6a')).toBe('/audio/tablero/numeros/6a.mp3')
  })

  it('acepta 6B y normaliza a 6b.mp3', () => {
    expect(rutaDestino('6B')).toBe('/audio/tablero/numeros/6b.mp3')
  })

  it('acepta 6b en minúsculas', () => {
    expect(rutaDestino('6b')).toBe('/audio/tablero/numeros/6b.mp3')
  })

  it('tolera espacios alrededor del destino', () => {
    expect(rutaDestino(' 6A ')).toBe('/audio/tablero/numeros/6a.mp3')
  })

  it('no acepta otros destinos', () => {
    expect(rutaDestino('6C')).toBeNull()
    expect(rutaDestino('201')).toBeNull()
    expect(rutaDestino('202')).toBeNull()
    expect(rutaDestino('301')).toBeNull()
    expect(rutaDestino('302')).toBeNull()
    expect(rutaDestino('A6')).toBeNull()
    expect(rutaDestino('')).toBeNull()
    expect(rutaDestino(null)).toBeNull()
    expect(rutaDestino(6)).toBeNull()
  })
})

describe('construirSecuenciaPaciente', () => {
  it('construye Paciente + 25 + Pasará a + 6A', () => {
    expect(construirSecuenciaPaciente({ numero: 25, destino: '6A', accion: 'pasara_a' })).toEqual([
      '/audio/tablero/generales/paciente.mp3',
      '/audio/tablero/numeros/025.mp3',
      '/audio/tablero/generales/pasara_a.mp3',
      '/audio/tablero/numeros/6a.mp3',
    ])
  })

  it('construye Paciente + 1 + Pasar a + 6B', () => {
    expect(construirSecuenciaPaciente({ numero: 1, destino: '6B', accion: 'pasar_a' })).toEqual([
      '/audio/tablero/generales/paciente.mp3',
      '/audio/tablero/numeros/001.mp3',
      '/audio/tablero/generales/pasar_a.mp3',
      '/audio/tablero/numeros/6b.mp3',
    ])
  })

  it('usa "pasara_a" por defecto', () => {
    expect(construirSecuenciaPaciente({ numero: 7, destino: '6b' })).toEqual([
      '/audio/tablero/generales/paciente.mp3',
      '/audio/tablero/numeros/007.mp3',
      '/audio/tablero/generales/pasara_a.mp3',
      '/audio/tablero/numeros/6b.mp3',
    ])
  })

  it('devuelve null si el número es inválido', () => {
    expect(construirSecuenciaPaciente({ numero: 0, destino: '6A' })).toBeNull()
    expect(construirSecuenciaPaciente({ numero: 151, destino: '6A' })).toBeNull()
    expect(construirSecuenciaPaciente({ numero: 1.5, destino: '6A' })).toBeNull()
  })

  it('devuelve null si el destino es inválido', () => {
    expect(construirSecuenciaPaciente({ numero: 25, destino: '201' })).toBeNull()
    expect(construirSecuenciaPaciente({ numero: 25, destino: '6C' })).toBeNull()
    expect(construirSecuenciaPaciente({ numero: 25 })).toBeNull()
  })

  it('devuelve null si la acción es inválida', () => {
    expect(
      construirSecuenciaPaciente({ numero: 25, destino: '6A', accion: 'gritar' }),
    ).toBeNull()
  })

  it('devuelve null si faltan argumentos', () => {
    expect(construirSecuenciaPaciente()).toBeNull()
    expect(construirSecuenciaPaciente({})).toBeNull()
  })

  it('no genera rutas parciales ante entradas inválidas', () => {
    const secuencia = construirSecuenciaPaciente({ numero: 25, destino: '201' })

    expect(secuencia).toBeNull()
  })
})
