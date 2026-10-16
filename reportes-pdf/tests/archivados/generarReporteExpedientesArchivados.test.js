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
  FILAS_POR_TABLA_ULTIMA,
  CAPACIDAD_PAGINA_ULTIMA,
} = require('../../src/pdf/archivados/constantes');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hro-archivados-'));

after(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});

function expedientes(cantidad) {
  return Array.from({ length: cantidad }, (_, i) => ({
    numero: i + 1,
    numeroExpediente: `9${String(i).padStart(5, '0')}`,
    fecha: '2026-10-13',
  }));
}

function configBase(extra = {}) {
  return {
    titulo: 'EXPEDIENTES ARCHIVADOS',
    fecha: '2026-10-13',
    expedientes: expedientes(2),
    firmantes: [
      { nombre: 'Encargado de Archivo', cargo: 'Archivo' },
      { nombre: 'Jefe de Registro Médico' },
    ],
    rutaSalida: path.join(
      TMP,
      `archivados-${Math.random().toString(16).slice(2)}.pdf`
    ),
    ...extra,
  };
}

function decodificarHex(inflado) {
  const partes = [];
  const regex = /<([0-9A-Fa-f]+)>/g;
  let coincidencia;
  while ((coincidencia = regex.exec(inflado)) !== null) {
    if (coincidencia[1].length % 2 === 0) {
      partes.push(Buffer.from(coincidencia[1], 'hex').toString('latin1'));
    }
  }
  return partes.join('');
}

function leerTextoPdf(buffer) {
  const crudo = buffer.toString('latin1');
  const regex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let coincidencia;
  let inflado = '';
  while ((coincidencia = regex.exec(crudo)) !== null) {
    const contenido = Buffer.from(coincidencia[1], 'latin1');
    try {
      inflado += zlib.inflateSync(contenido).toString('latin1');
    } catch (error) {
      inflado += contenido.toString('latin1');
    }
  }
  return decodificarHex(inflado);
}

function contarPaginas(buffer) {
  const crudo = buffer.toString('latin1');
  const coincidencias = crudo.match(/\/Type \/Page\b/g);
  return coincidencias ? coincidencias.length : 0;
}

function contar(texto, patron) {
  const coincidencias = texto.match(patron);
  return coincidencias ? coincidencias.length : 0;
}

function tieneImagenEmbebida(buffer) {
  const crudo = buffer.toString('latin1');
  return /DCTDecode/.test(crudo) || /\/Subtype\s*\/Image/.test(crudo);
}

test('genera un PDF válido con metadata esperada', async () => {
  const config = configBase();
  const resultado = await generarReporteExpedientesArchivados(config);

  assert.equal(resultado.totalExpedientes, 2);
  assert.equal(resultado.titulo, 'EXPEDIENTES ARCHIVADOS');
  assert.ok(resultado.paginas >= 1);
  assert.equal(resultado.rutaArchivo, path.resolve(config.rutaSalida));

  const buffer = fs.readFileSync(resultado.rutaArchivo);
  assert.ok(buffer.length > 0, 'el archivo no debe estar vacío');
  assert.equal(buffer.toString('latin1', 0, 4), '%PDF');
});

test('la lista vacía genera un documento válido con cero expedientes', async () => {
  const resultado = await generarReporteExpedientesArchivados(
    configBase({ expedientes: [] })
  );
  assert.equal(resultado.totalExpedientes, 0);
  assert.equal(resultado.paginas, 1);
  const buffer = fs.readFileSync(resultado.rutaArchivo);
  assert.equal(buffer.toString('latin1', 0, 4), '%PDF');
});

test('respeta títulos dinámicos', async () => {
  const resultado = await generarReporteExpedientesArchivados(
    configBase({ titulo: 'CONTROL DE EXPEDIENTES ARCHIVADOS' })
  );
  const texto = leerTextoPdf(fs.readFileSync(resultado.rutaArchivo));
  assert.match(texto, /CONTROL DE EXPEDIENTES ARCHIVADOS/);
  assert.equal(resultado.titulo, 'CONTROL DE EXPEDIENTES ARCHIVADOS');
});

