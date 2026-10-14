'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  validarReporteArchivados,
} = require('../../src/validarArchivados');

function base(extra = {}) {
  return {
    expedientes: [
      { numero: 1, numeroExpediente: '837871', fecha: '2026-10-13' },
    ],
    rutaSalida: './out/x.pdf',
    ...extra,
  };
}

test('acepta una configuración mínima válida', () => {
  assert.equal(validarReporteArchivados(base()), true);
});

test('rechaza configuración nula o no objeto', () => {
  assert.throws(() => validarReporteArchivados(null), /Configuración inválida/);
  assert.throws(() => validarReporteArchivados(5), /Configuración inválida/);
});

test('rechaza expedientes que no son arreglo', () => {
  assert.throws(
    () => validarReporteArchivados(base({ expedientes: 'x' })),
    /Expedientes inválidos/
  );
});

test('rechaza expediente sin numeroExpediente', () => {
  assert.throws(
    () =>
      validarReporteArchivados(
        base({ expedientes: [{ fecha: '2026-10-13' }] })
      ),
    /falta "numeroExpediente"/
  );
});

test('rechaza fecha de expediente inválida', () => {
  assert.throws(
    () =>
      validarReporteArchivados(
        base({ expedientes: [{ numeroExpediente: '1', fecha: '2026/10/13' }] })
      ),
    /fecha inválida/
  );
});

test('rechaza numero no entero cuando se envía', () => {
  assert.throws(
    () =>
      validarReporteArchivados(
        base({
          expedientes: [
            { numero: 1.5, numeroExpediente: '1', fecha: '2026-10-13' },
          ],
        })
      ),
    /"numero" debe ser entero/
  );
});

test('rechaza título vacío y fecha de documento inválida', () => {
  assert.throws(
    () => validarReporteArchivados(base({ titulo: '   ' })),
    /Título inválido/
  );
  assert.throws(
    () => validarReporteArchivados(base({ fecha: '13-10-2026' })),
    /Fecha inválida/
  );
});

test('rechaza ruta de salida inválida', () => {
  assert.throws(
    () => validarReporteArchivados(base({ rutaSalida: '' })),
    /Ruta de salida inválida/
  );
});

test('rechaza firmantes inválidos', () => {
  assert.throws(
    () => validarReporteArchivados(base({ firmantes: 'x' })),
    /Firmantes inválidos/
  );
  assert.throws(
    () => validarReporteArchivados(base({ firmantes: [{ cargo: 'X' }] })),
    /falta "nombre"/
  );
});
