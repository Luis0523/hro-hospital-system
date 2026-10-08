'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PDFDocument = require('pdfkit');

const { generarReporteExpedientes } = require('../src');
const { normalizarReporte } = require('../src/normalizarReporte');
const { LOGO_HRO_POR_DEFECTO } = require('../src/pdf/constantes');
const { dibujarLogo } = require('../src/pdf/dibujarEncabezado');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hro-logo-'));

after(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});

function expedientes(cantidad) {
  return Array.from({ length: cantidad }, (_, i) => ({
    numeroExpediente: String(101011 + i),
    pacienteNombre: `PACIENTE DE PRUEBA ${i + 1}`,
    subespecialidadNombre: 'Cirugía General',
    horaEstimada: '11:40',
  }));
}

function configBase(extra = {}) {
  return {
    tipo: 'salida',
    fecha: '2026-10-05',
    expedientes: expedientes(3),
    rutaSalida: path.join(TMP, `logo-${Math.random().toString(16).slice(2)}.pdf`),
    ...extra,
  };
}

function tieneImagenEmbebida(buffer) {
  const crudo = buffer.toString('latin1');
  return /DCTDecode/.test(crudo) || /\/Subtype\s*\/Image/.test(crudo);
}

test('el asset institucional existe', () => {
  assert.ok(
    fs.existsSync(LOGO_HRO_POR_DEFECTO),
    `no existe el logo por defecto: ${LOGO_HRO_POR_DEFECTO}`
  );
  assert.ok(fs.statSync(LOGO_HRO_POR_DEFECTO).size > 0);
});

test('normaliza logoIzquierdo al asset por defecto si no se especifica', () => {
  const datos = normalizarReporte(configBase());
  assert.equal(datos.logoIzquierdo, LOGO_HRO_POR_DEFECTO);
  assert.equal(datos.logoIzquierdoFallback, LOGO_HRO_POR_DEFECTO);
});

test('conserva logoIzquierdo personalizado y su fallback', () => {
  const datos = normalizarReporte(
    configBase({ logoIzquierdo: '/ruta/personalizado.png' })
  );
  assert.equal(datos.logoIzquierdo, '/ruta/personalizado.png');
  assert.equal(datos.logoIzquierdoFallback, LOGO_HRO_POR_DEFECTO);
});

test('genera el reporte sin especificar logo y embebe el logo por defecto', async () => {
  const resultado = await generarReporteExpedientes(configBase());
  const buffer = fs.readFileSync(resultado.rutaArchivo);
  assert.ok(buffer.length > 0);
  assert.equal(buffer.toString('latin1', 0, 4), '%PDF');
  assert.ok(
    tieneImagenEmbebida(buffer),
    'el PDF debe incluir el logo embebido por defecto'
  );
});

test('genera el reporte con un logo personalizado válido', async () => {
  const resultado = await generarReporteExpedientes(
    configBase({ logoIzquierdo: LOGO_HRO_POR_DEFECTO })
  );
  const buffer = fs.readFileSync(resultado.rutaArchivo);
  assert.ok(tieneImagenEmbebida(buffer));
});

test('una ruta personalizada inválida no rompe el reporte (usa el default)', async () => {
  const resultado = await generarReporteExpedientes(
    configBase({ logoIzquierdo: path.join(TMP, 'no-existe.png') })
  );
  const buffer = fs.readFileSync(resultado.rutaArchivo);
  assert.equal(buffer.toString('latin1', 0, 4), '%PDF');
  assert.ok(
    tieneImagenEmbebida(buffer),
    'al fallar el logo personalizado debe caer al institucional'
  );
});

test('si ningún logo está disponible, se omite sin lanzar error', () => {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
  const dibujado = dibujarLogo(
    doc,
    path.join(TMP, 'inexistente-1.jpg'),
    path.join(TMP, 'inexistente-2.jpg'),
    40,
    40,
    46
  );
  assert.equal(dibujado, false);
  doc.end();
});
