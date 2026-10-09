'use strict';

const { generarReporteExpedientes } = require('./generarReporteExpedientes');
const { validarReporte, TIPOS_VALIDOS } = require('./validarReporte');
const { normalizarReporte, FALLBACK } = require('./normalizarReporte');

module.exports = {
  generarReporteExpedientes,
  validarReporte,
  normalizarReporte,
  TIPOS_VALIDOS,
  FALLBACK,
};