test('respeta nombres de firmantes dinámicos y solo en la última página', async () => {
  const resultado = await generarReporteExpedientesArchivados(
    configBase({
      expedientes: expedientes(200),
      firmantes: [
        { nombre: 'FIRMANTE ALFA' },
        { nombre: 'FIRMANTE BETA' },
      ],
    })
  );
  const texto = leerTextoPdf(fs.readFileSync(resultado.rutaArchivo));
  assert.equal(contar(texto, /FIRMANTE ALFA/g), 1);
  assert.equal(contar(texto, /FIRMANTE BETA/g), 1);
});

test('presenta la fecha en formato DD/MM/YYYY', async () => {
  const conFecha = Array.from({ length: 10 }, (_, i) => ({
    numero: i + 1,
    numeroExpediente: `9${String(i).padStart(5, '0')}`,
    fecha: '2024-03-05',
  }));
  const resultado = await generarReporteExpedientesArchivados(
    configBase({ expedientes: conFecha })
  );
  const texto = leerTextoPdf(fs.readFileSync(resultado.rutaArchivo));
  assert.equal(contar(texto, /05\/03\/2024/g), 10);
});

test('repite el encabezado institucional y las tres tablas por página', async () => {
  const resultado = await generarReporteExpedientesArchivados(
    configBase({ expedientes: expedientes(200), titulo: 'CONTROL DE ARCHIVO' })
  );
  const buffer = fs.readFileSync(resultado.rutaArchivo);
  const texto = leerTextoPdf(buffer);
  const paginas = contarPaginas(buffer);

  assert.equal(resultado.paginas, paginas);
  assert.equal(contar(texto, /HOSPITAL REGIONAL DE OCCIDENTE/g), paginas);
  assert.equal(contar(texto, /EXPEDIENTE/g), paginas * 3);
  assert.equal(contar(texto, /FECHA/g), paginas * 3);
  assert.match(texto, /Página 1 de \d+/);
});

test('no pierde expedientes y numera de forma continua', async () => {
  for (const cantidad of [1, 10, 30, 50, 100, 200]) {
    const conFecha = Array.from({ length: cantidad }, (_, i) => ({
      numero: i + 1,
      numeroExpediente: `9${String(i).padStart(5, '0')}`,
      fecha: '2024-03-05',
    }));
    const resultado = await generarReporteExpedientesArchivados(
      configBase({ expedientes: conFecha })
    );
    const texto = leerTextoPdf(fs.readFileSync(resultado.rutaArchivo));
    const filas = contar(texto, /05\/03\/2024/g);
    assert.equal(
      filas,
      cantidad,
      `se esperaban ${cantidad} filas y se leyeron ${filas}`
    );
    assert.match(texto, /900000/);
    assert.match(texto, new RegExp(`9${String(cantidad - 1).padStart(5, '0')}`));
  }
});

test('pagina correctamente según la capacidad medida', async () => {
  const casos = [
    { cantidad: 1, paginas: 1 },
    { cantidad: FILAS_POR_TABLA_ULTIMA, paginas: 1 },
    { cantidad: CAPACIDAD_PAGINA_ULTIMA, paginas: 1 },
    { cantidad: CAPACIDAD_PAGINA_ULTIMA + 1, paginas: 2 },
    { cantidad: 138, paginas: 2 },
    { cantidad: 200, paginas: 2 },
  ];
  for (const caso of casos) {
    const resultado = await generarReporteExpedientesArchivados(
      configBase({ expedientes: expedientes(caso.cantidad) })
    );
    assert.equal(
      resultado.paginas,
      caso.paginas,
      `n=${caso.cantidad} debía dar ${caso.paginas} páginas`
    );
  }
});

test('embebe el logo institucional', async () => {
  const resultado = await generarReporteExpedientesArchivados(configBase());
  const buffer = fs.readFileSync(resultado.rutaArchivo);
  assert.ok(tieneImagenEmbebida(buffer));
});

test('rechaza configuraciones inválidas', async () => {
  await assert.rejects(
    () => generarReporteExpedientesArchivados(null),
    /Configuración inválida/
  );
  await assert.rejects(
    () => generarReporteExpedientesArchivados(configBase({ rutaSalida: '' })),
    /Ruta de salida inválida/
  );
});
