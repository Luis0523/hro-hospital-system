'use strict';

const { TEXTOS, LOGO_HRO_POR_DEFECTO } = require('./pdf/constantes');
const { construirIdDocumento } = require('./pdf/helpers');

const FALLBACK = '—';

const DEFAULTS = {
  salida: {
    origen: 'Archivo / Registro Médico',
    destino: 'Consulta Externa (COEX)',
  },
  devolucion: {
    origen: 'Consulta Externa (COEX)',
    destino: 'Archivo / Registro Médico',
  },
};

function textoOTexto(valor, fallback) {
  if (valor === null || valor === undefined) {
    return fallback;
  }
  const texto = String(valor).trim();
  return texto.length > 0 ? texto : fallback;
}

function textoOFallback(valor) {
  return textoOTexto(valor, FALLBACK);
}

function normalizarReporte(config) {
  const { tipo } = config;
  const predeterminados = DEFAULTS[tipo];

  const expedientes = config.expedientes.map((expediente, indice) => ({
    indice: indice + 1,
    numeroExpediente: String(expediente.numeroExpediente).trim(),
    pacienteNombre: String(expediente.pacienteNombre).trim(),
    subespecialidadNombre: textoOFallback(expediente.subespecialidadNombre),
    horaEstimada: textoOFallback(expediente.horaEstimada),
    estadoActual: textoOFallback(expediente.estadoActual),
  }));

  return {
    tipo,
    fecha: config.fecha,
    idDocumento: construirIdDocumento(tipo, config.fecha),
    origen: textoOTexto(config.origen, predeterminados.origen),
    destino: textoOTexto(config.destino, predeterminados.destino),
    generadoPor: textoOTexto(config.generadoPor, 'Sistema HRO'),
    responsableEntrega: textoOTexto(config.responsableEntrega, ''),
    responsableRecibe: textoOTexto(config.responsableRecibe, ''),
    observaciones: textoOTexto(config.observaciones, ''),
    logoIzquierdo: textoOTexto(config.logoIzquierdo, LOGO_HRO_POR_DEFECTO),
    logoIzquierdoFallback: LOGO_HRO_POR_DEFECTO,
    logoDerecho: textoOTexto(config.logoDerecho, null),
    fechaGeneracion: new Date(),
    rutaSalida: config.rutaSalida,
    totalExpedientes: expedientes.length,
    textos: TEXTOS[tipo],
    expedientes,
  };
}

module.exports = { normalizarReporte, FALLBACK };
