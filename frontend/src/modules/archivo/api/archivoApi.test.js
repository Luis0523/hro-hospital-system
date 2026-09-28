import { describe, expect, it } from 'vitest'
import {
  avanzarEstado,
  buscarExpedientePorCodigo,
  buscarPacientePorDpi,
  buscarPacientePorExpediente,
  crearActaRecepcion,
  crearExpediente,
  listarClinicas,
  listarExpedientes,
  listarJornadaArchivo,
  listarSubespecialidades,
  marcarNoLocalizado,
  obtenerActaRecepcion,
  obtenerActaRecepcionPdf,
  obtenerExpediente,
  obtenerResumenArchivo,
  obtenerResumenArchivoPdf,
} from './archivoApi'

describe('archivoApi (mock)', () => {
  it('lista expedientes con la forma esperada', async () => {
    const lista = await listarExpedientes()

    expect(lista.length).toBeGreaterThan(0)
    expect(lista[0]).toHaveProperty('pacienteNombre')
    expect(lista[0]).toHaveProperty('estado')
    expect(lista[0]).toHaveProperty('historial')
  })

  it('no lista expedientes sin número de expediente', async () => {
    const lista = await listarExpedientes()

    expect(lista.length).toBeGreaterThan(0)
    expect(lista.every((expediente) => Boolean(expediente.numeroExpediente))).toBe(true)
  })

  it('filtra por fecha y subespecialidad', async () => {
    const [primero] = await listarExpedientes()

    const porFecha = await listarExpedientes({ fecha: primero.fechaCita })
    expect(porFecha.every((expediente) => expediente.fechaCita === primero.fechaCita)).toBe(true)

    const porSubespecialidad = await listarExpedientes({
      subespecialidadId: primero.subespecialidadId,
    })
    expect(
      porSubespecialidad.every(
        (expediente) => expediente.subespecialidadId === primero.subespecialidadId,
      ),
    ).toBe(true)
  })

  it('devuelve el detalle con historial', async () => {
    const detalle = await obtenerExpediente(1)

    expect(detalle.id).toBe(1)
    expect(Array.isArray(detalle.historial)).toBe(true)
  })

  it('avanza al siguiente estado sin que el frontend lo decida', async () => {
    const antes = await obtenerExpediente(1)
    const despues = await avanzarEstado(1)

    expect(despues.estado).not.toBe(antes.estado)
    expect(despues.historial.length).toBe(antes.historial.length + 1)
  })

  it('marca un expediente como no localizado', async () => {
    const actualizado = await marcarNoLocalizado(3)

    expect(actualizado.estado).toBe('no_localizado')
  })

  it('busca por código escaneado', async () => {
    const encontrado = await buscarExpedientePorCodigo('EXP-2024-035')

    expect(encontrado?.id).toBe(1)
    expect(await buscarExpedientePorCodigo('NO-EXISTE')).toBeNull()
  })

  it('lista la jornada con expedienteId, cicloId y estadoActual', async () => {
    const jornada = await listarJornadaArchivo()

    expect(jornada.length).toBeGreaterThan(0)

    const conExpediente = jornada.find((fila) => fila.expedienteId)
    expect(conExpediente.expedienteId).toEqual(expect.any(String))
    expect(conExpediente.cicloId).toEqual(expect.any(String))
    expect(conExpediente.estadoActual).toEqual(expect.any(String))

    const sinExpediente = jornada.find((fila) => !fila.expedienteId)
    expect(sinExpediente.estadoActual).toBe('sin_ciclo')
  })

  it('filtra la jornada por subespecialidad', async () => {
    const jornada = await listarJornadaArchivo({ subespecialidadId: 1 })

    expect(jornada.length).toBeGreaterThan(0)
    expect(jornada.every((fila) => fila.subespecialidadId === 1)).toBe(true)
  })

  it('no inventa un número al crear el expediente de un paciente sin número asignado', async () => {
    // El paciente 7 no tiene numeroExpediente: el mock debe reproducir el
    // comportamiento del backend (fallar) en vez de fabricar uno.
    await expect(crearExpediente(7)).rejects.toMatchObject({ status: 400 })

    const detalle = await obtenerExpediente(7)
    expect(detalle.numeroExpediente).toBeNull()
    expect(detalle.expedienteNuevo).toBe(true)
  })
})

