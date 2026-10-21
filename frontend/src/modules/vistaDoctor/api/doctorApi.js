import * as fuenteMock from './doctorMockApi'

export const FUENTE_DATOS = 'mock'
export const esModoDemo = true

export function buscarMedicoPorColegiado(colegiado) {
  return fuenteMock.buscarMedicoPorColegiado(colegiado)
}

export function resolverClinicaPorQr(identificador) {
  return fuenteMock.resolverClinicaPorQr(identificador)
}

export function listarTurnos(opciones) {
  return fuenteMock.listarTurnos(opciones)
}

export function obtenerCola(opciones) {
  return fuenteMock.obtenerCola(opciones)
}

export function buscarPacientePorExpediente(expediente) {
  return fuenteMock.buscarPacientePorExpediente(expediente)
}

export function registrarExpediente(opciones) {
  return fuenteMock.registrarExpediente(opciones)
}

export function llamarTurno(opciones) {
  return fuenteMock.llamarTurno(opciones)
}

export function marcarNoResponde(opciones) {
  return fuenteMock.marcarNoResponde(opciones)
}

export function marcarAtendido(opciones) {
  return fuenteMock.marcarAtendido(opciones)
}

export function obtenerJornadaCerrada() {
  return fuenteMock.obtenerJornadaCerrada()
}

export function jornadaCerradaCorrespondeA(cerrada, medico, clinica, asignacion) {
  return fuenteMock.jornadaCerradaCorrespondeA(cerrada, medico, clinica, asignacion)
}

export function cerrarJornada(opciones) {
  return fuenteMock.cerrarJornada(opciones)
}

export function reabrirJornada() {
  return fuenteMock.reabrirJornada()
}

export function descartarJornadaCerrada() {
  return fuenteMock.descartarJornadaCerrada()
}

export function limpiarJornadaOperativa() {
  return fuenteMock.limpiarJornadaOperativa()
}
