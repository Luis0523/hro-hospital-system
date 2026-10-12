'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { normalizarReporte, FALLBACK } = require('../src/normalizarReporte');

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

test('normaliza opcionales faltantes a "—"', () => {
  const datos = normalizarReporte(base());
  const expediente = datos.expedientes[0];
  assert.equal(expediente.subespecialidadNombre, FALLBACK);
  assert.equal(expediente.horaEstimada, FALLBACK);
  assert.equal(expediente.estadoActual, FALLBACK);
});

test('conserva opcionales presentes y asigna índice', () => {
  const config = base();
  config.expedientes[0].subespecialidadNombre = 'Pediatría';
  config.expedientes[0].horaEstimada = '09:40';
  const datos = normalizarReporte(config);
  assert.equal(datos.expedientes[0].subespecialidadNombre, 'Pediatría');
  assert.equal(datos.expedientes[0].horaEstimada, '09:40');
  assert.equal(datos.expedientes[0].indice, 1);
});

test('construye identificador determinista SAL/DEV', () => {
  assert.equal(normalizarReporte(base()).idDocumento, 'SAL-20261005');
  const dev = base();
  dev.tipo = 'devolucion';
  assert.equal(normalizarReporte(dev).idDocumento, 'DEV-20261005');
});

test('aplica origen y destino por defecto según tipo', () => {
  const salida = normalizarReporte(base());
  assert.equal(salida.origen, 'Archivo / Registro Médico');
  assert.equal(salida.destino, 'Consulta Externa (COEX)');

  const dev = base();
  dev.tipo = 'devolucion';
  const devolucion = normalizarReporte(dev);
  assert.equal(devolucion.origen, 'Consulta Externa (COEX)');
  assert.equal(devolucion.destino, 'Archivo / Registro Médico');
});

test('calcula totalExpedientes', () => {
  const config = base();
  config.expedientes = [
    { numeroExpediente: '1', pacienteNombre: 'A' },
    { numeroExpediente: '2', pacienteNombre: 'B' },
  ];
  assert.equal(normalizarReporte(config).totalExpedientes, 2);
});
