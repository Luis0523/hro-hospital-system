'use strict';

const PDFDocument = require('pdfkit');

const {
  MARGENES,
  COLORES,
  FUENTES,
  TAMANOS,
  CASILLA,
  COLUMNAS,
  ALTO_ENCABEZADO_TABLA,
  PADDING_CELDA_X,
  PADDING_CELDA_Y,
  ALTO_FILA_MIN,
} = require('./constantes');
const { envolverTexto, resolverEtiqueta } = require('./helpers');

const INTERLINEADO = TAMANOS.celda * 1.25;

function calcularColumnas() {
  let x = MARGENES.left;
  return COLUMNAS.map((columna) => {
    const posicion = { ...columna, x };
    x += columna.width;
    return posicion;
  });
}

function valorDeCelda(expediente, key) {
  if (key === 'indice') return String(expediente.indice);
  if (key === 'marca1' || key === 'marca2') return CASILLA;
  return expediente[key] !== undefined ? String(expediente[key]) : '';
}

function dibujarEncabezadoTabla(doc, columnas, y, tipo) {
  let x = MARGENES.left;
  const anchoTotal = columnas.reduce((suma, columna) => suma + columna.width, 0);

  doc
    .rect(MARGENES.left, y, anchoTotal, ALTO_ENCABEZADO_TABLA)
    .fillColor(COLORES.primario)
    .fill();

  for (const columna of columnas) {
    doc
      .font(FUENTES.negrita)
      .fontSize(TAMANOS.celda)
      .fillColor(COLORES.blanco)
      .text(
        resolverEtiqueta(columna.label, tipo),
        x + PADDING_CELDA_X,
        y + 7,
        {
          width: columna.width - PADDING_CELDA_X * 2,
          align: columna.align,
          lineBreak: false,
          ellipsis: true,
        }
      );
    x += columna.width;
  }

  doc
    .rect(MARGENES.left, y, anchoTotal, ALTO_ENCABEZADO_TABLA)
    .lineWidth(0.8)
    .strokeColor(COLORES.primario)
    .stroke();

  return y + ALTO_ENCABEZADO_TABLA;
}

function medirFila(doc, columnas, expediente) {
  let altura = ALTO_FILA_MIN;
  const celdas = columnas.map((columna) => {
    const valor = valorDeCelda(expediente, columna.key);
    const anchoTexto = columna.width - PADDING_CELDA_X * 2;
    const lineas = envolverTexto(
      doc,
      valor,
      anchoTexto,
      FUENTES.normal,
      TAMANOS.celda
    );
    altura = Math.max(
      altura,
      lineas.length * INTERLINEADO + PADDING_CELDA_Y * 2
    );
    return { columna, valor, lineas };
  });
  return { celdas, altura };
}

function dibujarFila(doc, celdas, altura, y, alterna) {
  let x = MARGENES.left;
  for (const celda of celdas) {
    const { columna, valor, lineas } = celda;
    doc
      .rect(x, y, columna.width, altura)
      .fillAndStroke(
        alterna ? COLORES.filaAlterna : COLORES.blanco,
        COLORES.borde
      );

    const altoTexto = lineas.length * INTERLINEADO;
    const desplazamiento = Math.max(
      PADDING_CELDA_Y,
      (altura - altoTexto) / 2
    );

    doc.font(FUENTES.normal).fontSize(TAMANOS.celda).fillColor(COLORES.texto);
    if (columna.align === 'center') {
      const anchoValor = doc.widthOfString(valor);
      const centradoX = x + Math.max(0, (columna.width - anchoValor) / 2);
      doc.text(valor, centradoX, y + desplazamiento, {
        align: 'left',
        lineBreak: false,
      });
    } else {
      doc.text(lineas.join('\n'), x + PADDING_CELDA_X, y + desplazamiento, {
        width: columna.width - PADDING_CELDA_X * 2,
        align: columna.align,
        lineBreak: false,
      });
    }

    x += columna.width;
  }
  return y + altura;
}

