import { beforeEach, describe, expect, it } from 'vitest'
import {
  avanzarTurno,
  listarClinicas,
  obtenerLibro,
  registrarTurno,
  reiniciarSeguimientoMock,
} from './seguimientoApi'

beforeEach(() => {
  reiniciarSeguimientoMock()
})

describe('seguimientoApi', () => {
  it('siembra la jornada con correlativos por especialidad', async () => {
    const libro = await obtenerLibro()

    expect(libro.totalRegistrados).toBe(85)
    expect(libro.especialidades).toHaveLength(13)
    expect(libro.especialidades[0]).toMatchObject({
      codigo: 'MI',
      nombre: 'Medicina Interna',
      maximo: 100,
    })
    expect(libro.especialidades[0].turnos).toHaveLength(38)
  })

  it('registra un correlativo disponible y rechaza duplicados', async () => {
    const turno = await registrarTurno({ codigo: 'ONC', numero: 5 })

    expect(turno).toMatchObject({ id: 'ONC-5', etapa: 'registrado', clinicaId: null })
    await expect(registrarTurno({ codigo: 'ONC', numero: 5 })).rejects.toMatchObject({
      status: 409,
    })
    await expect(registrarTurno({ codigo: 'ONC', numero: 15 })).rejects.toMatchObject({
      status: 422,
    })
  })

  it('avanza por las cinco etapas y exige clínica al repartir', async () => {
    const registrado = await registrarTurno({ codigo: 'ONC', numero: 5 })

    const recibido = await avanzarTurno(registrado.id)
    expect(recibido.etapa).toBe('recibido')

    await expect(avanzarTurno(registrado.id)).rejects.toMatchObject({ status: 422 })

    const enClinica = await avanzarTurno(registrado.id, { clinicaId: 3 })
    expect(enClinica).toMatchObject({ etapa: 'en_clinica', clinicaId: 3 })

    const devuelto = await avanzarTurno(registrado.id)
    expect(devuelto.etapa).toBe('devuelto')

    const archivo = await avanzarTurno(registrado.id)
    expect(archivo.etapa).toBe('archivo')

    await expect(avanzarTurno(registrado.id)).rejects.toMatchObject({ status: 409 })
  })

  it('cuenta los expedientes que permanecen en cada clínica', async () => {
    const antes = await listarClinicas()
    const clinica3 = antes.find((clinica) => clinica.id === 3)

    const turno = await registrarTurno({ codigo: 'ONC', numero: 5 })
    await avanzarTurno(turno.id)
    await avanzarTurno(turno.id, { clinicaId: 3 })

    const despues = await listarClinicas()
    expect(despues.find((clinica) => clinica.id === 3).expedientesEnClinica).toBe(
      clinica3.expedientesEnClinica + 1,
    )
  })
})
