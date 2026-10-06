// Clasificación temporal Activo/Pasivo (PRUEBA VISUAL, NO es contrato).
//
// Regla acotada: se aplica SOLO cuando `numeroExpediente` es un string
// puramente numérico (`/^\d+$/`). En cualquier otro caso devuelve `null`.
//
//   numeroExpediente <  111016 -> 'pasivo'
//   numeroExpediente >= 111016 -> 'activo'
//
// `numeroExpediente` sigue siendo un identificador opaco: NO se quitan guiones,
// letras ni espacios, NO se extraen dígitos y NO se reformatea el valor.
export function clasificarExpediente(numeroExpediente) {
  if (typeof numeroExpediente !== 'string') return null
  if (!/^\d+$/.test(numeroExpediente)) return null

  const numero = Number(numeroExpediente)
  if (!Number.isFinite(numero)) return null

  return numero < 111016 ? 'pasivo' : 'activo'
}

export const ETIQUETAS_CLASIFICACION = {
  activo: 'Activo',
  pasivo: 'Pasivo',
}

// Clases (tokens existentes) para el badge discreto. Pasivo NO se muestra como
// error: es una clasificación neutral.
export const ESTILOS_CLASIFICACION = {
  activo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
  pasivo: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
}
