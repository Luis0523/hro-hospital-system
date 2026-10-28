import client from '@/shared/api/client'
import { hoyIso } from '@/shared/utils/fecha'
import { filtrarClinicasPorNivel } from '@/shared/utils/nivelClinicas'

// En modo test siempre se usa el mock; en ejecución depende de VITE_USE_MOCK.
const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'
export const ES_MODO_MOCK = USE_MOCK

const MAXIMO_POR_DEFECTO = 18
const ESTADOS_EN_CLINICA = new Set(['en_clinica', 'llamado', 'no_asistio', 'atendido'])

const NOMBRES_ESTADO = {
  registrado: 'Registrado',
  recibido: 'Recibido',
  en_clinica: 'Recibir/Repartir',
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
  { id: 'en_clinica', nombre: 'Recibir/Repartir' },
  { id: 'devuelto', nombre: 'Devuelto' },
  { id: 'archivo', nombre: 'Archivo' },
]

// El backend conserva el estado interno `recibido`, pero la operación lo une
// con `en_clinica`: al pasar de Registrado a En clínica se recibe y se asigna
// la clínica en una sola acción.
export const ETAPA_PREVIA = {
  en_clinica: 'registrado',
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
  { id: 'ONC', codigo: 'ONC', nombre: 'Oncología', maximo: 18 },
  { id: 'NEU', codigo: 'NEU', nombre: 'Neurología', maximo: 18 },
  { id: 'NEF', codigo: 'NEF', nombre: 'Nefrología', maximo: 18 },
  { id: 'END', codigo: 'END', nombre: 'Endocrinología', maximo: 18 },
  { id: 'INF', codigo: 'INF', nombre: 'Infectología', maximo: 18 },
  { id: 'REU', codigo: 'REU', nombre: 'Reumatología', maximo: 18 },
  { id: 'DER', codigo: 'DER', nombre: 'Dermatología', maximo: 18 },
  { id: 'NEM', codigo: 'NEM', nombre: 'Neumología', maximo: 18 },
  { id: 'DOL', codigo: 'DOL', nombre: 'Clínica del Dolor', maximo: 18 },
  { id: 'GAS', codigo: 'GAS', nombre: 'Gastroenterología', maximo: 18 },
  { id: 'NUT', codigo: 'NUT', nombre: 'Nutrición', maximo: 18 },
  { id: 'MUJ', codigo: 'MUJ', nombre: 'Clínica de la Mujer', maximo: 18 },
]

export const CLINICAS_SEGUIMIENTO = [1, 2, 3, 4, 5, 6, 7, 8].map((id) => ({
  id,
  nombre: `Clínica ${id}`,
  nivel: id <= 4 ? 2 : 1,
}))

// Configuración simulada de clínica por especialidad para el modo demo.
const CLINICAS_POR_ESPECIALIDAD_MOCK = {
  MI: [1, 2, 3, 4, 5, 6, 7, 8],
  ONC: [2],
  NEU: [3, 4],
  NEF: [],
  END: [1, 2],
  INF: [2, 3],
  REU: [4],
  DER: [5],
  NEM: [1, 2, 3, 4, 5, 6],
  DOL: [3],
  GAS: [4],
  NUT: [5],
  MUJ: [1],
}

const LIMITES_SEMILLA = [38, 4, 2, 3, 7, 4, 2, 3, 0, 5, 7, 2, 8]

