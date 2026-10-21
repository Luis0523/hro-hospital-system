import { describe, expect, it } from 'vitest'
import {
  construirSecuenciaLlamado,
  RUTA_BASE_AUDIO,
  RUTAS_GENERALES,
  rutaDestino,
  rutaNumero,
} from './segmentosVoz'

describe('RUTAS_GENERALES', () => {
  it('expone la ruta base del audio del tablero', () => {
    expect(RUTA_BASE_AUDIO).toBe('/audio/tablero/')
  })

  it('resuelve las rutas generales del anuncio', () => {
    expect(RUTAS_GENERALES.sonidoPrevio).toBe('/audio/tablero/generales/sonidoprevio.mp3')
    expect(RUTAS_GENERALES.paciente).toBe('/audio/tablero/generales/paciente.mp3')
    expect(RUTAS_GENERALES.numero).toBe('/audio/tablero/generales/numero.mp3')
    expect(RUTAS_GENERALES.pasarA).toBe('/audio/tablero/generales/pasar_a.mp3')
    expect(RUTAS_GENERALES.clinica).toBe('/audio/tablero/generales/clinica.mp3')
  })

  it('conserva rutas históricas aunque no formen parte del anuncio actual', () => {
    expect(RUTAS_GENERALES.pasaraA).toBe('/audio/tablero/generales/pasara_a.mp3')
    expect(RUTAS_GENERALES.siguientesPacientesClinica).toBe(
      '/audio/tablero/generales/siguientes_pacientes_clinica.mp3',
    )
  })
})

describe('rutaNumero', () => {
  it('normaliza números de un dígito con padding', () => {
    expect(rutaNumero(1)).toBe('/audio/tablero/numeros/001.mp3')
    expect(rutaNumero(7)).toBe('/audio/tablero/numeros/007.mp3')
    expect(rutaNumero(9)).toBe('/audio/tablero/numeros/009.mp3')
  })

  it('normaliza números de dos y tres dígitos', () => {
    expect(rutaNumero(25)).toBe('/audio/tablero/numeros/025.mp3')
    expect(rutaNumero(150)).toBe('/audio/tablero/numeros/150.mp3')
    expect(rutaNumero(200)).toBe('/audio/tablero/numeros/200.mp3')
    expect(rutaNumero(201)).toBe('/audio/tablero/numeros/201.mp3')
    expect(rutaNumero(300)).toBe('/audio/tablero/numeros/300.mp3')
  })

  it('acepta strings numéricos y los normaliza', () => {
    expect(rutaNumero('25')).toBe('/audio/tablero/numeros/025.mp3')
    expect(rutaNumero('025')).toBe('/audio/tablero/numeros/025.mp3')
    expect(rutaNumero(' 150 ')).toBe('/audio/tablero/numeros/150.mp3')
    expect(rutaNumero('200')).toBe('/audio/tablero/numeros/200.mp3')
    expect(rutaNumero('300')).toBe('/audio/tablero/numeros/300.mp3')
  })

  it('rechaza el número 0', () => {
    expect(rutaNumero(0)).toBeNull()
    expect(rutaNumero('0')).toBeNull()
  })

  it('rechaza números mayores a 300', () => {
    expect(rutaNumero(301)).toBeNull()
    expect(rutaNumero('301')).toBeNull()
    expect(rutaNumero(999)).toBeNull()
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

describe('construirSecuenciaLlamado', () => {
  it('construye la secuencia exacta para 25 + 6A', () => {
    expect(construirSecuenciaLlamado({ turno: 25, clinicaNumero: '6A' })).toEqual([
      '/audio/tablero/generales/sonidoprevio.mp3',
      '/audio/tablero/generales/paciente.mp3',
      '/audio/tablero/generales/numero.mp3',
      '/audio/tablero/numeros/025.mp3',
      '/audio/tablero/generales/pasar_a.mp3',
      '/audio/tablero/generales/clinica.mp3',
      '/audio/tablero/numeros/6a.mp3',
    ])
  })

  it('construye la secuencia exacta para 300 + 6B', () => {
    expect(construirSecuenciaLlamado({ turno: 300, clinicaNumero: '6B' })).toEqual([
      '/audio/tablero/generales/sonidoprevio.mp3',
      '/audio/tablero/generales/paciente.mp3',
      '/audio/tablero/generales/numero.mp3',
      '/audio/tablero/numeros/300.mp3',
      '/audio/tablero/generales/pasar_a.mp3',
      '/audio/tablero/generales/clinica.mp3',
      '/audio/tablero/numeros/6b.mp3',
    ])
  })

  it('no usa pasara_a en la secuencia nueva', () => {
    const secuencia = construirSecuenciaLlamado({ turno: 25, clinicaNumero: '6A' })

    expect(secuencia).not.toContain('/audio/tablero/generales/pasara_a.mp3')
    expect(secuencia).toContain('/audio/tablero/generales/pasar_a.mp3')
  })

  it('devuelve null para turno mayor a 300', () => {
    expect(construirSecuenciaLlamado({ turno: 301, clinicaNumero: '6A' })).toBeNull()
    expect(construirSecuenciaLlamado({ turno: 999, clinicaNumero: '6A' })).toBeNull()
  })

  it('usa el audio numérico para clínicas como 201 o 3', () => {
    expect(construirSecuenciaLlamado({ turno: 25, clinicaNumero: '201' })).toEqual([
      '/audio/tablero/generales/sonidoprevio.mp3',
      '/audio/tablero/generales/paciente.mp3',
      '/audio/tablero/generales/numero.mp3',
      '/audio/tablero/numeros/025.mp3',
      '/audio/tablero/generales/pasar_a.mp3',
      '/audio/tablero/generales/clinica.mp3',
      '/audio/tablero/numeros/201.mp3',
    ])
    expect(construirSecuenciaLlamado({ turno: 55, clinicaNumero: '3' })).toEqual([
      '/audio/tablero/generales/sonidoprevio.mp3',
      '/audio/tablero/generales/paciente.mp3',
      '/audio/tablero/generales/numero.mp3',
      '/audio/tablero/numeros/055.mp3',
      '/audio/tablero/generales/pasar_a.mp3',
      '/audio/tablero/generales/clinica.mp3',
      '/audio/tablero/numeros/003.mp3',
    ])
    expect(construirSecuenciaLlamado({ turno: 25, clinicaNumero: '6C' })).toBeNull()
  })

  it('devuelve null si faltan argumentos', () => {
    expect(construirSecuenciaLlamado()).toBeNull()
    expect(construirSecuenciaLlamado({})).toBeNull()
    expect(construirSecuenciaLlamado({ turno: 25 })).toBeNull()
  })

  it('no genera rutas parciales ante entradas inválidas', () => {
    expect(construirSecuenciaLlamado({ turno: 301, clinicaNumero: '6A' })).toBeNull()
    expect(construirSecuenciaLlamado({ turno: 25, clinicaNumero: '6C' })).toBeNull()
  })
})
