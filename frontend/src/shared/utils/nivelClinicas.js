const NIVEL_CLINICAS_POR_ESTACION = new Map([
  [1, 2],
  [2, 2],
  [3, 1],
  [4, 1],
  [5, 1],
])

export function nivelClinicasPorEstacion(estacionId) {
  return NIVEL_CLINICAS_POR_ESTACION.get(Number(estacionId)) ?? null
}

export function filtrarClinicasPorNivel(clinicas, estacionId) {
  const nivel = nivelClinicasPorEstacion(estacionId)
  if (!nivel) return clinicas
  return clinicas.filter((clinica) => Number(clinica.nivel) === nivel)
}