function medirInicioContinuacion(dibujarEncabezadoPagina) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: MARGENES,
  });
  doc.on('data', () => {});
  let inicio = MARGENES.top + ALTO_ENCABEZADO_TABLA;
  try {
    const y = dibujarEncabezadoPagina(doc);
    inicio = y + ALTO_ENCABEZADO_TABLA;
  } catch (error) {
    inicio = MARGENES.top + 40 + ALTO_ENCABEZADO_TABLA;
  } finally {
    doc.end();
  }
  return inicio;
}

function sumaAlturas(alturas, indices, desde) {
  let total = 0;
  for (let i = desde; i < indices.length; i += 1) {
    total += alturas[indices[i]];
  }
  return total;
}

function paginarCompleto(alturas, inicioFull, inicioCont, limite) {
  const n = alturas.length;
  const grupos = [];
  let i = 0;
  let primera = true;

  while (i < n) {
    const inicio = primera ? inicioFull : inicioCont;
    const capacidad = limite - inicio;
    const indices = [];
    let usado = 0;
    while (i < n && usado + alturas[i] <= capacidad) {
      usado += alturas[i];
      indices.push(i);
      i += 1;
    }
    if (indices.length === 0 && i < n) {
      indices.push(i);
      i += 1;
    }
    grupos.push({ indices, inicio });
    primera = false;
  }

  return grupos;
}

function planificarPaginas(alturas, opciones) {
  const { inicioFull, inicioCont, limite, altoFooter } = opciones;
  const n = alturas.length;
  if (n === 0) {
    return [];
  }

  const grupos = paginarCompleto(alturas, inicioFull, inicioCont, limite);
  const ultimo = grupos[grupos.length - 1];
  const finUltimo = ultimo.inicio + sumaAlturas(alturas, ultimo.indices, 0);

  if (finUltimo + altoFooter <= limite) {
    return grupos;
  }

  const filas = ultimo.indices.slice();
  if (filas.length < 2) {
    return grupos;
  }

  const capacidadFooter = limite - altoFooter - inicioCont;

  let cantidad = Math.max(
    1,
    Math.min(filas.length - 1, Math.round(filas.length / 2))
  );
  while (
    cantidad > 1 &&
    sumaAlturas(alturas, filas, filas.length - cantidad) > capacidadFooter
  ) {
    cantidad -= 1;
  }

  if (sumaAlturas(alturas, filas, filas.length - cantidad) > capacidadFooter) {
    return grupos;
  }

  ultimo.indices = filas.slice(0, filas.length - cantidad);
  grupos.push({
    indices: filas.slice(filas.length - cantidad),
    inicio: inicioCont,
  });

  return grupos;
}

function dibujarTabla(doc, datos, startY, opciones = {}) {
  const columnas = calcularColumnas();
  const dibujarEncabezadoPagina =
    opciones.dibujarEncabezadoPagina || (() => startY);
  const altoFooter = opciones.altoFooter || 0;

  if (datos.expedientes.length === 0) {
    return dibujarEncabezadoTabla(doc, columnas, startY, datos.tipo);
  }

  const filas = datos.expedientes.map((expediente) =>
    medirFila(doc, columnas, expediente)
  );
  const alturas = filas.map((fila) => fila.altura);

  const limite = doc.page.height - MARGENES.bottom;
  const inicioCont = medirInicioContinuacion(dibujarEncabezadoPagina);
  const grupos = planificarPaginas(alturas, {
    inicioFull: startY + ALTO_ENCABEZADO_TABLA,
    inicioCont,
    limite,
    altoFooter,
  });

  let y = startY;
  grupos.forEach((grupo, indicePagina) => {
    if (indicePagina === 0) {
      y = dibujarEncabezadoTabla(doc, columnas, startY, datos.tipo);
    } else {
      doc.addPage();
      const inicioEncabezado = dibujarEncabezadoPagina(doc);
      y = dibujarEncabezadoTabla(
        doc,
        columnas,
        inicioEncabezado,
        datos.tipo
      );
    }
    for (const indice of grupo.indices) {
      y = dibujarFila(
        doc,
        filas[indice].celdas,
        filas[indice].altura,
        y,
        indice % 2 === 1
      );
    }
  });

  return y;
}

module.exports = { dibujarTabla, calcularColumnas, planificarPaginas };
