import { describe, expect, it } from 'vitest'
import { topicEstacion, topicClinica, TOPIC_TABLERO, WS_URL } from './turnosSocket'

describe('turnosSocket', () => {
  it('usa el endpoint real del backend', () => {
    expect(WS_URL).toMatch(/\/api\/v1\/ws-turnos$/)
  })

  it('construye los topics de la estación y de la clínica', () => {
    expect(TOPIC_TABLERO).toBe('/topic/tablero')
    expect(topicEstacion(3)).toBe('/topic/estacion/3')
    expect(topicClinica(9)).toBe('/topic/clinica/9')
  })
})