let turnos = new Map()
let contadorGeneralMock = 1
let devolucionesClinicaMock = []
let contadorDevolucionMock = 1
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
  const maximo = Math.max(Number(especialidad.correlativoMax) || MAXIMO_POR_DEFECTO, 1)
  const codigo = especialidad.abreviatura ?? especialidad.codigo ?? `E${especialidad.id}`

  return {
    id: especialidad.id ?? codigo,
    codigo,
    nombre: especialidad.nombre,
    maximo,
    correlativoMax: maximo,
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

/** Asignación diaria de clínicas por especialidad (vista del jefe de enfermería). */
export async function listarAsignacionesClinicas(fecha = hoyIso()) {
  if (USE_MOCK) {
    await esperar()
    return CLINICAS_SEGUIMIENTO.map((clinica) => ({
      espacioFisicoId: clinica.id,
      numero: String(clinica.id),
      asignaciones: ESPECIALIDADES_SEGUIMIENTO.filter((especialidad) =>
        (CLINICAS_POR_ESPECIALIDAD_MOCK[especialidad.codigo] ?? [])
          .map(String)
          .includes(String(clinica.id)),
      ).map((especialidad) => ({
        especialidadId: especialidad.id,
        especialidadNombre: especialidad.nombre,
      })),
    }))
  }

  const vista = desenvolver(
    await leerConReintento('/asignaciones-diarias/vista', { params: { fecha } }),
  )
  return Array.isArray(vista) ? vista : []
}

function resumenClinicaMock(clinica, fecha) {
  const enClinica = [...turnos.values()].filter(
    (turno) => turno.etapa === 'en_clinica' && turno.clinicaId === clinica.id,
  ).length
  const devueltos = devolucionesClinicaMock.filter(
    (devolucion) =>
      devolucion.fecha === fecha &&
      String(devolucion.espacioFisicoId) === String(clinica.id) &&
      !devolucion.revertidoEn,
  )
  const asignados = Math.max(enClinica, devueltos.length)
  const presentaciones = [...turnos.values()].filter(
    (turno) =>
      String(turno.clinicaId) === String(clinica.id) && turno.tipoRegistro === 'presentacion',
  ).length
  return {
    ...clinica,
    orden: Number(clinica.id),
    asignados,
    devueltos: devueltos.length,
    presentaciones,
    expedientesEnClinica: Math.max(0, asignados - devueltos.length),
    ultimaDevolucionEn:
      devueltos
        .map((devolucion) => devolucion.creadoEn)
        .sort()
        .at(-1) ?? null,
  }
}

/**
 * Agrega a cada clínica las especialidades que tiene asignadas como clínica
 * fija de la estación. Una misma clínica puede ser fija de varias
 * especialidades, por eso se agrupan por `espacioFisicoId`.
 */
export function adjuntarEspecialidadesFijas(clinicas = [], fijas = []) {
  const porClinica = new Map()
  for (const item of Array.isArray(fijas) ? fijas : []) {
    if (item?.espacioFisicoId == null || !item?.especialidadNombre) continue
    const clave = String(item.espacioFisicoId)
    const lista = porClinica.get(clave) ?? []
    if (!lista.some((especialidad) => especialidad.id === item.especialidadId)) {
      lista.push({
        id: item.especialidadId ?? item.especialidadNombre,
        nombre: item.especialidadNombre,
      })
    }
    porClinica.set(clave, lista)
  }

  return (Array.isArray(clinicas) ? clinicas : []).map((clinica) => ({
    ...clinica,
    especialidadesFijas: porClinica.get(String(clinica.id)) ?? [],
  }))
}

/** Agrega las especialidades que atienden hoy en cada clínica (asignación diaria). */
export function adjuntarEspecialidadesDelDia(clinicas = [], vista = []) {
  const porClinica = new Map()
  for (const item of Array.isArray(vista) ? vista : []) {
    const espacioId = item.espacioFisicoId ?? item.id
    if (espacioId == null) continue
    const clave = String(espacioId)
    const lista = porClinica.get(clave) ?? []
    for (const asignacion of item.asignaciones ?? []) {
      const nombre = asignacion.especialidadNombre ?? asignacion.subespecialidadNombre
      const id = asignacion.especialidadId ?? asignacion.subespecialidadId ?? nombre
      if (nombre && !lista.some((especialidad) => String(especialidad.id) === String(id))) {
        lista.push({ id, nombre })
      }
    }
    porClinica.set(clave, lista)
  }
  return (Array.isArray(clinicas) ? clinicas : []).map((clinica) => ({
    ...clinica,
    especialidadesDelDia: porClinica.get(String(clinica.id)) ?? [],
  }))
}

export async function listarClinicas({ estacionId, fecha = hoyIso() } = {}) {
  if (USE_MOCK) {
    await esperar()
    const vistaMock = Object.entries(CLINICAS_POR_ESPECIALIDAD_MOCK).flatMap(
      ([codigo, clinicaIds]) => {
        const especialidad = ESPECIALIDADES_SEGUIMIENTO.find((item) => item.codigo === codigo)
        return clinicaIds.map((id) => ({
          espacioFisicoId: String(id),
          asignaciones: [
            {
              especialidadId: especialidad?.id ?? codigo,
              especialidadNombre: especialidad?.nombre ?? codigo,
            },
          ],
        }))
      },
    )
    const clinicas = adjuntarEspecialidadesFijas(
      filtrarClinicasPorNivel(
        CLINICAS_SEGUIMIENTO.map((clinica) => resumenClinicaMock(clinica, fecha)),
        estacionId,
      ),
      [],
    )
    return adjuntarEspecialidadesDelDia(clinicas, vistaMock)
  }

  const [respuestaResumen, fijas, vista] = await Promise.all([
    leerConReintento('/turnos-estacion/clinicas/resumen', {
      params: { fecha, estacionId },
    }),
    estacionId != null
      ? leerConReintento(`/estaciones/${estacionId}/clinicas-fijas`).catch(() => [])
      : Promise.resolve([]),
    listarAsignacionesClinicas(fecha).catch(() => []),
  ])
  const resumen = desenvolver(respuestaResumen)
  const clinicas = (Array.isArray(resumen) ? resumen : []).map((clinica) => ({
    id: clinica.espacioFisicoId,
    numero: clinica.numero,
    nivel: clinica.nivel,
    orden: Number(clinica.orden ?? 0),
    nombre: clinica.nombre ?? `Clínica ${clinica.numero}`,
    asignados: Number(clinica.asignados ?? 0),
    devueltos: Number(clinica.devueltos ?? 0),
    presentaciones: Number(clinica.presentaciones ?? 0),
    expedientesEnClinica: Number(clinica.pendientes ?? 0),
    ultimaDevolucionEn: clinica.ultimaDevolucionEn ?? null,
  }))
  return adjuntarEspecialidadesDelDia(
    adjuntarEspecialidadesFijas(filtrarClinicasPorNivel(clinicas, estacionId), desenvolver(fijas)),
    vista,
  )
}

export async function registrarDevolucionClinica({
  espacioFisicoId,
  estacionId,
  fecha = hoyIso(),
  cantidad = 1,
} = {}) {
  if (USE_MOCK) {
    await esperar()
    const clinica = CLINICAS_SEGUIMIENTO.find((item) => String(item.id) === String(espacioFisicoId))
    if (!clinica) throw crearError('Clínica no encontrada', 404)
    const actual = resumenClinicaMock(clinica, fecha)
    const total = Number(cantidad) || 1
    if (total < 1) throw crearError('La cantidad debe ser mayor que cero', 422)
    if (actual.expedientesEnClinica <= 0) {
      throw crearError('No hay pacientes pendientes de devolver en esta clínica', 409)
    }
    if (total > actual.expedientesEnClinica) {
      throw crearError(
        `Solo hay ${actual.expedientesEnClinica} paciente(s) pendiente(s) en esta clínica`,
        409,
      )
    }
    const ahora = new Date().toISOString()
    for (let i = 0; i < total; i += 1) {
      devolucionesClinicaMock.push({
        id: contadorDevolucionMock++,
        espacioFisicoId: clinica.id,
        fecha,
        creadoEn: ahora,
        revertidoEn: null,
      })
    }
    return resumenClinicaMock(clinica, fecha)
  }

  const respuesta = await client.post(
    `/turnos-estacion/clinicas/${espacioFisicoId}/devoluciones`,
    {},
    { params: { fecha, estacionId, cantidad } },
  )
  return desenvolver(respuesta)
}

export async function deshacerDevolucionClinica({
  espacioFisicoId,
  estacionId,
  fecha = hoyIso(),
} = {}) {
  if (USE_MOCK) {
    await esperar()
    const clinica = CLINICAS_SEGUIMIENTO.find((item) => String(item.id) === String(espacioFisicoId))
    if (!clinica) throw crearError('Clínica no encontrada', 404)
    const activas = devolucionesClinicaMock.filter(
      (devolucion) =>
        devolucion.fecha === fecha &&
        String(devolucion.espacioFisicoId) === String(clinica.id) &&
        !devolucion.revertidoEn,
    )
    const ultima = activas.at(-1)
    if (!ultima) throw crearError('No hay devoluciones para deshacer', 409)
    ultima.revertidoEn = new Date().toISOString()
    return resumenClinicaMock(clinica, fecha)
  }

  const respuesta = await client.post(
    `/turnos-estacion/clinicas/${espacioFisicoId}/devoluciones/deshacer`,
    {},
    { params: { fecha, estacionId } },
  )
  return desenvolver(respuesta)
}

// Registra el siguiente correlativo de la especialidad. En modo real el backend
// asigna el número; el `numero` de la casilla es solo una referencia visual.
export async function registrarTurno({
  codigo,
  numero,
  tipoRegistro,
  estacionId,
  especialidadId,
  espacioFisicoId,
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

    const clinicasValidas = (CLINICAS_POR_ESPECIALIDAD_MOCK[especialidad.codigo] ?? []).map(String)
    if (espacioFisicoId != null && !clinicasValidas.includes(String(espacioFisicoId))) {
      throw crearError('La clínica no está asignada a la especialidad', 422)
    }
    const clinica = CLINICAS_SEGUIMIENTO.find((item) => String(item.id) === String(espacioFisicoId))

    const turno = {
      id: clave(codigo, correlativo),
      especialidadId: codigo,
      codigo,
      numero: correlativo,
      numeroGeneral: contadorGeneralMock++,
      etapa: 'registrado',
      estadoBackend: 'registrado',
      clinicaId: clinica?.id ?? null,
      clinicaNombre: clinica?.nombre ?? null,
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
    espacioFisicoId,
  })
  const turno = {
    ...normalizarTurno(desenvolver(respuesta), { codigo }),
    especialidadId,
    tipoRegistro: tipo,
  }
  if (tipo) tiposPorTurno.set(turno.id, tipo)
  return turno
}

// Cambia la marca (presentación / privado de libertad) de un turno ya
// registrado. Enviar null quita la marca.
export async function actualizarTipoRegistroTurno(id, tipoRegistro) {
  const tipo = normalizarTipoRegistro(tipoRegistro)

  if (USE_MOCK) {
    await esperar()
    const turno = turnos.get(id)
    if (!turno) throw crearError('Turno no encontrado', 404)
    if (turno.etapa !== 'registrado') {
      throw crearError('Solo se puede cambiar el tipo de registro en Registrado', 409)
    }
    turno.tipoRegistro = tipo
    turno.actualizadoEn = new Date().toISOString()
    return copiarTurno(turno)
  }

  const respuesta = await client.put(`/turnos-estacion/${id}/tipo-registro`, {
    tipoRegistro: tipo,
  })
  const data = desenvolver(respuesta)
  if (tipo) tiposPorTurno.set(data.id, tipo)
  else tiposPorTurno.delete(data.id)
  return normalizarTurno(data)
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

    // La UI unifica recibido dentro de en_clinica: el backend real hace
    // recibir + asignar-clinica en una sola acción.
    if (turno.etapa === 'registrado') {
      if (!clinicaId) {
        throw crearError('Seleccione una clínica para repartir el expediente', 422)
      }
      const clinica = Number(clinicaId)
      if (!CLINICAS_SEGUIMIENTO.some((item) => item.id === clinica)) {
        throw crearError('Seleccione una clínica para repartir el expediente', 422)
      }
      turno.clinicaId = clinica
      turno.clinicaNombre = `Clínica ${clinica}`
      turno.etapa = 'en_clinica'
      turno.estadoBackend = 'en_clinica'
      turno.actualizadoEn = new Date().toISOString()
      return copiarTurno(turno)
    }

    const indice = ETAPAS_SEGUIMIENTO.findIndex((etapa) => etapa.id === turno.etapa)
    const siguiente = ETAPAS_SEGUIMIENTO[indice + 1]
    if (!siguiente) throw crearError('El turno ya completó el flujo', 409)

    turno.etapa = siguiente.id
    turno.estadoBackend = siguiente.id === 'archivo' ? 'archivado' : siguiente.id
    turno.actualizadoEn = new Date().toISOString()
    return copiarTurno(turno)
  }

  // En la UI ya no existe Recibido: al pasar de Registrado a En clínica se
  // ejecutan internamente recibir + asignar-clinica.
  if (estadoBackend === 'registrado' && clinicaId) {
    await client.post(`/turnos-estacion/${id}/recibir`, {})
    const respuesta = await client.post(`/turnos-estacion/${id}/asignar-clinica`, {
      espacioFisicoId: clinicaId,
    })
    return normalizarTurno(desenvolver(respuesta))
  }

  const { ruta, cuerpo } = rutaSiguiente(estadoBackend, clinicaId, observacion)
  const respuesta = await client.post(`/turnos-estacion/${id}/${ruta}`, cuerpo)
  return normalizarTurno(desenvolver(respuesta))
}

