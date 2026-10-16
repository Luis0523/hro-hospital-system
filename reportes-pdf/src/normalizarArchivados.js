'use strict';

const { LOGO_HRO_POR_DEFECTO, TITULO_POR_DEFECTO } = require('./pdf/archivados/constantes');
const { formatearFecha } = require('./pdf/helpers');

function textoOTexto(valor, fallback) {
  if (valor === null || valor === undefined) {
    return fallback;
  }
  const texto = String(valor).trim();
  return texto.length > 0 ? texto : fallback;
}

function normalizarExpedientes(expedientes) {
  return expedientes.map((expediente, indice) => ({
    numero: Number.isInteger(expediente.numero) ? expediente.numero : indice + 1,
    numeroExpediente: String(expediente.numeroExpediente).trim(),
    fechaISO: expediente.fecha,
    fechaTexto: formatearFecha(expediente.fecha),
  }));
}

function normalizarFirmantes(firmantes) {
  const base = Array.isArray(firmantes) ? firmantes : [];
  return base.slice(0, 2).map((firmante) => ({
    nombre: String(firmante.nombre).trim(),
    cargo: textoOTexto(firmante.cargo, ''),
    etiqueta: textoOTexto(firmante.etiqueta, 'Nombre y firma'),
  }));
}

function normalizarArchivados(config) {
  const expedientes = normalizarExpedientes(config.expedientes);

  return {
    titulo: textoOTexto(config.titulo, TITULO_POR_DEFECTO),
    fecha: config.fecha || null,
    expedientes,
    firmantes: normalizarFirmantes(config.firmantes),
    totalExpedientes: expedientes.length,
    logo: textoOTexto(config.logo, LOGO_HRO_POR_DEFECTO),
    logoFallback: LOGO_HRO_POR_DEFECTO,
    fechaGeneracion: new Date(),
    rutaSalida: config.rutaSalida,
  };
}

module.exports = { normalizarArchivados };
