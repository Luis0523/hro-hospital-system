// Mock en memoria del Cuaderno Rojo. Se usa en modo test y cuando
// VITE_USE_MOCK=true. No persiste entre recargas del navegador: replica el
// contrato del backend (un registro por fecha, guardar actualiza).
const registros = new Map()

let siguienteId = 1

function errorValidacion(mensaje) {
  const error = new Error(mensaje)
  error.status = 400
  return error
}

function cantidadValidada(datos, clave, etiqueta) {
  const valor = datos?.[clave]
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    throw errorValidacion(`${etiqueta} es obligatorio`)
  }

  const numero = Number(valor)
  if (!Number.isInteger(numero)) {
    throw errorValidacion(`${etiqueta} debe ser un número entero`)
  }
  if (numero < 0) {
    throw errorValidacion(`${etiqueta} no puede ser negativo`)
  }
  return numero
}

// Reproduce las validaciones del backend (cuatro cantidades obligatorias,
// enteras y no negativas) para que las pruebas de error no dependan de él.
function normalizar(datos = {}) {
  return {
    egresosHospitalarios: cantidadValidada(
      datos,
      'egresosHospitalarios',
      'Los egresos hospitalarios',
    ),
    sobresEmergencia: cantidadValidada(datos, 'sobresEmergencia', 'Los sobres de emergencia'),
    sobresSellados: cantidadValidada(datos, 'sobresSellados', 'Los sobres sellados'),
    tia: cantidadValidada(datos, 'tia', 'El TIA'),
  }
}

function ordenarDesc(lista) {
  return [...lista].sort((a, b) => b.fecha.localeCompare(a.fecha))
}

function filtrosValidados({ anio, mes } = {}) {
  const anioNumero = anio === '' || anio === null || anio === undefined ? null : Number(anio)
  const mesNumero = mes === '' || mes === null || mes === undefined ? null : Number(mes)

  if (mesNumero !== null && anioNumero === null) {
    throw errorValidacion('Indique el año para filtrar el Cuaderno Rojo por mes.')
  }
  if (
    anioNumero !== null &&
    (!Number.isInteger(anioNumero) || anioNumero < 2000 || anioNumero > 2100)
  ) {
    throw errorValidacion('El año indicado no es válido.')
  }
  if (mesNumero !== null && (!Number.isInteger(mesNumero) || mesNumero < 1 || mesNumero > 12)) {
    throw errorValidacion('El mes debe estar entre 1 y 12.')
  }

  return { anio: anioNumero, mes: mesNumero }
}

export function listarCuadernoRojoMock(filtros = {}) {
  const { anio, mes } = filtrosValidados(filtros)
  let lista = [...registros.values()]
  if (anio !== null) {
    lista = lista.filter((r) => Number(r.fecha.slice(0, 4)) === anio)
  }
  if (mes !== null) {
    lista = lista.filter((r) => Number(r.fecha.slice(5, 7)) === mes)
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

export function eliminarCuadernoRojoMock(fecha) {
  const registro = registros.get(fecha)
  if (!registro) {
    const error = new Error('No se encontró el registro del Cuaderno Rojo.')
    error.status = 404
    throw error
  }
  registros.delete(fecha)
  return registro
}

export function reiniciarCuadernoRojoMock() {
  registros.clear()
  siguienteId = 1
}
