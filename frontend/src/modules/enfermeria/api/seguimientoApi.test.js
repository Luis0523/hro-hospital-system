import { beforeEach, describe, expect, it } from 'vitest'
import {
  avanzarTurno,
  cambiarClinicaTurno,
  contarExpedientesEnClinica,
  etapaDesdeEstado,
  listarAsignacionesClinicas,
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

    expect(turno).toMatchObject({
      id: 'ONC-5',
      etapa: 'registrado',
      clinicaId: null,
      tipoRegistro: null,
    })
    await expect(registrarTurno({ codigo: 'ONC', numero: 5 })).rejects.toMatchObject({
      status: 409,
    })
    await expect(registrarTurno({ codigo: 'ONC', numero: 19 })).rejects.toMatchObject({
      status: 422,
    })
  })

  it('guarda un solo tipo de registro por turno', async () => {
    const turno = await registrarTurno({
      codigo: 'ONC',
      numero: 5,
      tipoRegistro: 'privado_libertad',
    })

    expect(turno.tipoRegistro).toBe('privado_libertad')
    const libro = await obtenerLibro()
    const oncologia = libro.especialidades.find((especialidad) => especialidad.codigo === 'ONC')
    expect(oncologia.turnos.find((item) => item.numero === 5)).toMatchObject({
      tipoRegistro: 'privado_libertad',
    })
  })

  it('asigna la clínica configurada al registrar y permite cambiarla antes de En clínica', async () => {
    const conClinica = await registrarTurno({ codigo: 'ONC', numero: 5, espacioFisicoId: 2 })
    expect(conClinica).toMatchObject({ clinicaId: 2, clinicaNombre: 'Clínica 2' })

    await expect(
      registrarTurno({ codigo: 'ONC', numero: 6, espacioFisicoId: 3 }),
    ).rejects.toMatchObject({ status: 422 })

    const medicina = await registrarTurno({ codigo: 'MI', numero: 39, espacioFisicoId: 1 })
    const cambiado = await cambiarClinicaTurno(medicina.id, 3)
    expect(cambiado).toMatchObject({ etapa: 'registrado', clinicaId: 3 })

    const enClinica = await avanzarTurno(medicina.id, { clinicaId: 4 })
    expect(enClinica).toMatchObject({ etapa: 'en_clinica', clinicaId: 4 })
    await expect(cambiarClinicaTurno(medicina.id, 4)).rejects.toMatchObject({ status: 409 })
  })

  it('expone la asignación diaria de clínicas por especialidad', async () => {
    const asignaciones = await listarAsignacionesClinicas()

    const oncologia = asignaciones.find((item) =>
      item.asignaciones.some((asignacion) => asignacion.especialidadId === 'ONC'),
    )
    expect(oncologia.espacioFisicoId).toBe(2)
    expect(
      asignaciones.some((item) =>
        item.asignaciones.some((asignacion) => asignacion.especialidadId === 'NEF'),
      ),
    ).toBe(false)
  })

  it('traduce los estados del backend a las etapas visuales', () => {
    expect(etapaDesdeEstado('registrado')).toBe('registrado')
    expect(etapaDesdeEstado('recibido')).toBe('en_clinica')
    expect(etapaDesdeEstado('en_clinica')).toBe('en_clinica')
    expect(etapaDesdeEstado('llamado')).toBe('en_clinica')
    expect(etapaDesdeEstado('no_asistio')).toBe('en_clinica')
    expect(etapaDesdeEstado('atendido')).toBe('en_clinica')
    expect(etapaDesdeEstado('devuelto')).toBe('devuelto')
    expect(etapaDesdeEstado('archivado')).toBe('archivo')
  })

  it('cuenta expedientes por clínica usando el estado real del backend', () => {
    const clinicas = [
      { id: 'clinica-1', nombre: 'Clínica 101' },
      { id: 'clinica-2', nombre: 'Clínica 102' },
    ]
    const especialidades = [
      {
        id: 1,
        turnos: [
          { estadoBackend: 'en_clinica', clinicaId: 'clinica-1' },
          { estadoBackend: 'llamado', clinicaId: 'clinica-1' },
          { estadoBackend: 'devuelto', clinicaId: 'clinica-1' },
          { estadoBackend: 'atendido', clinicaId: 'clinica-2' },
        ],
      },
    ]

    expect(contarExpedientesEnClinica(clinicas, especialidades)).toEqual([
      { id: 'clinica-1', nombre: 'Clínica 101', expedientesEnClinica: 2 },
      { id: 'clinica-2', nombre: 'Clínica 102', expedientesEnClinica: 1 },
    ])
  })

  it('avanza por las cuatro etapas visibles y exige clínica al repartir', async () => {
    const registrado = await registrarTurno({ codigo: 'ONC', numero: 5 })

    await expect(avanzarTurno(registrado.id)).rejects.toMatchObject({ status: 422 })

    const enClinica = await avanzarTurno(registrado.id, { clinicaId: 3 })
    expect(enClinica).toMatchObject({ etapa: 'en_clinica', clinicaId: 3 })

    const devuelto = await avanzarTurno(registrado.id)
    expect(devuelto.etapa).toBe('devuelto')

    const archivo = await avanzarTurno(registrado.id)
    expect(archivo.etapa).toBe('archivo')

    await expect(avanzarTurno(registrado.id)).rejects.toMatchObject({ status: 409 })
  })

  it('lista todas las clínicas sin limitarlas a cinco', async () => {
    const clinicas = await listarClinicas()

    expect(clinicas).toHaveLength(8)
    expect(clinicas.map((clinica) => clinica.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('cuenta los expedientes que permanecen en cada clínica', async () => {
    const antes = await listarClinicas()
    const clinica3 = antes.find((clinica) => clinica.id === 3)

    const turno = await registrarTurno({ codigo: 'ONC', numero: 5 })
    await avanzarTurno(turno.id, { clinicaId: 3 })

    const despues = await listarClinicas()
    expect(despues.find((clinica) => clinica.id === 3).expedientesEnClinica).toBe(
      clinica3.expedientesEnClinica + 1,
    )
  })
})
