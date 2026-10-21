import client from '@/shared/api/client'
import { hoyIso } from '@/shared/utils/fecha'

// En modo test siempre se usa el mock; en ejecución depende de VITE_USE_MOCK.
const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'
export const ES_MODO_MOCK = USE_MOCK

const MAXIMO_POR_DEFECTO = 100
const CLINICAS_VISIBLES = 5
const ESTADOS_EN_CLINICA = new Set(['en_clinica', 'llamado', 'no_asistio', 'atendido'])

const NOMBRES_ESTADO = {
  registrado: 'Registrado',
  recibido: 'Recibido',
  en_clinica: 'En clínica',
  llamado: 'Llamado',
  no_asistio: 'No asistió',
  atendido: 'Atendido',
  devuelto: 'Devuelto',
  archivado: 'Archivado',
}

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

// Reintenta una lectura una vez ante un 5xx transitorio (p. ej. conexión
// inactiva de Postgres que Hikari descarta al validar).
async function leerConReintento(url, config) {
  try {
    return await client.get(url, config)
  } catch (error) {
    if ((error?.status ?? 0) < 500) throw error
    await new Promise((resolver) => setTimeout(resolver, 350))
    return client.get(url, config)
  }
}

export const ETAPAS_SEGUIMIENTO = [
  { id: 'registrado', nombre: 'Registrado' },
  { id: 'recibido', nombre: 'Recibido' },
  { id: 'en_clinica', nombre: 'En clínica' },
  { id: 'devuelto', nombre: 'Devuelto' },
  { id: 'archivo', nombre: 'Archivo' },
]

// Etapa que debe tener el turno para poder aplicar la etapa seleccionada.
export const ETAPA_PREVIA = {
  recibido: 'registrado',
  en_clinica: 'recibido',
  devuelto: 'en_clinica',
  archivo: 'devuelto',
}

// Tipos de registro excluyentes. Se muestran con un brillo especial en el libro.
export const TIPOS_REGISTRO = [
  { id: 'presentacion', nombre: 'Presentación', icono: 'gavel' },
  { id: 'privado_libertad', nombre: 'Privado de libertad', icono: 'lock' },
]

const TIPOS_VALIDOS = new Set(TIPOS_REGISTRO.map((tipo) => tipo.id))

// Correlativos disponibles por especialidad. `maximo` es el último número que
// puede registrarse en la jornada. Se usa solo como semilla del mock.
export const ESPECIALIDADES_SEGUIMIENTO = [
  { id: 'MI', codigo: 'MI', nombre: 'Medicina Interna', maximo: 100 },
  { id: 'ONC', codigo: 'ONC', nombre: 'Oncología', maximo: 14 },
  { id: 'NEU', codigo: 'NEU', nombre: 'Neurología', maximo: 14 },
  { id: 'NEF', codigo: 'NEF', nombre: 'Nefrología', maximo: 14 },
  { id: 'END', codigo: 'END', nombre: 'Endocrinología', maximo: 14 },
  { id: 'INF', codigo: 'INF', nombre: 'Infectología', maximo: 14 },
  { id: 'REU', codigo: 'REU', nombre: 'Reumatología', maximo: 14 },
  { id: 'DER', codigo: 'DER', nombre: 'Dermatología', maximo: 14 },
  { id: 'NEM', codigo: 'NEM', nombre: 'Neumología', maximo: 14 },
  { id: 'DOL', codigo: 'DOL', nombre: 'Clínica del Dolor', maximo: 13 },
  { id: 'GAS', codigo: 'GAS', nombre: 'Gastroenterología', maximo: 12 },
  { id: 'NUT', codigo: 'NUT', nombre: 'Nutrición', maximo: 12 },
  { id: 'MUJ', codigo: 'MUJ', nombre: 'Clínica de la Mujer', maximo: 12 },
]

export const CLINICAS_SEGUIMIENTO = [1, 2, 3, 4, 5].map((id) => ({
  id,
  nombre: `Clínica ${id}`,
}))

