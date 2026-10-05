import client from '@/shared/api/client'
import {
  entregarCicloCoexMock,
  jornadaSubespecialidadCoexMock,
  retornarCicloCoexMock,
  subespecialidadesEstacionCoexMock,
} from './mockDataCoex'

// API propia de Mesa COEX. No importa ni reutiliza `archivoApi.js`.
//
// Fuentes reales confirmadas:
//   GET /estaciones/{estacionId}/subespecialidades-activas?fecha=YYYY-MM-DD
//   GET /expedientes/jornada?fecha=YYYY-MM-DD&subespecialidadId={id}
// NO se asume que `X-Estacion-Id` filtre la jornada: el filtro por área se
// resuelve iterando las subespecialidades de la estación.

const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

export async function listarSubespecialidadesEstacion(estacionId, fecha) {
  if (USE_MOCK) return subespecialidadesEstacionCoexMock(estacionId)

  const datos = desenvolver(
    await client.get(`/estaciones/${estacionId}/subespecialidades-activas`, {
      params: fecha ? { fecha } : {},
    }),
  )
  return Array.isArray(datos) ? datos : (datos?.content ?? [])
}

export async function listarJornadaSubespecialidad({ fecha, subespecialidadId } = {}) {
  if (USE_MOCK) return jornadaSubespecialidadCoexMock({ fecha, subespecialidadId })

  const datos = desenvolver(
    await client.get('/expedientes/jornada', {
      params: { fecha, subespecialidadId },
    }),
  )
  return Array.isArray(datos) ? datos : (datos?.content ?? [])
}

// Recepción de un expediente: transición `en_transito_entrega -> entregado`.
// El backend valida la transición; el frontend solo la solicita. El cuerpo es
// opcional: se envía `{}` cuando no hay observación y `{ observacion }` solo si
// se proporciona programáticamente (la UI de COEX no captura observación).
// Devuelve el `ExpedienteCicloResponseDTO` ya desenvuelto de `ApiResponse`.
export async function entregarExpedienteCiclo(
  cicloId,
  { observacion, cliente = client, usarMock = USE_MOCK } = {},
) {
  if (usarMock) return entregarCicloCoexMock(cicloId, { observacion })

  const cuerpo = observacion == null ? {} : { observacion }
  return desenvolver(await cliente.post(`/expediente-ciclos/${cicloId}/entregar`, cuerpo))
}

// Devolución de un expediente: transición `entregado -> en_transito_retorno`.
// Igual que `entregar`: el backend valida la transición y el cuerpo es opcional.
// La UI de COEX no captura observación, pero se acepta de forma programática para
// simetría con `entregar` y para pruebas.
export async function retornarExpedienteCiclo(
  cicloId,
  { observacion, cliente = client, usarMock = USE_MOCK } = {},
) {
  if (usarMock) return retornarCicloCoexMock(cicloId, { observacion })

  const cuerpo = observacion == null ? {} : { observacion }
  return desenvolver(await cliente.post(`/expediente-ciclos/${cicloId}/retornar`, cuerpo))
}

// Identidad estable de una fila de jornada para deduplicar de forma defensiva
// al agregar varias subespecialidades. El ciclo es único por cita; si todavía
// no hay ciclo se usa la cita; como último recurso el expediente.
export function claveFila(fila) {
  if (!fila) return null
  if (fila.cicloId) return `ciclo:${fila.cicloId}`
  if (fila.citaId != null) return `cita:${fila.citaId}`
  if (fila.expedienteId) return `expediente:${fila.expedienteId}`
  return null
}

// Agrega listas de jornada conservando la primera ocurrencia de cada clave.
export function agregarJornadas(listas = []) {
  const porClave = new Map()
  for (const lista of listas) {
    for (const fila of lista ?? []) {
      const clave = claveFila(fila)
      if (clave == null) continue
      if (!porClave.has(clave)) porClave.set(clave, fila)
    }
  }
  return [...porClave.values()]
}

// Carga el lote de la estación: subespecialidades activas + una jornada por
// cada una + agregación. Las dependencias se pueden inyectar para pruebas.
export async function cargarLoteEstacion({
  estacionId,
  fecha,
  listarSubs = listarSubespecialidadesEstacion,
  listarJornada = listarJornadaSubespecialidad,
} = {}) {
  if (estacionId == null) return { subespecialidades: [], filas: [] }

  const subespecialidades = await listarSubs(estacionId, fecha)
  const listas = await Promise.all(
    subespecialidades.map((sub) =>
      listarJornada({ fecha, subespecialidadId: sub.id }),
    ),
  )

  return { subespecialidades, filas: agregarJornadas(listas) }
}
