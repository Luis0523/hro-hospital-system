'use strict';

const fs = require('node:fs');

const {
  CONTENT_WIDTH,
  MARGENES,
  COLORES,
  FUENTES,
  TAMANOS,
} = require('./constantes');
const { formatearFecha, formatearFechaHora } = require('./helpers');

const TAMANO_LOGO = 46;
const SEPARACION_LOGO_TEXTO = 14;

function intentarImagen(doc, ruta, x, y, tamano) {
  if (!ruta) {
    return false;
  }
  try {
    if (!fs.existsSync(ruta)) {
      return false;
    }
    doc.image(ruta, x, y, { fit: [tamano, tamano] });
    return true;
  } catch (error) {
    return false;
  }
}

function dibujarLogo(doc, ruta, rutaFallback, x, y, tamano) {
  const dibujado = intentarImagen(doc, ruta, x, y, tamano);
  if (dibujado) {
    return true;
  }
  return intentarImagen(doc, rutaFallback, x, y, tamano);
}

function dibujarInfo(doc, datos, y) {
  const left = MARGENES.left;
  const anchoPanel = CONTENT_WIDTH;
  const altoPanel = 68;
  const filas = 4;
  const altoFila = 14;

  doc
    .save()
    .roundedRect(left, y, anchoPanel, altoPanel, 4)
    .fillAndStroke(COLORES.panel, COLORES.borde)
    .restore();

  const columnas = [
    [
      ['Fecha de movimientos', formatearFecha(datos.fecha)],
      ['Documento', datos.idDocumento],
      ['Total de expedientes', String(datos.totalExpedientes)],
      ['Generado el', formatearFechaHora(datos.fechaGeneracion)],
    ],
    [
      ['Origen', datos.origen],
      ['Destino', datos.destino],
      ['Generado por', datos.generadoPor],
      ['', ''],
    ],
  ];

  columnas.forEach((columna, indiceColumna) => {
    const baseX = indiceColumna === 0 ? left + 10 : left + anchoPanel / 2 + 4;
    const valorColX = baseX + 112;
    const anchoValor = anchoPanel / 2 - 130;
    columna.forEach((fila, indiceFila) => {
      const [etiqueta, valor] = fila;
      if (!etiqueta) {
        return;
      }
      const filaY = y + 9 + indiceFila * altoFila;
      doc
        .font(FUENTES.negrita)
        .fontSize(TAMANOS.etiqueta)
        .fillColor(COLORES.textoSuave)
        .text(`${etiqueta}:`, baseX, filaY, { lineBreak: false });
      doc
        .font(FUENTES.normal)
        .fontSize(TAMANOS.celda)
        .fillColor(COLORES.texto)
        .text(valor, valorColX, filaY - 0.5, {
          width: anchoValor,
          lineBreak: false,
          ellipsis: true,
        });
    });
  });

  return y + altoPanel + 12;
}

function dibujarEncabezadoCompleto(doc, datos) {
  const left = MARGENES.left;
  const right = doc.page.width - MARGENES.right;
  let y = MARGENES.top;

  const logoIzquierdoDibujado = dibujarLogo(
    doc,
    datos.logoIzquierdo,
    datos.logoIzquierdoFallback,
    left,
    y,
    TAMANO_LOGO
  );
  const logoDerechoDibujado = dibujarLogo(
    doc,
    datos.logoDerecho,
    null,
    right - TAMANO_LOGO,
    y,
    TAMANO_LOGO
  );

  const textX = logoIzquierdoDibujado
    ? left + TAMANO_LOGO + SEPARACION_LOGO_TEXTO
    : left;
  const anchoTexto =
    right -
    textX -
    (logoDerechoDibujado ? TAMANO_LOGO + SEPARACION_LOGO_TEXTO : 0);

  doc
    .font(FUENTES.negrita)
    .fontSize(TAMANOS.institucion)
    .fillColor(COLORES.primario)
    .text('HOSPITAL REGIONAL DE OCCIDENTE', textX, y + 4, {
      width: anchoTexto,
      lineBreak: false,
      ellipsis: true,
    });

  doc
    .font(FUENTES.normal)
    .fontSize(TAMANOS.nota)
    .fillColor(COLORES.textoSuave)
    .text('Control documental de expedientes', textX, doc.y + 1, {
      width: anchoTexto,
      lineBreak: false,
      ellipsis: true,
    });

  y = Math.max(doc.y, y + TAMANO_LOGO) + 12;

  const altoTitulo = 28;
  doc
    .save()
    .roundedRect(left, y, CONTENT_WIDTH, altoTitulo, 4)
    .fillColor(COLORES.primario)
    .fill()
    .restore();

  doc
    .font(FUENTES.negrita)
    .fontSize(TAMANOS.titulo)
    .fillColor(COLORES.blanco)
    .text(datos.textos.titulo, left, y + 7, {
      width: CONTENT_WIDTH,
      align: 'center',
      lineBreak: false,
    });

  y += altoTitulo + 8;

  doc
    .font(FUENTES.oblicua)
    .fontSize(TAMANOS.subtitulo)
    .fillColor(COLORES.textoSuave)
    .text(datos.textos.subtitulo, left, y, {
      width: CONTENT_WIDTH,
      align: 'center',
      lineBreak: false,
    });

  y += 20;
  y = dibujarInfo(doc, datos, y);

  return y;
}

function dibujarEncabezadoResumido(doc, datos) {
  const left = MARGENES.left;
  const right = doc.page.width - MARGENES.right;
  let y = MARGENES.top;

  doc
    .font(FUENTES.negrita)
    .fontSize(TAMANOS.seccion)
    .fillColor(COLORES.primario)
    .text('HOSPITAL REGIONAL DE OCCIDENTE', left, y, { lineBreak: false });

  doc
    .font(FUENTES.normal)
    .fontSize(TAMANOS.nota)
    .fillColor(COLORES.textoSuave)
    .text(
      `${datos.textos.titulo}  —  ${datos.idDocumento}`,
      right - 360,
      y + 1,
      { width: 360, align: 'right', lineBreak: false }
    );

  y += 16;

  doc
    .save()
    .moveTo(left, y)
    .lineTo(right, y)
    .lineWidth(1)
    .strokeColor(COLORES.primario)
    .stroke()
    .restore();

  y += 6;
  doc
    .font(FUENTES.normal)
    .fontSize(TAMANOS.nota)
    .fillColor(COLORES.textoSuave)
    .text(
      `Continuación — Fecha: ${formatearFecha(datos.fecha)}  ·  Origen: ${datos.origen}  ·  Destino: ${datos.destino}`,
      left,
      y,
      { width: CONTENT_WIDTH, lineBreak: false, ellipsis: true }
    );

  return y + 16;
}

function dibujarEncabezado(doc, datos, opciones = {}) {
  if (opciones.resumido) {
    return dibujarEncabezadoResumido(doc, datos);
  }
  return dibujarEncabezadoCompleto(doc, datos);
}

module.exports = { dibujarEncabezado, dibujarLogo };