const LIMITES_SEMILLA = [38, 4, 2, 3, 7, 4, 2, 3, 0, 5, 7, 2, 8]

let turnos = new Map()
// El backend aún no persiste el tipo de registro: se conserva durante la sesión.
const tiposPorTurno = new Map()

const esperar = (ms = 60) => new Promise((resolver) => setTimeout(resolver, ms))

const crearError = (mensaje, status) => {
  const error = new Error(mensaje)
  error.status = status
  return error
}

const copiarTurno = (turno) => ({ ...turno })

const clave = (codigo, numero) => `${codigo}-${numero}`

function etapaPorOrden(orden) {
  if (orden <= 3) return 'archivo'
  if (orden <= 6) return 'devuelto'
  if (orden <= 12) return 'en_clinica'
  if (orden <= 17) return 'recibido'
  return 'registrado'
}

function sembrarTurnos() {
  turnos = new Map()
  tiposPorTurno.clear()
  ESPECIALIDADES_SEGUIMIENTO.forEach((especialidad, indice) => {
    const limite = indice === 0 ? 38 : LIMITES_SEMILLA[indice] || 0
    for (let numero = 1; numero <= limite; numero += 1) {
      const orden = indice === 0 ? numero : ((numero + indice * 3) % 22) + 1
      const etapa = etapaPorOrden(orden)
      const conClinica = ['en_clinica', 'devuelto', 'archivo'].includes(etapa)
      const tipoRegistro =
        (numero + indice * 2) % 9 === 0
          ? 'presentacion'
          : (numero + indice * 3) % 14 === 0
            ? 'privado_libertad'
            : null
      turnos.set(clave(especialidad.codigo, numero), {
        id: clave(especialidad.codigo, numero),
        codigo: especialidad.codigo,
        numero,
        etapa,
        estadoBackend: null,
        clinicaId: conClinica ? 1 + ((numero + indice) % 5) : null,
        clinicaNombre: conClinica ? `Clínica ${1 + ((numero + indice) % 5)}` : null,
        tipoRegistro,
        registradoEn: new Date().toISOString(),
      })
    }
  })
}

sembrarTurnos()

const buscarEspecialidad = (codigo) =>
  ESPECIALIDADES_SEGUIMIENTO.find((especialidad) => especialidad.codigo === codigo)

export function nombreEtapa(id) {
  return ETAPAS_SEGUIMIENTO.find((etapa) => etapa.id === id)?.nombre ?? 'Sin registrar'
}

export function nombreEstadoBackend(id) {
  return NOMBRES_ESTADO[id] ?? 'Sin registrar'
}

export function nombreTipoRegistro(id) {
  return TIPOS_REGISTRO.find((tipo) => tipo.id === id)?.nombre ?? 'Sin tipo'
}

function normalizarTipoRegistro(tipoRegistro) {
  if (tipoRegistro == null || tipoRegistro === '') return null
  if (!TIPOS_VALIDOS.has(tipoRegistro)) {
    throw crearError('Tipo de registro inválido', 422)
  }
  return tipoRegistro
}

/** Traduce los estados del backend a las cinco etapas visuales de Enfermería. */
export function etapaDesdeEstado(estado) {
  switch (estado) {
    case 'registrado':
      return 'registrado'
    case 'recibido':
      return 'recibido'
    case 'en_clinica':
    case 'llamado':
    case 'no_asistio':
    case 'atendido':
      return 'en_clinica'
    case 'devuelto':
      return 'devuelto'
    case 'archivado':
    case 'archivo':
      return 'archivo'
    default:
      return 'registrado'
  }
}

