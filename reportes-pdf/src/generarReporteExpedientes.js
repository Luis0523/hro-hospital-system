'use strict';

const fs = require('node:fs');
const path = require('node:path');
const PDFDocument = require('pdfkit');

const { validarReporte } = require('./validarReporte');
const { normalizarReporte } = require('./normalizarReporte');
const { MARGENES } = require('./pdf/constantes');
const { dibujarEncabezado } = require('./pdf/dibujarEncabezado');
const { dibujarTabla } = require('./pdf/dibujarTabla');
const {
  dibujarObservaciones,
  calcularAltoObservaciones,
} = require('./pdf/dibujarObservaciones');
const { dibujarFirmas, ALTO_FIRMAS } = require('./pdf/dibujarFirmas');
const { dibujarPiesPagina } = require('./pdf/dibujarPiePagina');

function crearDocumento(datos) {
  return new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: MARGENES,
    bufferPages: true,
    info: {
      Title: datos.textos.titulo,
      Author: 'Hospital Regional de Occidente — Sistema HRO',
      Subject: `${datos.origen} \u2192 ${datos.destino}`,
      Keywords: `${datos.idDocumento}, expedientes, ${datos.tipo}`,
      CreationDate: datos.fechaGeneracion,
    },
  });
}

function dibujarContenido(doc, datos) {
  const dibujarEncabezadoPagina = (documento) =>
    dibujarEncabezado(documento, datos, { resumido: true });

  let y = dibujarEncabezado(doc, datos);

  const altoFooter =
    22 + calcularAltoObservaciones(doc, datos) + 26 + ALTO_FIRMAS;

  y = dibujarTabla(doc, datos, y + 4, { dibujarEncabezadoPagina, altoFooter });
  y = dibujarObservaciones(doc, datos, y + 22, { dibujarEncabezadoPagina });
  dibujarFirmas(doc, datos, y + 26, { dibujarEncabezadoPagina });
  dibujarPiesPagina(doc, datos);
}

async function generarReporteExpedientes(config) {
  validarReporte(config);
  const datos = normalizarReporte(config);

  const rutaAbsoluta = path.resolve(datos.rutaSalida);
  const directorio = path.dirname(rutaAbsoluta);
  fs.mkdirSync(directorio, { recursive: true });

  const doc = crearDocumento(datos);
  const stream = fs.createWriteStream(rutaAbsoluta);

  return new Promise((resolve, reject) => {
    const manejarError = (error) => {
      reject(new Error(`Error al generar el PDF: ${error.message}`));
    };

    stream.on('finish', () => {
      resolve({
        rutaArchivo: rutaAbsoluta,
        totalExpedientes: datos.totalExpedientes,
        tipo: datos.tipo,
        fecha: datos.fecha,
        idDocumento: datos.idDocumento,
      });
    });
    stream.on('error', manejarError);
    doc.on('error', manejarError);

    doc.pipe(stream);

    try {
      dibujarContenido(doc, datos);
    } catch (error) {
      doc.destroy();
      stream.destroy();
      reject(new Error(`Error al generar el PDF: ${error.message}`));
      return;
    }

    doc.end();
  });
}

module.exports = { generarReporteExpedientes };
