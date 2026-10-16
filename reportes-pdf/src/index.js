'use strict';

const { generarReporteExpedientes } = require('./generarReporteExpedientes');
const { validarReporte, TIPOS_VALIDOS } = require('./validarReporte');
const { normalizarReporte, FALLBACK } = require('./normalizarReporte');
const {
  generarReporteExpedientesArchivados,
} = require('./generarReporteExpedientesArchivados');
const { validarReporteArchivados } = require('./validarArchivados');
const { normalizarArchivados } = require('./normalizarArchivados');

module.exports = {
  generarReporteExpedientes,
  validarReporte,
  normalizarReporte,
  TIPOS_VALIDOS,
  FALLBACK,
  generarReporteExpedientesArchivados,
  validarReporteArchivados,
  normalizarArchivados,
};