function normalizarTurno(turno, especialidad = {}) {
  const numero = turno.correlativoEspecialidad ?? turno.numero
  const codigoBase =
    turno.abreviatura ?? especialidad.codigo ?? String(turno.codigo ?? 'T').replace(/\d+$/, '')
  const codigo = codigoBase || 'T'

  return {
    id: turno.id,
    especialidadId: turno.especialidadId ?? null,
    codigo,
    numero,
    numeroGeneral: turno.numeroGeneral ?? null,
    etapa: etapaDesdeEstado(turno.estado ?? turno.etapa),
    estadoBackend: turno.estado ?? null,
    clinicaId: turno.espacioFisicoId ?? turno.clinicaId ?? null,
    clinicaNumero: turno.espacioFisicoNumero ?? null,
    clinicaNombre:
      turno.espacioFisicoNombre ??
      (turno.espacioFisicoNumero ? `Clínica ${turno.espacioFisicoNumero}` : null),
    tipoRegistro: turno.tipoRegistro ?? tiposPorTurno.get(turno.id) ?? null,
    registradoEn: turno.registradoEn ?? turno.creadoEn ?? null,
  }
}

function normalizarEspecialidad(especialidad) {
  const maximo = Math.min(
    Math.max(Number(especialidad.correlativoMax) || MAXIMO_POR_DEFECTO, 1),
    MAXIMO_POR_DEFECTO,
  )
  const codigo = especialidad.abreviatura ?? especialidad.codigo ?? `E${especialidad.id}`

  return {
    id: especialidad.id ?? codigo,
    codigo,
    nombre: especialidad.nombre,
    maximo,
    correlativoMax: especialidad.correlativoMax ?? null,
    turnos: (especialidad.turnos ?? []).map((turno) => normalizarTurno(turno, { codigo })),
  }
}

// Libro completo: especialidades activas del día con sus correlativos ya
// registrados. En modo real se combinan el libro de turnos y las especialidades
// con horario activo para la estación/fecha.
export async function obtenerLibro(estacionId, fecha = hoyIso()) {
  if (USE_MOCK) {
    await esperar()
    return {
      estacionId,
      fecha,
      especialidades: ESPECIALIDADES_SEGUIMIENTO.map((especialidad) => ({
        id: especialidad.id,
        codigo: especialidad.codigo,
        nombre: especialidad.nombre,
        maximo: especialidad.maximo,
        correlativoMax: especialidad.maximo,
        turnos: [...turnos.values()]
          .filter((turno) => turno.codigo === especialidad.codigo)
          .sort((a, b) => a.numero - b.numero)
          .map(copiarTurno),
      })),
      totalRegistrados: turnos.size,
    }
  }

  if (!estacionId) {
    throw new Error('Seleccione una estación de enfermería para cargar el libro.')
  }

  const [libroRespuesta, activasRespuesta] = await Promise.all([
    leerConReintento('/turnos-estacion/libro', { params: { estacionId, fecha } }),
    leerConReintento(`/estaciones/${estacionId}/especialidades-activas`, {
      params: { fecha },
    }).catch(() => null),
  ])

  const libro = desenvolver(libroRespuesta) ?? {}
  const activas = desenvolver(activasRespuesta)
  const idsActivas = new Set((Array.isArray(activas) ? activas : []).map((item) => item.id))

  let especialidades = Array.isArray(libro.especialidades) ? libro.especialidades : []
  if (idsActivas.size > 0) {
    especialidades = especialidades.filter((especialidad) => idsActivas.has(especialidad.id))
  }

  const normalizadas = especialidades.map(normalizarEspecialidad)

  return {
    estacionId: libro.estacionId ?? estacionId,
    estacionNombre: libro.estacionNombre ?? null,
    fecha: libro.fecha ?? fecha,
    resumen: libro.resumen ?? {},
    especialidades: normalizadas,
    totalRegistrados: normalizadas.reduce((total, item) => total + item.turnos.length, 0),
  }
}

export async function listarClinicas() {
  if (USE_MOCK) {
    await esperar()
    return CLINICAS_SEGUIMIENTO.slice(0, CLINICAS_VISIBLES).map((clinica) => ({
      ...clinica,
      expedientesEnClinica: [...turnos.values()].filter(
        (turno) => turno.etapa === 'en_clinica' && turno.clinicaId === clinica.id,
      ).length,
    }))
  }

  const espaciosFisicos = desenvolver(await leerConReintento('/espacios-fisicos'))
  return (Array.isArray(espaciosFisicos) ? espaciosFisicos : [])
    .slice(0, CLINICAS_VISIBLES)
    .map((espacio) => ({
      id: espacio.id,
      numero: espacio.numero,
      nivel: espacio.nivel,
      nombre: espacio.nombre ?? `Clínica ${espacio.numero}`,
      expedientesEnClinica: 0,
    }))
}

