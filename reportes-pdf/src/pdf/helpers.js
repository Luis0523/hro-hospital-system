'use strict';

const { TAMANOS, MARGENES } = require('./constantes');

function asegurarEspacio(doc, y, altoRequerido, dibujarEncabezadoPagina) {
  const limiteInferior = doc.page.height - MARGENES.bottom;
  if (y + altoRequerido <= limiteInferior) {
    return y;
  }
  doc.addPage();
  return dibujarEncabezadoPagina ? dibujarEncabezadoPagina(doc) : doc.page.margins.top;
}

function resolverEtiqueta(label, tipo) {
  if (label && typeof label === 'object') {
    return label[tipo] || '';
  }
  return label || '';
}

function formatearFecha(fechaISO) {
  const [anio, mes, dia] = fechaISO.split('-');
  return `${dia}/${mes}/${anio}`;
}

function formatearFechaHora(fecha) {
  const d = fecha instanceof Date ? fecha : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function construirIdDocumento(tipo, fechaISO) {
  const { TEXTOS } = require('./constantes');
  const prefijo = TEXTOS[tipo].prefijoId;
  const compacta = fechaISO.replace(/-/g, '');
  return `${prefijo}-${compacta}`;
}

function envolverTexto(doc, texto, ancho, fuente, tamano) {
  doc.font(fuente).fontSize(tamano);
  const contenido = texto === null || texto === undefined ? '' : String(texto);
  const parrafos = contenido.split(/\r?\n/);
  const lineas = [];

  for (const parrafo of parrafos) {
    const palabras = parrafo.split(/\s+/).filter((p) => p.length > 0);
    if (palabras.length === 0) {
      lineas.push('');
      continue;
    }

    let actual = '';
    for (const palabra of palabras) {
      const candidato = actual ? `${actual} ${palabra}` : palabra;
      if (doc.widthOfString(candidato) <= ancho) {
        actual = candidato;
        continue;
      }

      if (actual) {
        lineas.push(actual);
        actual = '';
      }

      if (doc.widthOfString(palabra) <= ancho) {
        actual = palabra;
        continue;
      }

      let fragmento = '';
      for (const caracter of palabra) {
        const prueba = fragmento + caracter;
        if (doc.widthOfString(prueba) <= ancho) {
          fragmento = prueba;
        } else {
          lineas.push(fragmento);
          fragmento = caracter;
        }
      }
      actual = fragmento;
    }
    lineas.push(actual);
  }

  return lineas.length > 0 ? lineas : [''];
}

function altoDeLineas(cantidad) {
  const interlineado = TAMANOS.celda * 1.25;
  return cantidad * interlineado;
}

module.exports = {
  asegurarEspacio,
  resolverEtiqueta,
  formatearFecha,
  formatearFechaHora,
  construirIdDocumento,
  envolverTexto,
  altoDeLineas,
};
