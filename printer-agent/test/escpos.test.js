import test from 'node:test'
import assert from 'node:assert/strict'
import { construirTicketPrueba } from '../src/escpos.js'
import { aCp850 } from '../src/cp850.js'

test('el ticket contiene turno, especialidad y clínica', () => {
  const buffer = construirTicketPrueba({
    turno: 42,
    especialidad: 'Pediatría',
    clinica: '02',
    fechaHora: '21/10/2026 14:35',
  })

  const texto = buffer.toString('latin1')
  assert.match(texto, /HOSPITAL REGIONAL DE OCCIDENTE/)
  assert.match(texto, /SIGHO/)
  assert.match(texto, /#042/)
  assert.match(texto, /ESPECIALIDAD: Pediatr/)
  assert.match(texto, /CLINICA: {6}02/)
  assert.match(texto, /FECHA Y HORA: 21\/10\/2026 14:35/)
  assert.doesNotMatch(texto, /PRUEBA/)
  assert.doesNotMatch(texto, /sin validez/)
})

test('rechaza un turno inválido', () => {
  assert.throws(() => construirTicketPrueba({ especialidad: 'X', clinica: '1' }), /turno/i)
})

test('codifica acentos en CP850 y limpia caracteres de control', () => {
  const bytes = aCp850('José Á\n\x1b@')
  assert.ok(bytes.includes(0x82), 'é debe codificarse como 0x82')
  assert.ok(bytes.includes(0xb5), 'Á debe codificarse como 0xb5')
})

test('usa 48 columnas por defecto para 80 mm', () => {
  const buffer = construirTicketPrueba({ turno: 1, especialidad: 'X', clinica: '1' })
  const texto = buffer.toString('latin1')
  assert.match(texto, /-{48}/)
})
