import { describe, expect, it } from 'vitest'
import { INICIO_POR_ROL, MAPEO_DEFECTO, inicioSegunMapa } from './rolesPaginasApi.js'

describe('inicioSegunMapa', () => {
  it('enfermería entra directo al registro de carnets', () => {
    expect(INICIO_POR_ROL.enfermeria).toBe('/enfermeria/carnets')
    expect(inicioSegunMapa(MAPEO_DEFECTO, 'enfermeria')).toBe('/enfermeria/carnets')
  })

  it('los demás roles conservan su pantalla por prioridad de áreas', () => {
    expect(inicioSegunMapa(MAPEO_DEFECTO, 'archivo')).toBe('/archivo')
    expect(inicioSegunMapa(MAPEO_DEFECTO, 'personal_citas')).toBe('/libro-citas')
    expect(inicioSegunMapa(MAPEO_DEFECTO, 'jefe_enfermeria')).toBe('/jefe-enfermeria')
    expect(inicioSegunMapa(MAPEO_DEFECTO, 'desconocido')).toBe('/sin-acceso')
  })
})
