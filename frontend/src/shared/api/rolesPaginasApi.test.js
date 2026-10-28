import { describe, expect, it } from 'vitest'
import { INICIO_POR_ROL, MAPEO_DEFECTO, inicioSegunMapa } from './rolesPaginasApi.js'

describe('inicioSegunMapa', () => {
  it('enfermería entra directo al seguimiento de turnos', () => {
    expect(INICIO_POR_ROL.enfermeria).toBe('/seguimiento-enfermeria')
    expect(inicioSegunMapa(MAPEO_DEFECTO, 'enfermeria')).toBe('/seguimiento-enfermeria')
  })

  it('archivo y jefaturas entran a su pantalla operativa', () => {
    expect(inicioSegunMapa(MAPEO_DEFECTO, 'archivo')).toBe('/archivo/salida-hospital')
    expect(inicioSegunMapa(MAPEO_DEFECTO, 'jefe_archivo')).toBe('/jefe-archivo')
    expect(inicioSegunMapa(MAPEO_DEFECTO, 'jefe_enfermeria')).toBe('/jefe-enfermeria')
    expect(inicioSegunMapa(MAPEO_DEFECTO, 'personal_citas')).toBe('/libro-citas')
    expect(inicioSegunMapa(MAPEO_DEFECTO, 'desconocido')).toBe('/sin-acceso')
  })
})
