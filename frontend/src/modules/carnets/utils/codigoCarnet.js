// Código visible del carnet: "ABREV-correlativo" (p. ej. PED-3) usando la
// abreviatura configurable de la especialidad; si no hay, solo el correlativo.
export function codigoCarnet(carnet) {
  if (!carnet) return ''
  const abreviatura = carnet.especialidadAbreviatura
  return abreviatura ? `${abreviatura}-${carnet.correlativo}` : String(carnet.correlativo)
}
