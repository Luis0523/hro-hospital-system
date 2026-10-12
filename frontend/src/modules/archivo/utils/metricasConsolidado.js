// Cálculos de presentación del Consolidado de Archivo. No definen reglas de
// negocio propias: replican las fórmulas del Excel legado
// (`Estadistico de archivo REAL HRO.xls`) documentadas en
// `docs/instrucciones/depuracion-y-consolidado-archivo.md` §4.
//
// Cuando el backend entregue el consolidado, se prefiere su valor; estos
// cálculos son respaldo/mock y se usan para las columnas que el sistema aún no
// captura.

// --- Consolidado diario por especialidad ---------------------------------

export function totalPorEspecialidad(porEspecialidad = []) {
  return porEspecialidad.reduce((total, item) => total + (item.total ?? 0), 0)
}

export function maximoPorEspecialidad(porEspecialidad = []) {
  return porEspecialidad.reduce((maximo, item) => Math.max(maximo, item.total ?? 0), 0)
}

export function porcentajeDe(valor, total) {
  if (!Number.isFinite(total) || total <= 0) return 0
  return Math.round(((valor ?? 0) / total) * 100)
}

export function ordenarPorTotal(porEspecialidad = []) {
  return [...porEspecialidad].sort(
    (a, b) => (b.total ?? 0) - (a.total ?? 0) || (a.especialidadNombre ?? '').localeCompare(b.especialidadNombre ?? ''),
  )
}

// --- Consolidado mensual (fórmulas del Excel) ----------------------------

// SUB_TOTAL = MEDICINA + HEMODIALISIS
export function calcularSubTotal({ medicina, hemodialisis } = {}) {
  return (medicina ?? 0) + (hemodialisis ?? 0)
}

// TOTAL de la Tabla 2 (detalle por consulta).
export function calcularTotalDetalle(fila = {}) {
  return (
    calcularSubTotal(fila) +
    (fila.cirugia ?? 0) +
    (fila.traumatologia ?? 0) +
    (fila.ginecoObstetricia ?? 0) +
    (fila.pediatria ?? 0) +
    (fila.psicosocial ?? 0) +
    (fila.odontologia ?? 0) +
    (fila.clinicaMujer ?? 0) +
    (fila.clinicaVih ?? 0)
  )
}

// TOTAL de la Tabla 1: excluye HA y TIA.
// TOTAL = EH + HDT + HDC + SOBRES + HR + HD
export function calcularTotalInforme(fila = {}) {
  return (
    (fila.eh ?? 0) +
    (fila.hdt ?? 0) +
    (fila.hdc ?? 0) +
    (fila.sobres ?? 0) +
    (fila.hr ?? 0) +
    (fila.hd ?? 0)
  )
}

// HA = TOTAL * 2 (fórmula del Excel; confírmese con Archivo).
export function calcularHA(total) {
  return (total ?? 0) * 2
}
