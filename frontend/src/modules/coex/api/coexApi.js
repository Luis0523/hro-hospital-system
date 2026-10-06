import client from '@/shared/api/client'
// Dependencia unidireccional: coexApi -> loteCoexSource. `loteCoexSource` NO
// importa nada de este módulo; recibe las implementaciones HTTP por inyección.
import {
  agregarJornadas,
  cargarLoteCoex,
  claveFila,
} from '../services/loteCoexSource'
import {
  entregarCicloCoexMock,
  jornadaSubespecialidadCoexMock,
  retornarCicloCoexMock,
  subespecialidadesEstacionCoexMock,
} from './mockDataCoex'
import {
  ciclosCoexMock,
  detalleCicloCoexMock,
  salidaExpedientesCoexMock,
  salidaPdfCoexMock,
} from './fixturesCiclosCoex'

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

// `claveFila` y `agregarJornadas` viven en `services/loteCoexSource` (para
// evitar la dependencia circular). Se re-exportan aquí como superficie pública
// del módulo COEX para no romper consumidores/tests existentes.
export { agregarJornadas, claveFila }

// ---------------------------------------------------------------------------
// Fuente /expediente-ciclos (preparada, INACTIVA como fuente del lote).
// Solo se consumen; el backend valida y transiciona.
// ---------------------------------------------------------------------------

// Cola de ciclos filtrada por estado/fecha/subespecialidad. El filtro por
// estación lo aplica el backend a partir del header `X-Estacion-Id` que agrega
// `shared/api/client`; aquí NO se duplica.
export async function listarCiclosCoex({
  fecha,
  estado,
  subespecialidadId,
  cliente = client,
  usarMock = USE_MOCK,
} = {}) {
  if (usarMock) return ciclosCoexMock({ fecha, estado, subespecialidadId })

  const params = {}
  if (fecha) params.fecha = fecha
  if (estado) params.estado = estado
  if (subespecialidadId != null) params.subespecialidadId = subespecialidadId

  const datos = desenvolver(await cliente.get('/expediente-ciclos', { params }))
  return Array.isArray(datos) ? datos : (datos?.content ?? [])
}

// Detalle de un ciclo por id.
export async function obtenerDetalleCicloCoex(
  cicloId,
  { cliente = client, usarMock = USE_MOCK } = {},
) {
  if (usarMock) return detalleCicloCoexMock(cicloId)
  return desenvolver(await cliente.get(`/expediente-ciclos/${cicloId}`))
}

// Documento de salida de expedientes de una fecha (para saber si habrá datos).
export async function obtenerSalidaCoex({
  fecha,
  cliente = client,
  usarMock = USE_MOCK,
} = {}) {
  if (usarMock) return salidaExpedientesCoexMock(fecha)

  const datos = desenvolver(
    await cliente.get('/archivo/salida', { params: fecha ? { fecha } : {} }),
  )
  return {
    fecha: datos?.fecha ?? fecha ?? null,
    total: datos?.total ?? 0,
    items: datos?.items ?? [],
  }
}

// PDF de salida. Se pide con `responseType: 'blob'` y se devuelve el Blob tal
// cual: el interceptor de `shared/api/client` ya entrega `response.data` y no
// expone cabeceras (no se intenta leer `Content-Disposition`).
export async function obtenerSalidaPdfCoex({
  fecha,
  cliente = client,
  usarMock = USE_MOCK,
} = {}) {
  if (usarMock) return salidaPdfCoexMock(fecha)
  return cliente.get('/archivo/salida/pdf', { params: { fecha }, responseType: 'blob' })
}

// Carga el lote de la estación. Delegado fino a `cargarLoteCoex`, cuya fuente
// por defecto es jornada (comportamiento actual). Aquí se INYECTAN las
// implementaciones HTTP (que viven en este módulo) en la abstracción de fuente;
// `loteCoexSource` no las importa, evitando la dependencia circular. Las
// dependencias se pueden sobreescribir para pruebas.
export function cargarLoteEstacion({
  estacionId,
  fecha,
  listarSubs = listarSubespecialidadesEstacion,
  listarJornada = listarJornadaSubespecialidad,
  ...resto
} = {}) {
  return cargarLoteCoex({ estacionId, fecha, listarSubs, listarJornada, ...resto })
}
