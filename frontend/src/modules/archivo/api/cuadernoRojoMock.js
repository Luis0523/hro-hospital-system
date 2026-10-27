// Mock en memoria del Cuaderno Rojo. Se usa en modo test y cuando
// VITE_USE_MOCK=true. No persiste entre recargas del navegador: replica el
// contrato del backend (un registro por fecha, guardar actualiza).
const registros = new Map()

let siguienteId = 1

function normalizar(datos = {}) {
  return {
    egresosHospitalarios: Number(datos.egresosHospitalarios ?? 0),
    sobresEmergencia: Number(datos.sobresEmergencia ?? 0),
    sobresSellados: Number(datos.sobresSellados ?? 0),
    tia: Number(datos.tia ?? 0),
  }
}

function ordenarDesc(lista) {
  return [...lista].sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export function listarCuadernoRojoMock({ anio, mes } = {}) {
  let lista = [...registros.values()]
  if (anio != null) {
    lista = lista.filter((r) => Number(r.fecha.slice(0, 4)) === Number(anio))
  }
  if (mes != null) {
    lista = lista.filter((r) => Number(r.fecha.slice(5, 7)) === Number(mes))
  }
  return ordenarDesc(lista)
}

export function obtenerCuadernoRojoMock(fecha) {
  return registros.get(fecha) ?? null
}

export function guardarCuadernoRojoMock(fecha, datos) {
  const anterior = registros.get(fecha)
  const registro = {
    id: anterior?.id ?? `mock-cuaderno-${siguienteId++}`,
    fecha,
    ...normalizar(datos),
    registradoPor: anterior?.registradoPor ?? 'Archivo',
    actualizadoPor: 'Archivo',
    actualizadoEn: new Date().toISOString(),
  }
  registros.set(fecha, registro)
  return registro
}

export function reiniciarCuadernoRojoMock() {
  registros.clear()
  siguienteId = 1
}
