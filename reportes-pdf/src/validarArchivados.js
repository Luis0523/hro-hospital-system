'use strict';

const { fechaEsValida } = require('./validarReporte');

function esObjeto(valor) {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esTextoNoVacio(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function validarReporteArchivados(config) {
  if (!esObjeto(config)) {
    throw new Error(
      'Configuración inválida: se esperaba un objeto de configuración.'
    );
  }

  if (
    config.titulo !== undefined &&
    config.titulo !== null &&
    !esTextoNoVacio(config.titulo)
  ) {
    throw new Error('Título inválido: "titulo" debe ser texto no vacío.');
  }

  if (
    config.fecha !== undefined &&
    config.fecha !== null &&
    !fechaEsValida(config.fecha)
  ) {
    throw new Error(
      `Fecha inválida: "${config.fecha}". Formato esperado: YYYY-MM-DD.`
    );
  }

  if (!Array.isArray(config.expedientes)) {
    throw new Error(
      'Expedientes inválidos: se esperaba un arreglo en "expedientes".'
    );
  }

  if (!esTextoNoVacio(config.rutaSalida)) {
    throw new Error(
      'Ruta de salida inválida: "rutaSalida" es obligatoria y debe ser texto.'
    );
  }

  config.expedientes.forEach((expediente, indice) => {
    const posicion = indice + 1;
    if (!esObjeto(expediente)) {
      throw new Error(`Expediente #${posicion} inválido: se esperaba un objeto.`);
    }
    if (!esTextoNoVacio(expediente.numeroExpediente)) {
      throw new Error(
        `Expediente #${posicion} inválido: falta "numeroExpediente".`
      );
    }
    if (!fechaEsValida(expediente.fecha)) {
      throw new Error(
        `Expediente #${posicion} inválido: fecha inválida ` +
          `"${expediente.fecha}". Formato esperado: YYYY-MM-DD.`
      );
    }
    if (
      expediente.numero !== undefined &&
      expediente.numero !== null &&
      !Number.isInteger(expediente.numero)
    ) {
      throw new Error(
        `Expediente #${posicion} inválido: "numero" debe ser entero si se envía.`
      );
    }
  });

  if (config.firmantes !== undefined && config.firmantes !== null) {
    if (!Array.isArray(config.firmantes)) {
      throw new Error(
        'Firmantes inválidos: se esperaba un arreglo en "firmantes".'
      );
    }
    config.firmantes.forEach((firmante, indice) => {
      const posicion = indice + 1;
      if (!esObjeto(firmante)) {
        throw new Error(`Firmante #${posicion} inválido: se esperaba un objeto.`);
      }
      if (!esTextoNoVacio(firmante.nombre)) {
        throw new Error(`Firmante #${posicion} inválido: falta "nombre".`);
      }
    });
  }

  return true;
}

module.exports = { validarReporteArchivados };
