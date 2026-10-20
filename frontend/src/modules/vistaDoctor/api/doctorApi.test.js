import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buscarMedicoPorColegiado,
  buscarPacientePorExpediente,
  cerrarJornada,
  jornadaCerradaCorrespondeA,
  listarTurnos,
  llamarTurno,
  marcarAtendido,
  marcarNoResponde,
  obtenerCola,
  obtenerJornadaCerrada,
  reabrirJornada,
  registrarExpediente,
  resolverClinicaPorQr,
} from './doctorApi'
import { COOLDOWN_MS, calcularEstadisticas } from './doctorAcciones'
import { normalizarTurno } from './doctorMappers'
import { CLINICAS_MOCK, COLEGIADOS_DEMO, MEDICOS_MOCK } from './mockData'

const CLINICA_1 = CLINICAS_MOCK[0]
const CLINICA_2 = CLINICAS_MOCK[1]
const CLINICA_SIN_ASIGNACION = CLINICAS_MOCK[2]
const MEDICO_1 = MEDICOS_MOCK[0]
const MEDICO_2 = MEDICOS_MOCK[1]
const BASE = { asignacionId: 101, medicoId: MEDICO_1.id }
const AHORA = 1_800_000_000_000

function buscarTurno(turnos, id) {
  return turnos.find((turno) => turno.id === id)
}

