// Abstracción local de la fuente del lote de Mesa COEX.
//
// Dependencia UNIDIRECCIONAL: este módulo solo importa utilidades locales; NO
// importa la capa API de COEX. Las implementaciones HTTP se INYECTAN (desde la
// capa API en producción, o desde los tests). Grafo:
//
//     capa API (api)  ->  services/loteCoexSource  ->  utils/normalizarCicloCoex
//
// Hoy la fuente ACTIVA es `cargarLoteDesdeJornada` (comportamiento actual).
// `cargarLoteDesdeCiclos` queda implementada y testeada, pero INACTIVA: la
// activación futura se hará pasando esa función como `fuente` en un único punto,
// sin tocar componentes, hooks de acción, polling, responsive ni la UI.
//
// Contrato de toda fuente: devolver la misma forma `{ subespecialidades, filas }`
// con filas del modelo interno de COEX.

import { normalizarCiclosCoex } from '../utils/normalizarCicloCoex'

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

// Fuente actual: subespecialidades activas de la estación → N jornadas → agregación.
// `listarSubs` y `listarJornada` se inyectan (no se importan de la API).
export async function cargarLoteDesdeJornada({
  estacionId,
  fecha,
  listarSubs,
  listarJornada,
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

// Fuente futura: subespecialidades (contexto) + una sola consulta a
// /expediente-ciclos (filtrado por estación en el servidor vía X-Estacion-Id).
//
// IMPORTANTE: los ciclos se consultan SIEMPRE, sin usar
// `subespecialidades.length === 0` como gate. Puede haber citas/ciclos para una
// fecha aunque `subespecialidades-activas?fecha=` devuelva [] por configuración
// de horario (caso detectado en EST-04).
export async function cargarLoteDesdeCiclos({
  estacionId,
  fecha,
  listarSubs,
  listarCiclos,
} = {}) {
  if (estacionId == null) return { subespecialidades: [], filas: [] }

  const [subespecialidades, ciclos] = await Promise.all([
    listarSubs(estacionId, fecha),
    listarCiclos({ fecha }),
  ])

  return { subespecialidades, filas: normalizarCiclosCoex(ciclos) }
}

// Punto único de carga del lote con fuente inyectable (por defecto: jornada).
export async function cargarLoteCoex({
  estacionId,
  fecha,
  fuente = cargarLoteDesdeJornada,
  ...deps
} = {}) {
  return fuente({ estacionId, fecha, ...deps })
}
