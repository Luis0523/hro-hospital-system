'use strict';

const {
  MARGENES,
  CONTENT_WIDTH,
  COLORES,
  FUENTES,
  TAMANOS,
  ALTO_FIRMAS,
  Y_INICIO_FIRMAS,
} = require('./constantes');
const { escribirLinea } = require('./texto');

const SEPARACION_COLUMNAS = 80;
const DESPLAZAMIENTO_LINEA = 42;

function normalizarFirmantes(firmantes) {
  const base = Array.isArray(firmantes) ? firmantes : [];
  return [0, 1].map((i) => {
    const f = base[i];
    if (!f) {
      return { nombre: '', cargo: '', etiqueta: 'Nombre y firma' };
    }
    return {
      nombre: f.nombre || '',
      cargo: f.cargo || '',
      etiqueta: f.etiqueta || 'Nombre y firma',
    };
  });
}

function dibujarFirmas(doc, datos) {
  const firmantes = normalizarFirmantes(datos.firmantes);
  // Ancladas a una coordenada fija del pie; no dependen de dónde terminó la tabla.
  const lineaY = Y_INICIO_FIRMAS + DESPLAZAMIENTO_LINEA;

  const anchoColumna = (CONTENT_WIDTH - SEPARACION_COLUMNAS) / 2;
  const columnas = [
    { x: MARGENES.left, firma: firmantes[0] },
    { x: MARGENES.left + anchoColumna + SEPARACION_COLUMNAS, firma: firmantes[1] },
  ];

  for (const columna of columnas) {
    const { firma } = columna;

    if (firma.nombre) {
      escribirLinea(doc, firma.nombre, columna.x, lineaY - 14, {
        fuente: FUENTES.negrita,
        tamano: TAMANOS.celda,
        color: COLORES.texto,
        align: 'center',
        ancho: anchoColumna,
      });
    }

    doc
      .save()
      .moveTo(columna.x, lineaY)
      .lineTo(columna.x + anchoColumna, lineaY)
      .lineWidth(0.8)
      .strokeColor(COLORES.texto)
      .stroke()
      .restore();

    if (firma.cargo) {
      escribirLinea(doc, firma.cargo, columna.x, lineaY + 6, {
        fuente: FUENTES.normal,
        tamano: TAMANOS.meta,
        color: COLORES.textoSuave,
        align: 'center',
        ancho: anchoColumna,
      });
    }

    escribirLinea(doc, firma.etiqueta, columna.x, lineaY + (firma.cargo ? 16 : 6), {
      fuente: FUENTES.normal,
      tamano: TAMANOS.meta,
      color: COLORES.textoSuave,
      align: 'center',
      ancho: anchoColumna,
    });
  }

  return Y_INICIO_FIRMAS + ALTO_FIRMAS;
}

module.exports = { dibujarFirmas, normalizarFirmantes, ALTO_FIRMAS };
