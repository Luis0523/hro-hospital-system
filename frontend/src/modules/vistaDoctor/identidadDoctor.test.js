import { beforeEach, describe, expect, it } from 'vitest'
import {
  CLAVE_SESION_DOCTOR,
  crearSesionDoctor,
  guardarSesionDoctor,
  leerSesionDoctor,
  limpiarSesionDoctor,
  sesionCorrespondeA,
} from './identidadDoctor'

const medico = {
  id: 'med-001',
  nombre: 'Dra. Ana Lucía Demo',
  colegiado: '1001',
  usuarioReferenciaId: 11,
  activo: true,
}

const clinica = {
  codigo: '101-11',
  espacioFisicoId: '11111111-1111-4111-8111-111111111111',
  numero: '3',
  nivel: 2,
  nombre: 'Consulta Externa',
  ubicacion: 'Edificio de Consulta Externa · Segundo Nivel',
}

const asignacion = {
  id: 101,
  subespecialidadId: 11,
  subespecialidadNombre: 'Medicina Interna',
  especialidadId: 1,
  especialidadNombre: 'Medicina Interna',
}

describe('identidadDoctor', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('crea y persiste una sesión normalizada', () => {
    const sesion = crearSesionDoctor({ medico, clinica, asignacion })

    expect(sesion).toMatchObject({
      version: 1,
      medico: {
        id: 'med-001',
        nombre: 'Dra. Ana Lucía Demo',
        colegiado: '1001',
      },
      clinica: { codigo: '101-11', espacioFisicoId: clinica.espacioFisicoId },
      asignacion: { id: 101 },
    })

    guardarSesionDoctor(sesion)
    expect(JSON.parse(sessionStorage.getItem(CLAVE_SESION_DOCTOR))).toMatchObject({
      medico: { colegiado: '1001' },
    })
    expect(leerSesionDoctor()).toMatchObject({
      medico: { nombre: 'Dra. Ana Lucía Demo' },
      asignacion: { id: 101 },
    })
  })

  it('conserva el colegiado como texto, incluidos ceros iniciales', () => {
    const sesion = crearSesionDoctor({
      medico: { ...medico, colegiado: ' 001001 ' },
      clinica,
      asignacion,
    })

    expect(sesion.medico.colegiado).toBe('001001')
  })

  it('rechaza una sesión incompleta', () => {
    expect(crearSesionDoctor({ medico, clinica, asignacion: null })).toBeNull()
  })

  it('devuelve null ante JSON inválido o versión distinta', () => {
    sessionStorage.setItem(CLAVE_SESION_DOCTOR, '{')
    expect(leerSesionDoctor()).toBeNull()

    sessionStorage.setItem(
      CLAVE_SESION_DOCTOR,
      JSON.stringify({ version: 99, medico, clinica, asignacion }),
    )
    expect(leerSesionDoctor()).toBeNull()
  })

  it('limpia la sesión', () => {
    guardarSesionDoctor(crearSesionDoctor({ medico, clinica, asignacion }))
    limpiarSesionDoctor()
    expect(leerSesionDoctor()).toBeNull()
  })

  it('compara clínica y asignación', () => {
    const sesion = crearSesionDoctor({ medico, clinica, asignacion })

    expect(sesionCorrespondeA(sesion, clinica, asignacion)).toBe(true)
    expect(
      sesionCorrespondeA(
        sesion,
        { ...clinica, espacioFisicoId: '22222222-2222-4222-8222-222222222222' },
        asignacion,
      ),
    ).toBe(false)
    expect(sesionCorrespondeA(sesion, clinica, { ...asignacion, id: 202 })).toBe(false)
  })
})
