'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');

const {
  generarReporteExpedientesArchivados,
} = require('../../src');
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
  INICIO_FILAS,
  LIMITE_TABLA_NORMAL,
  LIMITE_TABLA_ULTIMA,
  Y_INICIO_FIRMAS,
  GAP_SEGURIDAD,
} = require('../../src/pdf/archivados/constantes');
const {
  planificarPaginas,
  distribuirEnTablas,
  distribuirUltimaPaginaBalanceada,
} = require('../../src/pdf/archivados/dibujarTripleTabla');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hro-frontera-'));
const FIRMANTE = 'FIRMANTE DE FRONTERA';

after(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});

// Casos obligatorios de validación (capacidades derivadas de la geometría).
const CASOS = [
  { n: 1, paginas: 1 },
  { n: 10, paginas: 1 },
  { n: 30, paginas: 1 },
  { n: 50, paginas: 1 },
  { n: 100, paginas: 1 },
  { n: 114, paginas: 1 },
  { n: 115, paginas: 2 },
  { n: 120, paginas: 2 },
  { n: 138, paginas: 2 },
  { n: 139, paginas: 2 },
  { n: 150, paginas: 2 },
  { n: 151, paginas: 2 },
  { n: 200, paginas: 2 },
  { n: 250, paginas: 3 },
  { n: 300, paginas: 3 },
];

function construir(n) {
  return Array.from({ length: n }, (_, i) => ({
    numero: i + 1,
    numeroExpediente: `9${String(i).padStart(5, '0')}`,
    fecha: '2024-03-05',
  }));
}

function configBase(n) {
  return {
    titulo: 'CONTROL DE ARCHIVO',
    expedientes: construir(n),
    firmantes: [{ nombre: FIRMANTE }],
    rutaSalida: path.join(
      TMP,
      `frontera-${n}-${Math.random().toString(16).slice(2)}.pdf`
    ),
  };
}

function distribucionDePagina(indice, cantidadPagina, totalPaginas) {
  return indice === totalPaginas - 1
    ? distribuirUltimaPaginaBalanceada(cantidadPagina)
    : distribuirEnTablas(cantidadPagina, FILAS_POR_TABLA_NORMAL);
}

// ------------------------------------------------------------------
// Geometría vertical y distribución (lógica real)
// ------------------------------------------------------------------
test('geometría: firmas solo en la última página; tablas sin invadirla', () => {
  for (const caso of CASOS) {
    const paginas = planificarPaginas(caso.n);
    assert.equal(paginas.length, caso.paginas, `n=${caso.n}`);
    paginas.forEach((cantidadPagina, indice) => {
      const esUltima = indice === paginas.length - 1;
      const dist = distribucionDePagina(indice, cantidadPagina, paginas.length);
      const maxFilas = Math.max(...dist);
      const yFin = INICIO_FILAS + maxFilas * ALTO_FILA;
      const limite = esUltima ? LIMITE_TABLA_ULTIMA : LIMITE_TABLA_NORMAL;

      assert.ok(
        yFin <= limite + 0.001,
        `n=${caso.n} pág=${indice + 1}: tabla (${yFin}) supera límite (${limite})`
      );
      if (esUltima) {
        // La última página nunca toca la zona de firmas.
        assert.ok(yFin <= Y_INICIO_FIRMAS - GAP_SEGURIDAD + 0.001);
        const dist2 = dist;
        dist2.forEach((c) => assert.ok(c <= FILAS_POR_TABLA_ULTIMA));
      } else {
        // Las intermedias pueden usar más alto, pero respetan capacidad normal.
        dist.forEach((c) => assert.ok(c <= FILAS_POR_TABLA_NORMAL));
      }
    });
  }
});

test('planner: cobertura exacta sin huecos, duplicados ni omisiones', () => {
  for (const caso of CASOS) {
    const paginas = planificarPaginas(caso.n);
    let base = 0;
    const globales = [];
    paginas.forEach((cantidadPagina, indice) => {
      const dist = distribucionDePagina(indice, cantidadPagina, paginas.length);
      const inicios = [0, dist[0], dist[0] + dist[1]];
      const maxFilas = Math.max(...dist);
      for (let fila = 0; fila < maxFilas; fila += 1) {
        for (let tabla = 0; tabla < 3; tabla += 1) {
          if (fila < dist[tabla]) {
            globales.push(base + inicios[tabla] + fila);
          }
        }
      }
      base += cantidadPagina;
    });
    assert.deepEqual(
      globales.slice().sort((a, b) => a - b),
      Array.from({ length: caso.n }, (_, i) => i),
      `n=${caso.n}: índices con huecos, duplicados u omisiones`
    );
  }
});

test('páginas intermedias usan mayor capacidad que la última', () => {
  assert.ok(FILAS_POR_TABLA_NORMAL > FILAS_POR_TABLA_ULTIMA);
  const paginas = planificarPaginas(CAPACIDAD_PAGINA_NORMAL * 2 + 5);
  const dist = distribucionDePagina(0, paginas[0], paginas.length);
  assert.deepEqual(dist, [
    FILAS_POR_TABLA_NORMAL,
    FILAS_POR_TABLA_NORMAL,
    FILAS_POR_TABLA_NORMAL,
  ]);
});

