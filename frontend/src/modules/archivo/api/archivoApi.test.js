import { describe, expect, it } from 'vitest'
import {
  avanzarEstado,
  buscarExpedientePorCodigo,
  buscarPacientePorDpi,
  buscarPacientePorExpediente,
  crearExpediente,
  listarClinicas,
  listarExpedientes,
  listarMedicos,
  listarSubespecialidades,
  marcarNoLocalizado,
  obtenerExpediente,
} from './archivoApi'

describe('archivoApi (mock)', () => {
  it('lista expedientes con la forma esperada', async () => {
    const lista = await listarExpedientes()

    expect(lista.length).toBeGreaterThan(0)
    expect(lista[0]).toHaveProperty('pacienteNombre')
    expect(lista[0]).toHaveProperty('estado')
    expect(lista[0]).toHaveProperty('historial')
  })

  it('filtra por fecha, clínica y médico', async () => {
    const [primero] = await listarExpedientes()

    const porFecha = await listarExpedientes({ fecha: primero.fechaCita })
    expect(porFecha.every((expediente) => expediente.fechaCita === primero.fechaCita)).toBe(true)

    const porClinica = await listarExpedientes({ clinicaId: primero.clinicaId })
    expect(porClinica.every((expediente) => expediente.clinicaId === primero.clinicaId)).toBe(true)

    const porMedico = await listarExpedientes({ medicoId: primero.medicoId })
    expect(porMedico.every((expediente) => expediente.medicoId === primero.medicoId)).toBe(true)
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
    const encontrado = await buscarExpedientePorCodigo('EXP-004521')

    expect(encontrado?.id).toBe(1)
    expect(await buscarExpedientePorCodigo('NO-EXISTE')).toBeNull()
  })

  it('crea el expediente físico de un paciente nuevo', async () => {
    const creado = await crearExpediente(7)

    expect(creado.expedienteNuevo).toBe(false)
    expect(creado.numeroExpediente).toBeTruthy()
    expect(creado.estado).toBe('pendiente_localizar')

    const detalle = await obtenerExpediente(7)
    expect(detalle.numeroExpediente).toBe(creado.numeroExpediente)
  })
})

describe('archivoApi (catálogos y auxiliares en modo mock)', () => {
  it('mantiene listarClinicas como catálogo mock, sin confundirlo con subespecialidades', async () => {
    const clinicas = await listarClinicas()

    expect(clinicas.length).toBeGreaterThan(0)
    expect(clinicas[0]).toHaveProperty('nombre')
  })

  it('lista médicos desde el mock', async () => {
    const medicos = await listarMedicos()

    expect(medicos.length).toBeGreaterThan(0)
    expect(medicos[0]).toHaveProperty('nombre')
  })

  it('lista subespecialidades desde el mock de la función auxiliar', async () => {
    const subespecialidades = await listarSubespecialidades()

    expect(subespecialidades.length).toBeGreaterThan(0)
    expect(subespecialidades[0]).toHaveProperty('especialidadNombre')
  })

  it('busca paciente por número de expediente', async () => {
    const paciente = await buscarPacientePorExpediente('EXP-004521')

    expect(paciente?.numeroExpediente).toBe('EXP-004521')
    expect(await buscarPacientePorExpediente('NO-EXISTE')).toBeNull()
  })

  it('busca paciente por DPI', async () => {
    const paciente = await buscarPacientePorDpi('2456789010101')

    expect(paciente?.dpi).toBe('2456789010101')
    expect(await buscarPacientePorDpi('0000000000000')).toBeNull()
  })
})
