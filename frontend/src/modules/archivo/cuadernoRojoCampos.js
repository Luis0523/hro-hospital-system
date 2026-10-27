// Definición centralizada de los campos del Registro del Cuaderno Rojo.
//
// Los nombres corresponden a los encabezados definitivos del cuaderno físico
// proporcionados por el hospital. No se interpretan las abreviaturas.
export const ETIQUETA_SOBRES_EMERGENCIA = 'Sobres emergencia'

// Clave interna del tercer campo. No es un contrato de API: es solo la clave de
// estado del formulario. Se mantiene aislada para no acoplarla al nombre visible.
export const CLAVE_SOBRES_EMERGENCIA = 'sobres'

// La etiqueta "TIA" se muestra literalmente, sin puntos y sin desarrollar las siglas.
export const CAMPOS_CUADERNO_ROJO = Object.freeze([
  { clave: 'fecha', etiqueta: 'Fecha', tipo: 'fecha' },
  { clave: 'egresosHospitalarios', etiqueta: 'Egresos hospitalarios', tipo: 'cantidad' },
  { clave: CLAVE_SOBRES_EMERGENCIA, etiqueta: ETIQUETA_SOBRES_EMERGENCIA, tipo: 'cantidad' },
  { clave: 'sobresSellados', etiqueta: 'Sobres sellados', tipo: 'cantidad' },
  { clave: 'tia', etiqueta: 'TIA', tipo: 'cantidad' },
])

// Columnas del historial: mismas cinco columnas del formulario, en el mismo orden.
export const COLUMNAS_HISTORIAL = Object.freeze(
  CAMPOS_CUADERNO_ROJO.map((campo) => ({ clave: campo.clave, etiqueta: campo.etiqueta })),
)

export const MENSAJE_FECHA_REQUERIDA = 'Seleccione una fecha.'
export const MENSAJE_CANTIDAD_REQUERIDA = 'Ingrese una cantidad.'
export const MENSAJE_CANTIDAD_ENTERA = 'La cantidad debe ser un número entero.'
export const MENSAJE_CANTIDAD_NEGATIVA = 'La cantidad no puede ser negativa.'

const RE_ENTERO_NO_NEGATIVO = /^\d+$/
const RE_NUMERO = /^[+-]?\d+(?:[.,]\d+)?$/

/** Valida una cantidad: entero y no negativo. Devuelve el mensaje o `null`. */
export function validarCantidad(valor) {
  const texto = String(valor ?? '').trim()
  if (texto === '') return MENSAJE_CANTIDAD_REQUERIDA
  if (RE_ENTERO_NO_NEGATIVO.test(texto)) return null
  if (RE_NUMERO.test(texto) && texto.startsWith('-')) return MENSAJE_CANTIDAD_NEGATIVA
  return MENSAJE_CANTIDAD_ENTERA
}

/** Valida una fecha requerida. Devuelve el mensaje o `null`. */
export function validarFecha(valor) {
  const texto = String(valor ?? '').trim()
  return texto === '' ? MENSAJE_FECHA_REQUERIDA : null
}

/** Valida un campo según su definición. Devuelve el mensaje o `null`. */
export function validarCampo(campo, valor) {
  return campo.tipo === 'fecha' ? validarFecha(valor) : validarCantidad(valor)
}

/** Valores iniciales vacíos, derivados de la definición centralizada. */
export function valoresIniciales() {
  return CAMPOS_CUADERNO_ROJO.reduce((acumulado, campo) => {
    acumulado[campo.clave] = ''
    return acumulado
  }, {})
}

/** Valida el formulario completo. Devuelve `{ valido, errores }`. */
export function validarFormulario(valores = {}) {
  const errores = {}
  for (const campo of CAMPOS_CUADERNO_ROJO) {
    const error = validarCampo(campo, valores[campo.clave])
    if (error) errores[campo.clave] = error
  }
  return { valido: Object.keys(errores).length === 0, errores }
}
