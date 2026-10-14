'use strict';

const {
  MARGENES,
  ANCHO_TABLA,
  SEPARACION_TABLAS,
  COLORES,
  FUENTES,
  TAMANOS,
  COLUMNAS,
  ALTO_ENCABEZADO_TABLA,
  ALTO_FILA,
  FILAS_POR_TABLA_ULTIMA,
  CAPACIDAD_PAGINA_NORMAL,
  CAPACIDAD_PAGINA_ULTIMA,
} = require('./constantes');
const { escribirLinea } = require('./texto');

const PADDING_X = 3;

function xTabla(indice) {
  return MARGENES.left + indice * (ANCHO_TABLA + SEPARACION_TABLAS);
}

function ajustarTexto(doc, texto, ancho, fuente, tamano) {
  doc.font(fuente).fontSize(tamano);
  const valor = texto === null || texto === undefined ? '' : String(texto);
  if (doc.widthOfString(valor) <= ancho) {
    return valor;
  }
  let recorte = valor;
  while (recorte.length > 1 && doc.widthOfString(`${recorte}...`) > ancho) {
    recorte = recorte.slice(0, -1);
  }
  return `${recorte}...`;
}

function valorCelda(expediente, key) {
  if (!expediente) {
    return '';
  }
  if (key === 'numero') {
    return String(expediente.numero);
  }
  if (key === 'numeroExpediente') {
    return expediente.numeroExpediente;
  }
  return expediente.fechaTexto;
}

function dibujarEncabezadoTablas(doc, y) {
  for (let t = 0; t < 3; t += 1) {
    const x = xTabla(t);
    doc
      .rect(x, y, ANCHO_TABLA, ALTO_ENCABEZADO_TABLA)
      .fillColor(COLORES.primarioClaro)
      .fill();

    let cx = x;
    for (const columna of COLUMNAS) {
      const anchoTexto = columna.width - PADDING_X * 2;
      const valor = ajustarTexto(
        doc,
        columna.label,
        anchoTexto,
        FUENTES.negrita,
        TAMANOS.encabezadoTabla
      );
      escribirLinea(
        doc,
        valor,
        cx + PADDING_X,
        y + (ALTO_ENCABEZADO_TABLA - TAMANOS.encabezadoTabla) / 2,
        {
          fuente: FUENTES.negrita,
          tamano: TAMANOS.encabezadoTabla,
          color: COLORES.blanco,
          align: 'center',
          ancho: anchoTexto,
        }
      );
      cx += columna.width;
    }

    doc
      .rect(x, y, ANCHO_TABLA, ALTO_ENCABEZADO_TABLA)
      .lineWidth(0.8)
      .strokeColor(COLORES.primario)
      .stroke();
  }

  return y + ALTO_ENCABEZADO_TABLA;
}

function dibujarFilaTabla(doc, x, y, expediente, alterna) {
  let cx = x;
  for (const columna of COLUMNAS) {
    doc
      .rect(cx, y, columna.width, ALTO_FILA)
      .fillAndStroke(
        alterna ? COLORES.filaAlterna : COLORES.blanco,
        COLORES.borde
      );

    const anchoTexto = columna.width - PADDING_X * 2;
    const valor = ajustarTexto(
      doc,
      valorCelda(expediente, columna.key),
      anchoTexto,
      FUENTES.normal,
      TAMANOS.celda
    );

    escribirLinea(
      doc,
      valor,
      cx + PADDING_X,
      y + (ALTO_FILA - TAMANOS.celda) / 2,
      {
        fuente: FUENTES.normal,
        tamano: TAMANOS.celda,
        color: COLORES.texto,
        align: 'center',
        ancho: anchoTexto,
      }
    );

    cx += columna.width;
  }
}

function dibujarFilaTriple(doc, y, celdas, alterna) {
  for (let t = 0; t < 3; t += 1) {
    dibujarFilaTabla(doc, xTabla(t), y, celdas[t], alterna);
  }
  return y + ALTO_FILA;
}

function distribuirEnTablas(cantidadPagina, filasPorTabla) {
  const primera = Math.min(cantidadPagina, filasPorTabla);
  const segunda = Math.min(
    Math.max(cantidadPagina - filasPorTabla, 0),
    filasPorTabla
  );
  const tercera = Math.max(cantidadPagina - filasPorTabla * 2, 0);
  return [primera, segunda, tercera];
}

/**
 * Reparte `registros` de forma equilibrada entre las 3 tablas de la ÚLTIMA
 * página, manteniendo rangos consecutivos (lectura vertical continua).
 * Reparte el residuo entre las primeras tablas; la diferencia máxima entre
 * tablas es 1. El llamador garantiza registros <= capacidad máxima.
 */
function distribuirUltimaPaginaBalanceada(registros) {
  if (registros <= 0) {
    return [0, 0, 0];
  }
  const base = Math.floor(registros / 3);
  const residuo = registros % 3;
  return [
    base + (residuo > 0 ? 1 : 0),
    base + (residuo > 1 ? 1 : 0),
    base,
  ];
}

function planificarPaginas(total) {
  if (total <= 0) {
    return [0];
  }

  // Cabe completo en una última página (con firmas).
  if (total <= CAPACIDAD_PAGINA_ULTIMA) {
    return [total];
  }

  const paginas = [];
  let resto = total;

  // Páginas intermedias: usan la capacidad normal máxima, dejando siempre al
  // menos un registro para la última página (que reserva firmas).
  while (resto > 0) {
    if (resto <= CAPACIDAD_PAGINA_ULTIMA) {
      paginas.push(resto);
      resto = 0;
      break;
    }
    const toma = Math.min(CAPACIDAD_PAGINA_NORMAL, resto - 1);
    paginas.push(toma);
    resto -= toma;
  }

  // Estético: evitar una última página casi vacía (menos de una tabla completa).
  if (paginas.length >= 2) {
    const ultimo = paginas.length - 1;
    const penultimo = paginas.length - 2;
    const faltante = FILAS_POR_TABLA_ULTIMA - paginas[ultimo];
    if (faltante > 0) {
      const cedible = paginas[penultimo] - 1;
      const cupo = CAPACIDAD_PAGINA_ULTIMA - paginas[ultimo];
      const mover = Math.min(faltante, cedible, cupo);
      if (mover > 0) {
        paginas[penultimo] -= mover;
        paginas[ultimo] += mover;
      }
    }
  }

  return paginas;
}

module.exports = {
  dibujarEncabezadoTablas,
  dibujarFilaTriple,
  dibujarFilaTabla,
  distribuirEnTablas,
  distribuirUltimaPaginaBalanceada,
  planificarPaginas,
  ajustarTexto,
};