/** Asigna o cambia la clínica sin avanzar el estado (solo registrado/recibido). */
export async function cambiarClinicaTurno(id, espacioFisicoId) {
  if (USE_MOCK) {
    await esperar()
    const turno = turnos.get(id)
    if (!turno) throw crearError('Turno no encontrado', 404)
    if (turno.etapa !== 'registrado' && turno.etapa !== 'recibido') {
      throw crearError('Solo se puede cambiar la clínica antes de En clínica', 409)
    }
    const especialidad = buscarEspecialidad(turno.codigo)
    const clinicasValidas = (CLINICAS_POR_ESPECIALIDAD_MOCK[especialidad?.codigo] ?? []).map(String)
    if (!clinicasValidas.includes(String(espacioFisicoId))) {
      throw crearError('La clínica no está asignada a la especialidad', 422)
    }
    const clinica = CLINICAS_SEGUIMIENTO.find((item) => String(item.id) === String(espacioFisicoId))
    turno.clinicaId = clinica?.id ?? null
    turno.clinicaNombre = clinica?.nombre ?? null
    turno.actualizadoEn = new Date().toISOString()
    return copiarTurno(turno)
  }

  const respuesta = await client.put(`/turnos-estacion/${id}/clinica`, {
    espacioFisicoId,
  })
  return normalizarTurno(desenvolver(respuesta))
}

