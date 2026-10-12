'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');

const { generarReporteExpedientes } = require('../src');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hro-pdf-'));

after(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});

function expedientes(cantidad) {
  return Array.from({ length: cantidad }, (_, i) => ({
    numeroExpediente: String(101011 + i),
    pacienteNombre: `PACIENTE DE PRUEBA ${i + 1}`,
    subespecialidadNombre: 'Cirugía General',
    horaEstimada: '11:40',
    estadoActual: 'en_transito_entrega',
  }));
}

function configBase(extra = {}) {
  return {
    tipo: 'salida',
    fecha: '2026-10-05',
    generadoPor: 'Prueba Automatizada',
    responsableEntrega: 'Archivo',
    responsableRecibe: 'COEX',
    expedientes: expedientes(2),
    observaciones: '',
    rutaSalida: path.join(TMP, `reporte-${Math.random().toString(16).slice(2)}.pdf`),
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

test('genera un archivo PDF de salida con metadata esperada', async () => {
  const config = configBase({ tipo: 'salida' });
  const resultado = await generarReporteExpedientes(config);

  assert.equal(resultado.tipo, 'salida');
  assert.equal(resultado.fecha, '2026-10-05');
  assert.equal(resultado.totalExpedientes, 2);
  assert.equal(resultado.idDocumento, 'SAL-20261005');
  assert.equal(resultado.rutaArchivo, path.resolve(config.rutaSalida));

  const buffer = fs.readFileSync(resultado.rutaArchivo);
  assert.ok(buffer.length > 0, 'el archivo no debe estar vacío');
  assert.equal(buffer.toString('latin1', 0, 4), '%PDF');
});

test('genera un archivo PDF de devolución', async () => {
  const config = configBase({ tipo: 'devolucion' });
  const resultado = await generarReporteExpedientes(config);
  assert.equal(resultado.tipo, 'devolucion');
  assert.equal(resultado.idDocumento, 'DEV-20261005');

  const buffer = fs.readFileSync(resultado.rutaArchivo);
  assert.equal(buffer.toString('latin1', 0, 4), '%PDF');
});

test('crea el directorio de salida si no existe', async () => {
  const ruta = path.join(TMP, 'anidado', 'profundo', 'reporte.pdf');
  const resultado = await generarReporteExpedientes(
    configBase({ rutaSalida: ruta })
  );
  assert.ok(fs.existsSync(resultado.rutaArchivo));
});

test('rechaza configuración nula', async () => {
  await assert.rejects(
    () => generarReporteExpedientes(null),
    /Configuración inválida/
  );
});

test('rechaza tipo no soportado', async () => {
  await assert.rejects(
    () => generarReporteExpedientes(configBase({ tipo: 'otro' })),
    /Tipo no soportado/
  );
});

test('rechaza fecha inválida', async () => {
  await assert.rejects(
    () => generarReporteExpedientes(configBase({ fecha: '2026/10/05' })),
    /Fecha inválida/
  );
});

test('rechaza expedientes que no son arreglo', async () => {
  await assert.rejects(
    () => generarReporteExpedientes(configBase({ expedientes: 5 })),
    /Expedientes inválidos/
  );
});

test('genera PDF con lista de expedientes vacía', async () => {
  const resultado = await generarReporteExpedientes(
    configBase({ expedientes: [] })
  );
  assert.equal(resultado.totalExpedientes, 0);
  const buffer = fs.readFileSync(resultado.rutaArchivo);
  assert.ok(buffer.length > 0);
});

test('salida y devolución son documentos distintos', async () => {
  const salida = await generarReporteExpedientes(configBase({ tipo: 'salida' }));
  const devolucion = await generarReporteExpedientes(
    configBase({ tipo: 'devolucion' })
  );

  const textoSalida = leerTextoPdf(fs.readFileSync(salida.rutaArchivo));
  const textoDevolucion = leerTextoPdf(fs.readFileSync(devolucion.rutaArchivo));

  assert.match(textoSalida, /CONTROL DE SALIDA DE EXPEDIENTES/);
  assert.match(textoDevolucion, /CONTROL DE DEVOLUCIÓN DE EXPEDIENTES/);
  assert.match(textoSalida, /ENVIADO/);
  assert.match(textoDevolucion, /DEVUELTO/);
  assert.notEqual(
    fs.readFileSync(salida.rutaArchivo).length,
    0,
    'la salida no debe estar vacía'
  );
  assert.notDeepEqual(
    fs.readFileSync(salida.rutaArchivo),
    fs.readFileSync(devolucion.rutaArchivo)
  );
});

test('soporta exactamente un expediente', async () => {
  const resultado = await generarReporteExpedientes(
    configBase({ expedientes: expedientes(1) })
  );
  const buffer = fs.readFileSync(resultado.rutaArchivo);
  assert.equal(contarPaginas(buffer), 1);
});

test('soporta 22 expedientes', async () => {
  const resultado = await generarReporteExpedientes(
    configBase({ expedientes: expedientes(22) })
  );
  const buffer = fs.readFileSync(resultado.rutaArchivo);
  assert.ok(buffer.length > 0);
});

test('50 expedientes generan múltiples páginas y repiten encabezado', async () => {
  const resultado = await generarReporteExpedientes(
    configBase({ expedientes: expedientes(50) })
  );
  const buffer = fs.readFileSync(resultado.rutaArchivo);
  const paginas = contarPaginas(buffer);
  const texto = leerTextoPdf(buffer);

  assert.ok(paginas > 1, `se esperaban varias páginas, se obtuvieron ${paginas}`);

  const encabezados = texto.match(/ENVIADO/g);
  assert.ok(
    encabezados && encabezados.length >= paginas,
    `el encabezado de tabla debe repetirse por página (encabezados=${encabezados ? encabezados.length : 0}, páginas=${paginas})`
  );

  assert.match(texto, /Página 1 de \d+/);
  assert.match(texto, /Entrega - Archivo/);
});

test('regresión de paginación: 30 expedientes conservan filas, observaciones y firmas', async () => {
  const resultado = await generarReporteExpedientes(
    configBase({ tipo: 'salida', expedientes: expedientes(30) })
  );
  const buffer = fs.readFileSync(resultado.rutaArchivo);
  const texto = leerTextoPdf(buffer);
  const paginas = contarPaginas(buffer);

  assert.ok(paginas > 1, 'un reporte grande debe paginar');

  const filas = texto.match(/PACIENTE DE PRUEBA/g) || [];
  assert.ok(
    filas.length >= 30,
    `deben aparecer las 30 filas (encontradas=${filas.length})`
  );

  assert.match(texto, /OBSERVACIONES/);
  assert.match(texto, /Entrega - Archivo/);
  assert.match(texto, /Recibe - COEX/);
  assert.match(texto, /Página 1 de \d+/);
});
