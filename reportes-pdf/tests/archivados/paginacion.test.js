'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  FILAS_POR_TABLA_NORMAL,
  FILAS_POR_TABLA_ULTIMA,
  CAPACIDAD_PAGINA_NORMAL,
  CAPACIDAD_PAGINA_ULTIMA,
  ANCHO_TABLA,
  SEPARACION_TABLAS,
  CONTENT_WIDTH,
  COLUMNAS,
  ALTO_FILA,
  ALTO_ENCABEZADO,
  ALTO_FIRMAS,
  GAP_SEGURIDAD,
  TAMANOS,
} = require('../../src/pdf/archivados/constantes');
const {
  planificarPaginas,
  distribuirEnTablas,
  distribuirUltimaPaginaBalanceada,
} = require('../../src/pdf/archivados/dibujarTripleTabla');

test('la geometría permite tres tablas sin solapamiento', () => {
  assert.ok(
    3 * ANCHO_TABLA + 2 * SEPARACION_TABLAS <= CONTENT_WIDTH + 0.001,
    'las tres tablas con separaciones deben caber en el ancho útil'
  );
  const sumaColumnas = COLUMNAS.reduce((total, c) => total + c.width, 0);
  assert.equal(sumaColumnas, ANCHO_TABLA);
});

test('legibilidad: fuente y alto de fila impresos', () => {
  assert.ok(TAMANOS.celda >= 9, `fuente de celdas: ${TAMANOS.celda}`);
  assert.ok(
    TAMANOS.encabezadoTabla >= 9,
    `encabezado de tabla: ${TAMANOS.encabezadoTabla}`
  );
  assert.ok(
    ALTO_FILA >= 15 && ALTO_FILA <= 15.5,
    `alto de fila fuera de rango: ${ALTO_FILA}`
  );
});

test('zonas verticales separadas y capacidades derivadas de geometría', () => {
  assert.ok(ALTO_ENCABEZADO >= 55 && ALTO_ENCABEZADO <= 65, `encabezado: ${ALTO_ENCABEZADO}`);
  assert.ok(ALTO_FIRMAS >= 70 && ALTO_FIRMAS <= 80, `firmas: ${ALTO_FIRMAS}`);
  assert.ok(GAP_SEGURIDAD >= 10 && GAP_SEGURIDAD <= 14, `gap: ${GAP_SEGURIDAD}`);
  assert.equal(CAPACIDAD_PAGINA_NORMAL, FILAS_POR_TABLA_NORMAL * 3);
  assert.equal(CAPACIDAD_PAGINA_ULTIMA, FILAS_POR_TABLA_ULTIMA * 3);
});

test('la página normal aprovecha más espacio que la última', () => {
  assert.ok(
    FILAS_POR_TABLA_NORMAL > FILAS_POR_TABLA_ULTIMA,
    `normal (${FILAS_POR_TABLA_NORMAL}) debe ser mayor que última (${FILAS_POR_TABLA_ULTIMA})`
  );
  assert.ok(CAPACIDAD_PAGINA_NORMAL > CAPACIDAD_PAGINA_ULTIMA);
});

test('distribuirEnTablas llena por columna (columna-mayor)', () => {
  const cap = FILAS_POR_TABLA_NORMAL;
  assert.deepEqual(distribuirEnTablas(0, cap), [0, 0, 0]);
  assert.deepEqual(distribuirEnTablas(cap, cap), [cap, 0, 0]);
  assert.deepEqual(
    distribuirEnTablas(cap + Math.floor(cap / 2), cap),
    [cap, Math.floor(cap / 2), 0]
  );
  assert.deepEqual(distribuirEnTablas(cap * 3, cap), [cap, cap, cap]);
});

test('distribuirUltimaPaginaBalanceada reparte y balancea', () => {
  assert.deepEqual(distribuirUltimaPaginaBalanceada(0), [0, 0, 0]);
  assert.deepEqual(distribuirUltimaPaginaBalanceada(10), [4, 3, 3]);
  assert.deepEqual(distribuirUltimaPaginaBalanceada(30), [10, 10, 10]);
  assert.deepEqual(distribuirUltimaPaginaBalanceada(50), [17, 17, 16]);
  assert.deepEqual(distribuirUltimaPaginaBalanceada(100), [34, 33, 33]);
  assert.deepEqual(distribuirUltimaPaginaBalanceada(138), [46, 46, 46]);
});

test('distribuirUltimaPaginaBalanceada: suma, balance y tope', () => {
  for (let n = 1; n <= CAPACIDAD_PAGINA_ULTIMA; n += 1) {
    const d = distribuirUltimaPaginaBalanceada(n);
    assert.equal(d.reduce((t, x) => t + x, 0), n, `suma incorrecta n=${n}`);
    assert.ok(Math.max(...d) - Math.min(...d) <= 1, `desbalanceado n=${n}`);
    d.forEach((c) =>
      assert.ok(c <= FILAS_POR_TABLA_ULTIMA, `excede capacidad n=${n}`)
    );
  }
});

test('planificarPaginas: sin filas produce una página vacía', () => {
  assert.deepEqual(planificarPaginas(0), [0]);
});

test('planificarPaginas: cabecera en una sola página', () => {
  assert.deepEqual(planificarPaginas(1), [1]);
  assert.deepEqual(planificarPaginas(CAPACIDAD_PAGINA_ULTIMA), [
    CAPACIDAD_PAGINA_ULTIMA,
  ]);
});

test('planificarPaginas: no deja una última página casi vacía', () => {
  const paginas = planificarPaginas(CAPACIDAD_PAGINA_ULTIMA + 1);
  assert.equal(paginas.length, 2);
  assert.equal(
    paginas.reduce((total, p) => total + p, 0),
    CAPACIDAD_PAGINA_ULTIMA + 1
  );
  assert.ok(paginas[paginas.length - 1] >= FILAS_POR_TABLA_ULTIMA);
});

test('planificarPaginas: invariantes para un rango amplio', () => {
  for (let n = 1; n <= 800; n += 1) {
    const paginas = planificarPaginas(n);
    assert.equal(
      paginas.reduce((total, p) => total + p, 0),
      n,
      `se perdieron filas para n=${n}`
    );
    paginas.slice(0, -1).forEach((p) =>
      assert.ok(p <= CAPACIDAD_PAGINA_NORMAL, `intermedia desbordada n=${n}`)
    );
    assert.ok(
      paginas[paginas.length - 1] <= CAPACIDAD_PAGINA_ULTIMA,
      `última desbordada n=${n}`
    );
    if (paginas.length >= 2) {
      assert.ok(
        paginas[paginas.length - 1] >= FILAS_POR_TABLA_ULTIMA,
        `última página casi vacía (n=${n}, último=${paginas[paginas.length - 1]})`
      );
    }
  }
});