describe('doctorApi mock', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('busca un médico activo por colegiado numérico', async () => {
    const medico = await buscarMedicoPorColegiado(' 1001 ')

    expect(medico).toMatchObject({
      nombre: 'Dra. Ana Lucía Demo',
      colegiado: '1001',
      activo: true,
    })
  })

  it('acepta el prefijo COL- anterior dentro del adaptador', async () => {
    const medico = await buscarMedicoPorColegiado('COL-1001')

    expect(medico.colegiado).toBe('1001')
  })

  it('rechaza colegiados inválidos, inexistentes e inactivos', async () => {
    await expect(buscarMedicoPorColegiado('1')).rejects.toMatchObject({
      code: 'COLEGIADO_INVALIDO',
    })
    await expect(buscarMedicoPorColegiado('10a1')).rejects.toMatchObject({
      code: 'COLEGIADO_INVALIDO',
    })
    await expect(buscarMedicoPorColegiado(COLEGIADOS_DEMO.inexistente)).rejects.toMatchObject({
      code: 'MEDICO_NO_ENCONTRADO',
      status: 404,
    })
    await expect(buscarMedicoPorColegiado(COLEGIADOS_DEMO.inactivo)).rejects.toMatchObject({
      code: 'MEDICO_INACTIVO',
      status: 403,
    })
  })

  it('resuelve el código corto y conserva compatibilidad con UUID', async () => {
    const porCodigo = await resolverClinicaPorQr('202-11')
    const porUuid = await resolverClinicaPorQr(CLINICA_1.espacioFisicoId)

    expect(porCodigo.clinica).toMatchObject({
      codigo: '202-11',
      numero: '5',
      espacioFisicoId: CLINICA_2.espacioFisicoId,
    })
    expect(porCodigo.asignacion.id).toBe(202)
    expect(porUuid.clinica.codigo).toBe('101-11')
    expect(porUuid.asignacion.id).toBe(101)
  })

  it('distingue QR ausente, mal formado y desconocido', async () => {
    await expect(resolverClinicaPorQr('')).rejects.toMatchObject({
      code: 'CLINICA_REQUERIDA',
    })
    await expect(resolverClinicaPorQr('clinica-3')).rejects.toMatchObject({
      code: 'CLINICA_INVALIDA',
    })
    await expect(resolverClinicaPorQr('999-99')).rejects.toMatchObject({
      code: 'CLINICA_NO_DISPONIBLE',
    })
    await expect(
      resolverClinicaPorQr('99999999-9999-4999-8999-999999999999'),
    ).rejects.toMatchObject({ code: 'CLINICA_NO_DISPONIBLE' })
  })

  it('rechaza una clínica sin asignación para hoy', async () => {
    await expect(resolverClinicaPorQr(CLINICA_SIN_ASIGNACION.codigo)).rejects.toMatchObject({
      code: 'SIN_ASIGNACION',
    })
  })

  it('lista la cola por clínica, con correlativos y orden explícito', async () => {
    const turnosClinica1 = await listarTurnos({ ...BASE, medicoId: MEDICO_1.id })
    const turnosClinica2 = await listarTurnos({
      asignacionId: 202,
      medicoId: MEDICO_1.id,
    })
    const numerico = normalizarTurno({
      id: 99,
      numeroTurno: 12,
      estado: 'en_espera',
    })

    expect(turnosClinica1).toHaveLength(6)
    expect(turnosClinica2).toHaveLength(3)
    expect(turnosClinica1.map((turno) => turno.correlativo)).toEqual([
      'MI-1',
      'MI-2',
      'MI-3',
      'MI-4',
      'MI-5',
      'MI-6',
    ])
    expect(turnosClinica1.map((turno) => turno.orden)).toEqual([1, 2, 3, 4, 5, 6])
    expect(turnosClinica2.map((turno) => turno.correlativo)).toEqual([
      'REUMA-1',
      'REUMA-2',
      'REUMA-3',
    ])
    expect(numerico.correlativo).toBe('12')
    expect(turnosClinica1.map((turno) => turno.pacienteNombre)).toContain('Rosa María Demo')
    expect(turnosClinica1.map((turno) => turno.pacienteNombre)).not.toContain(
      'Sofía Valentina Demo',
    )
  })

  it('calcula las estadísticas con grupos disjuntos', async () => {
    const turnos = await listarTurnos(BASE)

    expect(calcularEstadisticas(turnos)).toEqual({
      pendientes: 1,
      enEspera: 4,
      atendidos: 1,
      total: 6,
    })
  })

  it('consulta expedientes ficticios y valida su existencia', async () => {
    const paciente = await buscarPacientePorExpediente(' 0000000006 ')

    expect(paciente).toEqual({
      expediente: '0000000006',
      pacienteNombre: 'Carlos Eduardo Demo',
    })
    expect(await buscarPacientePorExpediente('0000000001')).toMatchObject({
      pacienteNombre: 'Rosa María Demo',
    })
    await expect(buscarPacientePorExpediente('1')).rejects.toMatchObject({
      code: 'EXPEDIENTE_NO_ENCONTRADO',
    })
    await expect(buscarPacientePorExpediente('1234567890')).rejects.toMatchObject({
      code: 'EXPEDIENTE_NO_ENCONTRADO',
    })
    await expect(buscarPacientePorExpediente('9999999999')).rejects.toMatchObject({
      code: 'EXPEDIENTE_NO_ENCONTRADO',
    })
    for (const invalido of ['', '12A45', '123-456', '12.3', '-1', '12345678901']) {
      await expect(buscarPacientePorExpediente(invalido)).rejects.toMatchObject({
        code: 'EXPEDIENTE_INVALIDO',
      })
    }
  })

  it('registra el expediente del turno y lo persiste', async () => {
    const turnosIniciales = await listarTurnos(BASE)
    expect(buscarTurno(turnosIniciales, 1006).identificado).toBe(false)
    expect(buscarTurno(turnosIniciales, 1006).expediente).toBe('')

    const resultado = await registrarExpediente({
      ...BASE,
      turnoId: 1006,
      expediente: ' 0000000006 ',
    })

    expect(resultado.turno).toMatchObject({
      identificado: true,
      expediente: '0000000006',
      pacienteNombre: 'Carlos Eduardo Demo',
    })
    expect(buscarTurno(resultado.turnos, 1006).expediente).toBe('0000000006')
    expect(buscarTurno(await listarTurnos(BASE), 1006).expediente).toBe('0000000006')
  })

  it('bloquea expedientes de otro paciente y turnos atendidos', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(AHORA)
    await listarTurnos(BASE)

    await expect(
      registrarExpediente({ ...BASE, turnoId: 1001, expediente: '0000000999' }),
    ).rejects.toMatchObject({ code: 'EXPEDIENTE_DE_OTRO_PACIENTE' })

    await llamarTurno({ ...BASE, turnoId: 1001 })
    await registrarExpediente({ ...BASE, turnoId: 1001, expediente: '0000000001' })
    await marcarAtendido({ ...BASE, turnoId: 1001, medico: MEDICO_1 })

    await expect(
      registrarExpediente({ ...BASE, turnoId: 1001, expediente: '0000000001' }),
    ).rejects.toMatchObject({ code: 'TURNO_ATENDIDO' })
  })

  it('exige expediente validado para atender y usa el expediente en la atención', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(AHORA)
    await listarTurnos(BASE)
    await llamarTurno({ ...BASE, turnoId: 1001 })

    await expect(
      marcarAtendido({ ...BASE, turnoId: 1001, medico: MEDICO_1 }),
    ).rejects.toMatchObject({ code: 'EXPEDIENTE_REQUERIDO' })

    await registrarExpediente({ ...BASE, turnoId: 1001, expediente: '0000000001' })
    await marcarAtendido({ ...BASE, turnoId: 1001, medico: MEDICO_1 })

    cerrarJornada({
      medico: MEDICO_1,
      clinica: CLINICA_1,
      asignacion: CLINICA_1.asignacion,
    })

    const atencion = obtenerJornadaCerrada().atenciones.find(
      (registro) => registro.turnoId === 1001,
    )
    expect(atencion).toMatchObject({
      paciente: 'Rosa María Demo',
      expediente: '0000000001',
    })
  })

  it('aplica un solo turno activo, orden de cola y cooldown', async () => {
    const reloj = vi.spyOn(Date, 'now').mockReturnValue(AHORA)
    await listarTurnos(BASE)

    const primerLlamado = await llamarTurno({ ...BASE, turnoId: 1001 })
    expect(buscarTurno(primerLlamado.turnos, 1001)).toMatchObject({
      estado: 'llamado',
      intentosLlamado: 1,
    })
    expect(primerLlamado.ultimoLlamadoEn).toBe(AHORA)

    await expect(llamarTurno({ ...BASE, turnoId: 1002 })).rejects.toMatchObject({
      code: 'TURNO_ACTIVO',
    })
    await expect(llamarTurno({ ...BASE, turnoId: 1001 })).rejects.toMatchObject({
      code: 'COOLDOWN',
    })

    reloj.mockReturnValue(AHORA + COOLDOWN_MS)
    const rellamado = await llamarTurno({ ...BASE, turnoId: 1001 })
    expect(buscarTurno(rellamado.turnos, 1001).intentosLlamado).toBe(2)

    await registrarExpediente({ ...BASE, turnoId: 1001, expediente: '0000000001' })
    const atendido = await marcarAtendido({
      ...BASE,
      turnoId: 1001,
      medico: MEDICO_1,
    })
    expect(buscarTurno(atendido.turnos, 1001).estado).toBe('atendido')

    await expect(llamarTurno({ ...BASE, turnoId: 1002 })).rejects.toMatchObject({
      code: 'COOLDOWN',
    })

    reloj.mockReturnValue(AHORA + COOLDOWN_MS * 2)
    const siguiente = await llamarTurno({ ...BASE, turnoId: 1002 })
    expect(buscarTurno(siguiente.turnos, 1002)).toMatchObject({
      estado: 'llamado',
      intentosLlamado: 1,
    })

    const sinRespuesta = await marcarNoResponde({ ...BASE, turnoId: 1002 })
    expect(buscarTurno(sinRespuesta.turnos, 1002).estado).toBe('no_responde')

    expect(calcularEstadisticas(sinRespuesta.turnos)).toEqual({
      pendientes: 2,
      enEspera: 2,
      atendidos: 2,
      total: 6,
    })
  })

  it('libera la cola después de marcar no respondió', async () => {
    const reloj = vi.spyOn(Date, 'now').mockReturnValue(AHORA)
    await listarTurnos(BASE)
    await llamarTurno({ ...BASE, turnoId: 1001 })
    await marcarNoResponde({ ...BASE, turnoId: 1001 })

    await expect(llamarTurno({ ...BASE, turnoId: 1002 })).rejects.toMatchObject({
      code: 'COOLDOWN',
    })

    reloj.mockReturnValue(AHORA + COOLDOWN_MS)
    const siguiente = await llamarTurno({ ...BASE, turnoId: 1002 })
    expect(buscarTurno(siguiente.turnos, 1002).estado).toBe('llamado')
  })

  it('rechaza llamados fuera de orden y transiciones inválidas', async () => {
    await listarTurnos(BASE)

    await expect(llamarTurno({ ...BASE, turnoId: 1002 })).rejects.toMatchObject({
      code: 'ORDEN_COLA',
    })
    await expect(marcarNoResponde({ ...BASE, turnoId: 1001 })).rejects.toMatchObject({
      code: 'TRANSICION_INVALIDA',
    })
    await expect(
      marcarAtendido({ ...BASE, turnoId: 1003, medico: MEDICO_1 }),
    ).rejects.toMatchObject({ code: 'TRANSICION_INVALIDA' })
    await expect(marcarNoResponde({ ...BASE, turnoId: 1001 })).rejects.toMatchObject({
      code: 'TRANSICION_INVALIDA',
    })
  })

  it('rechaza acciones antes de cargar la jornada', async () => {
    await expect(marcarNoResponde({ ...BASE, turnoId: 1001 })).rejects.toMatchObject({
      code: 'SIN_JORNADA_ACTIVA',
    })
  })

  it('soporta lista vacía y error simulado', async () => {
    await expect(listarTurnos({ ...BASE, escenario: 'vacio' })).resolves.toEqual([])
    await expect(listarTurnos({ ...BASE, escenario: 'error' })).rejects.toMatchObject({
      code: 'ERROR_SIMULADO',
    })
  })

  it('propaga el error simulado en una acción', async () => {
    await listarTurnos(BASE)

    await expect(llamarTurno({ ...BASE, turnoId: 1001, escenario: 'error' })).rejects.toMatchObject(
      { code: 'ERROR_SIMULADO' },
    )
  })

  it('invalida jornadas antiguas sin exponer nombres ni expedientes', async () => {
    sessionStorage.setItem(
      'hro_jornada_operativa',
      JSON.stringify({
        version: 1,
        asignacionId: 101,
        medicoId: MEDICO_1.id,
        turnos: [
          {
            id: 1001,
            numeroTurno: 'MI-1',
            estado: 'en_espera',
            pacienteNombre: 'Nombre Antiguo',
            expediente: 'EXP-ANTIGUO',
            identificado: true,
          },
        ],
        atenciones: [],
        ultimoLlamadoEn: 123,
      }),
    )
    sessionStorage.setItem(
      'hro_jornada_cerrada',
      JSON.stringify({ version: 1, medico: MEDICO_1, clinica: CLINICA_1 }),
    )

    const turnos = await listarTurnos(BASE)
    expect(turnos[0]).toMatchObject({
      correlativo: 'MI-1',
      identificado: false,
    })
    expect((await obtenerCola(BASE)).ultimoLlamadoEn).toBe(0)
    expect(obtenerJornadaCerrada()).toBeNull()
  })

  it('persiste el estado operativo y permite cerrar y reabrir la jornada', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(AHORA)
    const turnosIniciales = await listarTurnos(BASE)
    expect(turnosIniciales.find((turno) => turno.id === 1001).identificado).toBe(false)

    await llamarTurno({ ...BASE, turnoId: 1001 })
    const cola = await obtenerCola(BASE)
    expect(cola.ultimoLlamadoEn).toBe(AHORA)
    expect(buscarTurno(cola.turnos, 1001).estado).toBe('llamado')

    const cerrada = cerrarJornada({
      medico: MEDICO_1,
      clinica: CLINICA_1,
      asignacion: CLINICA_1.asignacion,
    })

    expect(cerrada.turnos.find((turno) => turno.id === 1001).estado).toBe('llamado')
    expect(cerrada.ultimoLlamadoEn).toBe(AHORA)
    expect(obtenerJornadaCerrada()).not.toBeNull()
    expect(jornadaCerradaCorrespondeA(cerrada, MEDICO_1, CLINICA_1, CLINICA_1.asignacion)).toBe(
      true,
    )
    expect(jornadaCerradaCorrespondeA(cerrada, MEDICO_2, CLINICA_1, CLINICA_1.asignacion)).toBe(
      false,
    )

    const reabierta = reabrirJornada()
    expect(reabierta).not.toBeNull()
    expect(obtenerJornadaCerrada()).toBeNull()

    const colaReabierta = await obtenerCola(BASE)
    expect(buscarTurno(colaReabierta.turnos, 1001).estado).toBe('llamado')
    expect(colaReabierta.ultimoLlamadoEn).toBe(AHORA)
  })
})
