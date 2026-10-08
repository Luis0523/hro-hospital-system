'use strict';

const TIPOS_VALIDOS = ['salida', 'devolucion'];
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function esObjeto(valor) {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esTextoNoVacio(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function fechaEsValida(fechaISO) {
  if (!esTextoNoVacio(fechaISO) || !REGEX_FECHA.test(fechaISO)) {
    return false;
  }
  const [anio, mes, dia] = fechaISO.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  );
}

function validarReporte(config) {
  if (!esObjeto(config)) {
    throw new Error('Configuración inválida: se esperaba un objeto de configuración.');
  }

  if (!TIPOS_VALIDOS.includes(config.tipo)) {
    throw new Error(
      `Tipo no soportado: "${config.tipo}". Valores válidos: ${TIPOS_VALIDOS.join(', ')}.`
    );
  }

  if (!fechaEsValida(config.fecha)) {
    throw new Error(
      `Fecha inválida: "${config.fecha}". Formato esperado: YYYY-MM-DD.`
    );
  }

  if (!Array.isArray(config.expedientes)) {
    throw new Error('Expedientes inválidos: se esperaba un arreglo en "expedientes".');
  }

  if (!esTextoNoVacio(config.rutaSalida)) {
    throw new Error('Ruta de salida inválida: "rutaSalida" es obligatoria y debe ser texto.');
  }

  config.expedientes.forEach((expediente, indice) => {
    const posicion = indice + 1;
    if (!esObjeto(expediente)) {
      throw new Error(`Expediente #${posicion} inválido: se esperaba un objeto.`);
    }
    if (!esTextoNoVacio(expediente.numeroExpediente)) {
      throw new Error(`Expediente #${posicion} inválido: falta "numeroExpediente".`);
    }
    if (!esTextoNoVacio(expediente.pacienteNombre)) {
      throw new Error(`Expediente #${posicion} inválido: falta "pacienteNombre".`);
    }
  });

  return true;
}

module.exports = { validarReporte, TIPOS_VALIDOS, fechaEsValida };