test('última página: usa las 3 tablas y queda balanceada', () => {
  for (const caso of CASOS) {
    const paginas = planificarPaginas(caso.n);
    const ultima = distribuirUltimaPaginaBalanceada(paginas[paginas.length - 1]);
    assert.equal(ultima.reduce((t, x) => t + x, 0), paginas[paginas.length - 1]);
    assert.ok(Math.max(...ultima) - Math.min(...ultima) <= 1, `n=${caso.n} desbalanceada`);
    ultima.forEach((c) => assert.ok(c <= CAPACIDAD_PAGINA_ULTIMA));
    if (paginas[paginas.length - 1] >= 3) {
      assert.ok(ultima.every((c) => c > 0), `n=${caso.n}: no usa las 3 tablas`);
    }
  }
});

test('100 registros → última página [34,33,33] (no [50,50,0])', () => {
  const ultima = distribuirUltimaPaginaBalanceada(100);
  assert.deepEqual(ultima, [34, 33, 33]);
  assert.notDeepEqual(ultima, [50, 50, 0]);
});

test('la geometría de tres tablas no se solapa', () => {
  assert.ok(3 * ANCHO_TABLA + 2 * SEPARACION_TABLAS <= CONTENT_WIDTH + 0.001);
  assert.equal(
    COLUMNAS.reduce((total, c) => total + c.width, 0),
    ANCHO_TABLA
  );
});

// ------------------------------------------------------------------
// PDF real (integración)
// ------------------------------------------------------------------
function extraerTokens(buffer) {
  const crudo = buffer.toString('latin1');
  const reStream = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let texto = '';
  let m;
  while ((m = reStream.exec(crudo)) !== null) {
    const contenido = Buffer.from(m[1], 'latin1');
    try {
      const inflado = zlib.inflateSync(contenido).toString('latin1');
      if (/T[Jj]/.test(inflado)) {
        texto += inflado;
      }
    } catch (error) {
      // Stream no textual (imagen del logo): se ignora.
    }
  }

  const tokens = [];
  const reTJ = /\[([^\]]*)\]\s*TJ/g;
  let t;
  while ((t = reTJ.exec(texto)) !== null) {
    const partes = [];
    const reHex = /<([0-9A-Fa-f]+)>/g;
    let h;
    while ((h = reHex.exec(t[1])) !== null) {
      if (h[1].length % 2 === 0) {
        partes.push(Buffer.from(h[1], 'hex').toString('latin1'));
      }
    }
    tokens.push(partes.join(''));
  }
  return tokens;
}

function contarPaginas(buffer) {
  const crudo = buffer.toString('latin1');
  const coincidencias = crudo.match(/\/Type \/Page\b/g);
  return coincidencias ? coincidencias.length : 0;
}

function conteo(tokens, valor) {
  return tokens.filter((t) => t === valor).length;
}

for (const caso of CASOS) {
  test(`PDF n=${caso.n}: integridad completa`, async () => {
    const resultado = await generarReporteExpedientesArchivados(configBase(caso.n));
    assert.equal(resultado.totalExpedientes, caso.n);
    assert.equal(resultado.paginas, caso.paginas);

    const buffer = fs.readFileSync(resultado.rutaArchivo);
    assert.equal(buffer.toString('latin1', 0, 4), '%PDF');
    assert.equal(contarPaginas(buffer), caso.paginas);

    const tokens = extraerTokens(buffer);

    assert.ok(
      /DCTDecode/.test(buffer.toString('latin1')) ||
        /\/Subtype\s*\/Image/.test(buffer.toString('latin1')),
      'logo no embebido'
    );
    assert.equal(conteo(tokens, 'HOSPITAL REGIONAL DE OCCIDENTE'), caso.paginas);
    assert.equal(conteo(tokens, 'NO.'), caso.paginas * 3);
    assert.equal(conteo(tokens, 'EXPEDIENTE'), caso.paginas * 3);
    assert.equal(conteo(tokens, 'FECHA'), caso.paginas * 3);

    const numeros = tokens
      .filter(
        (t) =>
          /^\d+$/.test(t) &&
          t.length <= 4 &&
          Number(t) >= 1 &&
          Number(t) <= caso.n
      )
      .map(Number);
    assert.equal(numeros.length, caso.n, 'cantidad de renglones incorrecta');
    assert.deepEqual(
      numeros.slice().sort((a, b) => a - b),
      Array.from({ length: caso.n }, (_, i) => i + 1),
      'numeración con huecos/duplicados/omisiones'
    );

    const expedientes = tokens.filter(
      (t) => /^\d{6}$/.test(t) && t.startsWith('9')
    );
    assert.equal(expedientes.length, caso.n);
    assert.deepEqual(
      expedientes.slice().sort(),
      construir(caso.n)
        .map((e) => e.numeroExpediente)
        .sort(),
      'expedientes duplicados u omitidos'
    );

    assert.equal(tokens.filter((t) => t === '05/03/2024').length, caso.n);
    assert.equal(conteo(tokens, FIRMANTE), 1, 'firmas no solo en la última página');

    const pies = tokens.filter((t) => /^Página \d+ de \d+$/.test(t));
    assert.equal(pies.length, caso.paginas);
    pies.forEach((valor, i) =>
      assert.equal(valor, `Página ${i + 1} de ${caso.paginas}`)
    );
  });
}