// Registra el siguiente correlativo de la especialidad. En modo real el backend
// asigna el número; el `numero` de la casilla es solo una referencia visual.
export async function registrarTurno({
  codigo,
  numero,
  tipoRegistro,
  estacionId,
  especialidadId,
  fecha = hoyIso(),
} = {}) {
  if (USE_MOCK) {
    await esperar()
    const especialidad = buscarEspecialidad(codigo)
    const correlativo = Number(numero)

    if (!especialidad) throw crearError('Especialidad no encontrada', 404)
    if (!Number.isInteger(correlativo) || correlativo < 1 || correlativo > especialidad.maximo) {
      throw crearError('Correlativo fuera de rango', 422)
    }
    if (turnos.has(clave(codigo, correlativo))) {
      throw crearError('El correlativo ya está registrado', 409)
    }

    const turno = {
      id: clave(codigo, correlativo),
      especialidadId: codigo,
      codigo,
      numero: correlativo,
      etapa: 'registrado',
      estadoBackend: 'registrado',
      clinicaId: null,
      clinicaNombre: null,
      tipoRegistro: normalizarTipoRegistro(tipoRegistro),
      registradoEn: new Date().toISOString(),
    }
    turnos.set(turno.id, turno)
    return copiarTurno(turno)
  }

  if (!estacionId || especialidadId == null) {
    throw crearError('Seleccione una estación y una especialidad', 422)
  }

  const tipo = normalizarTipoRegistro(tipoRegistro)
  const respuesta = await client.post('/turnos-estacion', {
    estacionId,
    especialidadId,
    fecha,
    tipoRegistro: tipo,
  })
  const turno = {
    ...normalizarTurno(desenvolver(respuesta), { codigo }),
    especialidadId,
    tipoRegistro: tipo,
  }
  if (tipo) tiposPorTurno.set(turno.id, tipo)
  return turno
}

function rutaSiguiente(estadoBackend, clinicaId, observacion) {
  switch (estadoBackend) {
    case 'registrado':
      return { ruta: 'recibir', cuerpo: {} }
    case 'recibido':
      if (!clinicaId) {
        throw crearError('Seleccione una clínica para repartir el expediente', 422)
      }
      return { ruta: 'asignar-clinica', cuerpo: { espacioFisicoId: clinicaId } }
    case 'en_clinica':
    case 'llamado':
    case 'no_asistio':
    case 'atendido':
      return {
        ruta: 'devolver',
        cuerpo: { observacion: observacion ?? 'Devuelto desde estación de enfermería' },
      }
    case 'devuelto':
      return {
        ruta: 'archivar',
        cuerpo: { observacion: observacion ?? 'Archivado desde estación de enfermería' },
      }
    default:
      throw crearError('El turno ya completó el flujo', 409)
  }
}

// Avanza el turno según el estado real del backend. La UI mantiene cinco etapas;
// los estados intermedios del médico se agrupan en «En clínica».
export async function avanzarTurno(id, { clinicaId, estadoBackend, observacion } = {}) {
  if (USE_MOCK) {
    await esperar()
    const turno = turnos.get(id)
    if (!turno) throw crearError('Turno no encontrado', 404)

    const indice = ETAPAS_SEGUIMIENTO.findIndex((etapa) => etapa.id === turno.etapa)
    const siguiente = ETAPAS_SEGUIMIENTO[indice + 1]
    if (!siguiente) throw crearError('El turno ya completó el flujo', 409)

    if (turno.etapa === 'recibido') {
      const clinica = Number(clinicaId)
      if (!CLINICAS_SEGUIMIENTO.some((item) => item.id === clinica)) {
        throw crearError('Seleccione una clínica para repartir el expediente', 422)
      }
      turno.clinicaId = clinica
      turno.clinicaNombre = `Clínica ${clinica}`
    }

    turno.etapa = siguiente.id
    turno.estadoBackend = siguiente.id === 'archivo' ? 'archivado' : siguiente.id
    turno.actualizadoEn = new Date().toISOString()
    return copiarTurno(turno)
  }

  const { ruta, cuerpo } = rutaSiguiente(estadoBackend, clinicaId, observacion)
  const respuesta = await client.post(`/turnos-estacion/${id}/${ruta}`, cuerpo)
  return normalizarTurno(desenvolver(respuesta))
}

