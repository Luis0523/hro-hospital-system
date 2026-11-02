// Almacenamiento temporal (SOLO en memoria) de las salidas externas.
//
// Limitaciones conocidas y aceptadas en esta fase:
// - Vive únicamente mientras la pestaña tenga la aplicación cargada. Recargar
//   la página elimina todos los registros: NO es persistencia institucional.
// - No usa localStorage, sessionStorage, IndexedDB ni cookies.
// - No contiene datos reales de pacientes; los datos de prueba deben crearse
//   explícitamente desde la API o desde los tests.
//
// Este módulo es la "fuente de datos simulada". La pantalla NUNCA debe
// importarlo: consume `salidasExternasApi.js`.

let registros = []
let secuencia = 0

// Reversión: solo la ÚLTIMA operación exitosa puede deshacerse. La bitácora
// conserva la evidencia local de lo revertido (no se expone en la pantalla).
let ultimaOperacion = null
let bitacoraReversiones = []

/** Copia superficial suficiente: los registros son objetos planos. */
function copiarRegistro(registro) {
  return registro ? { ...registro } : null
}

/** Vacía el almacén. Uso exclusivo de pruebas y de la demostración controlada. */
export function reiniciarSalidasExternasMock() {
  registros = []
  secuencia = 0
  ultimaOperacion = null
  bitacoraReversiones = []
}

/** Copia de todos los registros (el consumidor no toca el almacén interno). */
export function listarRegistrosMock() {
  return registros.map(copiarRegistro)
}

/** Inserta un registro y devuelve una copia con su identificador local. */
export function crearRegistroMock(datos) {
  secuencia += 1
  const id = `se-${Date.now().toString(36)}-${secuencia}`
  const registro = { ...datos, id }

  registros = [...registros, registro]
  return copiarRegistro(registro)
}

/** Actualiza por id y devuelve una copia, o null si no existe. */
export function actualizarRegistroMock(id, cambios) {
  const indice = registros.findIndex((registro) => registro.id === id)
  if (indice === -1) return null

  const actualizado = { ...registros[indice], ...cambios }
  registros = registros.map((registro, posicion) => (posicion === indice ? actualizado : registro))

  return copiarRegistro(actualizado)
}

/** Elimina un registro y devuelve su copia (para trazabilidad), o null. */
export function eliminarRegistroMock(id) {
  const encontrado = registros.find((registro) => registro.id === id)
  if (!encontrado) return null

  registros = registros.filter((registro) => registro.id !== id)
  return copiarRegistro(encontrado)
}

/** Guarda la operación exitosa más reciente (reemplaza a la anterior). */
export function registrarOperacionMock(operacion) {
  ultimaOperacion = { ...operacion }
}

/** Copia de la operación registrada, o null si no hay. */
export function obtenerOperacionMock() {
  return ultimaOperacion ? { ...ultimaOperacion } : null
}

/** Descarta la operación (tras revertir). */
export function limpiarOperacionMock() {
  ultimaOperacion = null
}

/** Añade una entrada a la bitácora local de reversiones. */
export function registrarReversionMock(entrada) {
  bitacoraReversiones = [...bitacoraReversiones, { ...entrada }]
}

/** Copia de la bitácora de reversiones (solo para pruebas/diagnóstico). */
export function listarReversionesMock() {
  return bitacoraReversiones.map((entrada) => ({ ...entrada }))
}