describe('archivoApi (catálogos y auxiliares en modo mock)', () => {
  it('mantiene listarClinicas como catálogo mock, sin confundirlo con subespecialidades', async () => {
    const clinicas = await listarClinicas()

    expect(clinicas.length).toBeGreaterThan(0)
    expect(clinicas[0]).toHaveProperty('nombre')
  })

  it('lista subespecialidades desde el mock de la función auxiliar', async () => {
    const subespecialidades = await listarSubespecialidades()

    expect(subespecialidades.length).toBeGreaterThan(0)
    expect(subespecialidades[0]).toHaveProperty('especialidadNombre')
  })

  it('busca paciente por número de expediente', async () => {
    const paciente = await buscarPacientePorExpediente('EXP-2024-035')

    expect(paciente?.numeroExpediente).toBe('EXP-2024-035')
    expect(await buscarPacientePorExpediente('NO-EXISTE')).toBeNull()
  })

  it('busca paciente por DPI', async () => {
    const paciente = await buscarPacientePorDpi('2456789010101')

    expect(paciente?.dpi).toBe('2456789010101')
    expect(await buscarPacientePorDpi('0000000000000')).toBeNull()
  })
})

describe('archivoApi (resumen y actas - SCRUM-96)', () => {
  it('consulta el resumen del día para la fecha indicada', async () => {
    const resumen = await obtenerResumenArchivo({ fecha: '2026-11-09' })

    expect(resumen.fecha).toBe('2026-11-09')
    expect(resumen).toHaveProperty('totalCiclos')
    expect(resumen).toHaveProperty('pendienteLocalizar')
    expect(resumen).toHaveProperty('expedientesNuevos')
  })

  it('devuelve el PDF del resumen como blob', async () => {
    const blob = await obtenerResumenArchivoPdf({ fecha: '2026-11-09' })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/pdf')
  })

  it('crea un acta de recepción con su detalle', async () => {
    const acta = await crearActaRecepcion({
      fecha: '2026-11-09',
      expedienteIds: ['3f1c-uuid-1'],
      observaciones: 'Entrega del día',
    })

    expect(acta.id).toBeGreaterThan(0)
    expect(acta.numeroActa).toMatch(/^ACT-\d{4}-\d{4}$/)
    expect(acta.totalExpedientes).toBe(1)

    const detalle = await obtenerActaRecepcion(acta.id)
    expect(detalle.id).toBe(acta.id)
  })

  it('devuelve 404 al consultar un acta inexistente', async () => {
    await expect(obtenerActaRecepcion(99999)).rejects.toMatchObject({ status: 404 })
  })

  it('devuelve el PDF del acta como blob', async () => {
    const blob = await obtenerActaRecepcionPdf(1)

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/pdf')
  })
})

// `numeroExpediente` es un identificador externo opaco: el frontend no lo
// genera, no lo reformatea y no valida un patrón. Los valores `EXP-*` son solo
// fixtures; estas pruebas no dependen de un formato como /^EXP-\d{6}$/.
describe('archivoApi — numeroExpediente como identificador opaco', () => {
  it('conserva EXP-2024-035 exactamente', async () => {
    const encontrado = await buscarExpedientePorCodigo('EXP-2024-035')

    expect(encontrado?.numeroExpediente).toBe('EXP-2024-035')
  })

  it('conserva otro formato distinto (EXP-2023-8941) sin reinterpretarlo', async () => {
    const encontrado = await buscarExpedientePorCodigo('EXP-2023-8941')

    expect(encontrado?.numeroExpediente).toBe('EXP-2023-8941')
  })

  it('no transforma el valor recibido', async () => {
    const recibido = 'EXP-2023-8941'
    const encontrado = await buscarExpedientePorCodigo(recibido)

    expect(encontrado?.numeroExpediente).toBe(recibido)
    expect(encontrado?.numeroExpediente).toHaveLength(recibido.length)
  })

  it('una búsqueda con código alterado no produce falso positivo', async () => {
    // Sin guiones, con espacios o en minúsculas: el endpoint real no normaliza.
    expect(await buscarExpedientePorCodigo('EXP2024035')).toBeNull()
    expect(await buscarExpedientePorCodigo('EXP 2024 035')).toBeNull()
    expect(await buscarExpedientePorCodigo('exp-2024-035')).toBeNull()
    // El trim del input sí se conserva.
    expect(await buscarExpedientePorCodigo('  EXP-2024-035  ')).not.toBeNull()
  })

  it('crearExpedienteMock no genera un numeroExpediente artificial', async () => {
    await expect(crearExpediente(7)).rejects.toMatchObject({ status: 400 })

    const detalle = await obtenerExpediente(7)
    expect(detalle.numeroExpediente).toBeNull()
  })
})