// Historial de estados. En modo real viene de la bitácora del backend.
export async function obtenerHistorialTurno(id) {
  if (USE_MOCK) {
    await esperar()
    const turno = turnos.get(id)
    if (!turno) throw crearError('Turno no encontrado', 404)
    const secuencia = ['registrado', 'recibido', 'en_clinica', 'devuelto', 'archivo']
    const indice = Math.max(0, secuencia.indexOf(turno.etapa))
    return secuencia.slice(0, indice + 1).map((etapa, posicion) => ({
      id: posicion + 1,
      estadoAnterior: posicion > 0 ? secuencia[posicion - 1] : null,
      estadoNuevo: etapa === 'archivo' ? 'archivado' : etapa,
      usuarioNombre: 'Sistema',
      medicoNombre: null,
      observacion: posicion === 0 ? 'Turno registrado' : 'Cambio de estado',
      fechaMovimiento: new Date(Date.now() - (indice - posicion) * 60000).toISOString(),
    }))
  }

  const detalle = desenvolver(await leerConReintento(`/turnos-estacion/${id}`))
  return (detalle?.movimientos ?? []).map((movimiento) => ({
    id: movimiento.id,
    estadoAnterior: movimiento.estadoAnterior,
    estadoNuevo: movimiento.estadoNuevo,
    usuarioNombre: movimiento.usuarioNombre,
    medicoNombre: movimiento.medicoNombre,
    observacion: movimiento.observacion,
    fechaMovimiento: movimiento.fechaMovimiento,
  }))
}

// Revierte el turno al estado anterior. El backend no permite devueltos/archivados.
export async function revertirTurno(id) {
  if (USE_MOCK) {
    await esperar()
    const turno = turnos.get(id)
    if (!turno) throw crearError('Turno no encontrado', 404)
    const anteriorPorEtapa = {
      recibido: 'registrado',
      en_clinica: 'recibido',
      devuelto: 'en_clinica',
      archivo: 'devuelto',
    }
    const anterior = anteriorPorEtapa[turno.etapa]
    if (!anterior) throw crearError('El turno no se puede revertir en este estado', 409)
    turno.etapa = anterior
    turno.estadoBackend = anterior
    if (anterior === 'registrado' || anterior === 'recibido') {
      turno.clinicaId = null
      turno.clinicaNombre = null
    }
    turno.actualizadoEn = new Date().toISOString()
    return copiarTurno(turno)
  }

  const respuesta = await client.post(`/turnos-estacion/${id}/revertir`)
  return normalizarTurno(desenvolver(respuesta))
}

/** Cuenta los expedientes que permanecen en cada clínica para el libro cargado. */
export function contarExpedientesEnClinica(clinicas, especialidades) {
  const enClinica = especialidades
    .flatMap((especialidad) => especialidad.turnos)
    .filter((turno) =>
      turno.estadoBackend
        ? ESTADOS_EN_CLINICA.has(turno.estadoBackend)
        : turno.etapa === 'en_clinica',
    )

  return clinicas.map((clinica) => ({
    ...clinica,
    expedientesEnClinica: enClinica.filter((turno) => turno.clinicaId === clinica.id).length,
  }))
}

// Solo para pruebas: deja el estado mutable como al cargar la página.
export function reiniciarSeguimientoMock() {
  sembrarTurnos()
}
