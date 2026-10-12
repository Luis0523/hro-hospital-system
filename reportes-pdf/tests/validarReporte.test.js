'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { validarReporte } = require('../src/validarReporte');

function base() {
  return {
    tipo: 'salida',
    fecha: '2026-10-05',
    expedientes: [
      { numeroExpediente: '101011', pacienteNombre: 'MARTA MENDOZA ALVAREZ' },
    ],
    rutaSalida: './output/x.pdf',
  };
}

test('acepta tipo salida', () => {
  const config = base();
  assert.equal(validarReporte(config), true);
});

test('acepta tipo devolucion', () => {
  const config = base();
  config.tipo = 'devolucion';
  assert.equal(validarReporte(config), true);
});

test('acepta lista de expedientes vacía', () => {
  const config = base();
  config.expedientes = [];
  assert.equal(validarReporte(config), true);
});

test('rechaza configuración nula o no objeto', () => {
  assert.throws(() => validarReporte(null), /Configuración inválida/);
  assert.throws(() => validarReporte(undefined), /Configuración inválida/);
  assert.throws(() => validarReporte('x'), /Configuración inválida/);
});

test('rechaza tipo no soportado', () => {
  const config = base();
  config.tipo = 'traslado';
  assert.throws(() => validarReporte(config), /Tipo no soportado/);
});

test('rechaza fecha inválida', () => {
  const config = base();
  config.fecha = '05-10-2026';
  assert.throws(() => validarReporte(config), /Fecha inválida/);

  const config2 = base();
  config2.fecha = '2026-02-30';
  assert.throws(() => validarReporte(config2), /Fecha inválida/);
});

test('rechaza expedientes que no son arreglo', () => {
  const config = base();
  config.expedientes = 'no-array';
  assert.throws(() => validarReporte(config), /Expedientes inválidos/);
});

test('rechaza expediente sin número', () => {
  const config = base();
  config.expedientes = [{ pacienteNombre: 'SIN NUMERO' }];
  assert.throws(() => validarReporte(config), /falta "numeroExpediente"/);
});

test('rechaza expediente sin paciente', () => {
  const config = base();
  config.expedientes = [{ numeroExpediente: '101011' }];
  assert.throws(() => validarReporte(config), /falta "pacienteNombre"/);
});

test('rechaza rutaSalida ausente', () => {
  const config = base();
  delete config.rutaSalida;
  assert.throws(() => validarReporte(config), /Ruta de salida inválida/);
});
