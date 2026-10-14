'use strict';

const fs = require('node:fs');
const path = require('node:path');
const PDFDocument = require('pdfkit');

const { validarReporteArchivados } = require('./validarArchivados');
const { normalizarArchivados } = require('./normalizarArchivados');
const {
  PAGINA,
  MARGENES,
  INICIO_TABLAS,
  FILAS_POR_TABLA_NORMAL,
} = require('./pdf/archivados/constantes');
const { dibujarEncabezado } = require('./pdf/archivados/dibujarEncabezado');
const {
  dibujarEncabezadoTablas,
  dibujarFilaTriple,
  distribuirEnTablas,
  distribuirUltimaPaginaBalanceada,
  planificarPaginas,
} = require('./pdf/archivados/dibujarTripleTabla');
const { dibujarFirmas } = require('./pdf/archivados/dibujarFirmas');
const { dibujarPiePagina } = require('./pdf/archivados/dibujarPiePagina');

function crearDocumento(datos) {
  return new PDFDocument({
    size: [PAGINA.width, PAGINA.height],
    margins: MARGENES,
    bufferPages: true,
    info: {
      Title: datos.titulo,
      Author: 'Hospital Regional de Occidente — Sistema HRO',
      Subject: datos.titulo,
      Keywords: 'expedientes, archivados, control, HRO',
      Creator: 'Sistema HRO — reportes-pdf',
      CreationDate: datos.fechaGeneracion,
    },
  });
}

function dibujarContenido(doc, datos) {
  const planes = planificarPaginas(datos.totalExpedientes);
  let indiceGlobal = 0;

  planes.forEach((cantidadPagina, indicePagina) => {
    if (indicePagina > 0) {
      doc.addPage();
    }

    dibujarEncabezado(doc, datos);
    let y = dibujarEncabezadoTablas(doc, INICIO_TABLAS);

    const esUltimaPagina = indicePagina === planes.length - 1;
    const distribucion = esUltimaPagina
      ? distribuirUltimaPaginaBalanceada(cantidadPagina)
      : distribuirEnTablas(cantidadPagina, FILAS_POR_TABLA_NORMAL);
    const inicios = [0, distribucion[0], distribucion[0] + distribucion[1]];
    const maxFilas = Math.max(...distribucion);

    for (let fila = 0; fila < maxFilas; fila += 1) {
      const celdas = [0, 1, 2].map((tabla) => {
        const global = indiceGlobal + inicios[tabla] + fila;
        return fila < distribucion[tabla] && global < datos.totalExpedientes
          ? datos.expedientes[global]
          : null;
      });
      y = dibujarFilaTriple(doc, y, celdas, fila % 2 === 1);
    }

    indiceGlobal += cantidadPagina;
  });

  dibujarFirmas(doc, datos);
  dibujarPiePagina(doc, datos);

  return planes.length;
}

async function generarReporteExpedientesArchivados(config) {
  validarReporteArchivados(config);
  const datos = normalizarArchivados(config);

  const rutaAbsoluta = path.resolve(datos.rutaSalida);
  fs.mkdirSync(path.dirname(rutaAbsoluta), { recursive: true });

  const doc = crearDocumento(datos);
  const stream = fs.createWriteStream(rutaAbsoluta);
  let paginas = 1;

  return new Promise((resolve, reject) => {
    const manejarError = (error) => {
      reject(new Error(`Error al generar el PDF: ${error.message}`));
    };

    stream.on('finish', () => {
      resolve({
        rutaArchivo: rutaAbsoluta,
        totalExpedientes: datos.totalExpedientes,
        paginas,
        titulo: datos.titulo,
      });
    });
    stream.on('error', manejarError);
    doc.on('error', manejarError);

    doc.pipe(stream);

    try {
      paginas = dibujarContenido(doc, datos);
    } catch (error) {
      doc.destroy();
      stream.destroy();
      reject(new Error(`Error al generar el PDF: ${error.message}`));
      return;
    }

    doc.end();
  });
}

module.exports = { generarReporteExpedientesArchivados };