// Historial de estados. En modo real viene de la bitácora del backend.
export async function obtenerHistorialTurno(id) {
  if (USE_MOCK) {
    await esperar()
    const turno = turnos.get(id)
    if (!turno) throw crearError('Turno no encontrado', 404)
    const secuencia = ['registrado', 'en_clinica', 'devuelto', 'archivo']
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
  const movimientos = (detalle?.movimientos ?? []).map((movimiento) => ({
    id: movimiento.id,
    estadoAnterior: movimiento.estadoAnterior,
    estadoNuevo: movimiento.estadoNuevo,
    usuarioNombre: movimiento.usuarioNombre,
    medicoNombre: movimiento.medicoNombre,
    observacion: movimiento.observacion,
    fechaMovimiento: movimiento.fechaMovimiento,
  }))

  // La UI unificada no muestra el estado interno recibido.
  return movimientos.reduce((visibles, movimiento) => {
    if (movimiento.estadoNuevo === 'recibido') return visibles
    if (movimiento.estadoAnterior === 'recibido') {
      const anterior = [...visibles].reverse().find((item) => item.estadoNuevo !== 'recibido')
      return [...visibles, { ...movimiento, estadoAnterior: anterior?.estadoNuevo ?? 'registrado' }]
    }
    return [...visibles, movimiento]
  }, [])
}

// Revierte el turno al estado anterior. El backend no permite devueltos/archivados.
export async function revertirTurno(id) {
  if (USE_MOCK) {
    await esperar()
    const turno = turnos.get(id)
    if (!turno) throw crearError('Turno no encontrado', 404)
    const anteriorPorEtapa = {
      en_clinica: 'registrado',
      devuelto: 'en_clinica',
      archivo: 'devuelto',
    }
    const anterior = anteriorPorEtapa[turno.etapa]
    if (!anterior) throw crearError('El turno no se puede revertir en este estado', 409)
    turno.etapa = anterior
    turno.estadoBackend = anterior
    if (anterior === 'registrado') {
      turno.clinicaId = null
      turno.clinicaNombre = null
    }
    turno.actualizadoEn = new Date().toISOString()
    return copiarTurno(turno)
  }

  // Si el backend está en en_clinica, la UI unificada necesita retroceder dos
  // pasos internos (en_clinica -> recibido -> registrado) para verse en Registrado.
  const detalle = desenvolver(await leerConReintento(`/turnos-estacion/${id}`))
  const veces = detalle?.estado === 'en_clinica' ? 2 : 1
  let respuesta
  for (let paso = 0; paso < veces; paso += 1) {
    respuesta = await client.post(`/turnos-estacion/${id}/revertir`)
  }
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
  contadorGeneralMock = 1
  devolucionesClinicaMock = []
  contadorDevolucionMock = 1
}
