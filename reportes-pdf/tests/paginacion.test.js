'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { planificarPaginas } = require('../src/pdf/dibujarTabla');

const LIMITE = 595.28 - 52;
const OPCIONES = {
  inicioFull: 262,
  inicioCont: 102,
  limite: LIMITE,
  altoFooter: 212,
};

function alturas(cantidad, valor = 16.6) {
  return Array.from({ length: cantidad }, () => valor);
}

function sumaGrupo(grupo, hs) {
  return grupo.indices.reduce((total, i) => total + hs[i], 0);
}

test('sin filas devuelve un plan vacío', () => {
  assert.deepEqual(planificarPaginas([], OPCIONES), []);
});

test('no repagina cuando el pie cabe en la última página', () => {
  const hs = alturas(3);
  const grupos = planificarPaginas(hs, OPCIONES);
  assert.equal(grupos.length, 1);
  assert.equal(grupos[0].indices.length, 3);
});

test('reubica filas finales para que el pie conviva con expedientes', () => {
  const hs = alturas(30);
  const grupos = planificarPaginas(hs, OPCIONES);
  const ultimo = grupos[grupos.length - 1];

  assert.ok(grupos.length >= 2, 'debe haber al menos dos páginas');
  assert.ok(
    ultimo.indices.length >= 1,
    'la última página debe conservar expedientes'
  );

  const todos = grupos.flatMap((g) => g.indices).sort((a, b) => a - b);
  assert.deepEqual(
    todos,
    Array.from({ length: 30 }, (_, i) => i),
    'deben conservarse todas las filas exactamente una vez'
  );

  grupos.slice(0, -1).forEach((grupo) => {
    assert.ok(
      sumaGrupo(grupo, hs) <= LIMITE - grupo.inicio,
      'las páginas de tabla no deben exceder su capacidad'
    );
  });
  assert.ok(
    sumaGrupo(ultimo, hs) <= LIMITE - OPCIONES.altoFooter - ultimo.inicio,
    'la última página debe reservar espacio para observaciones y firmas'
  );
});

test('cubre todas las filas con alturas variables', () => {
  const hs = [16.6, 40, 16.6, 60, 16.6, 16.6, 90, 16.6, 16.6, 16.6, 16.6, 16.6];
  const grupos = planificarPaginas(hs, OPCIONES);
  const todos = grupos.flatMap((g) => g.indices).sort((a, b) => a - b);
  assert.deepEqual(
    todos,
    hs.map((_, i) => i)
  );
});
