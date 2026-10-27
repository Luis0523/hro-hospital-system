package com.hro.system.reporte;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Plantilla institucional REUTILIZABLE "EXPEDIENTES ARCHIVADOS" (A4 vertical).
 * <p>
 * Porta el diseño del generador de la rama {@code feature/reportes-pdf-expedientes-archivados}
 * (Node/pdfkit) al backend Java (PDFBox): encabezado con logo, título y metadatos
 * (generado / total), una rejilla de <b>tres tablas</b> lado a lado (NO. · EXPEDIENTE · FECHA),
 * paginación que reserva las firmas en la última página, dos firmas y pie con numeración.
 * <p>
 * Es genérica: recibe título, expedientes y firmantes. Otros sectores pueden reutilizarla.
 */
@Component
public class PlantillaExpedientesArchivados {

    // ---- Página (A4 vertical) ----
    private static final float PAGE_W = PDRectangle.A4.getWidth();
    private static final float PAGE_H = PDRectangle.A4.getHeight();
    private static final float MARGEN_X = 24f;
    private static final float MARGEN_TOP = 22f;
    private static final float MARGEN_BOTTOM = 24f;
    private static final float CONTENT_W = PAGE_W - MARGEN_X * 2f;

    // ---- Rejilla de 3 tablas ----
    private static final float SEPARACION_TABLAS = 6f;
    private static final float ANCHO_TABLA = (CONTENT_W - SEPARACION_TABLAS * 2f) / 3f;
    private static final float[] COL_FRAC = {28f / 184f, 96f / 184f, 60f / 184f};
    private static final String[] COL_LABELS = {"NO.", "EXPEDIENTE", "FECHA"};
    private static final float PAD_X = 3f;

    // ---- Encabezado ----
    private static final float ALTO_LOGO = 32f;
    private static final float GAP_ENCABEZADO = 6f;
    private static final float ALTO_ENCABEZADO = MARGEN_TOP + ALTO_LOGO + GAP_ENCABEZADO;
    private static final float ESPACIO_ANTES_TABLAS = 4f;
    private static final float ALTO_ENC_EST = 15f;
    private static final float INICIO_TABLAS = ALTO_ENCABEZADO + ESPACIO_ANTES_TABLAS;
    private static final float INICIO_FILAS = INICIO_TABLAS + ALTO_ENC_EST;
    private static final float ALTO_FILA = 12.6f;

    // ---- Firmas y pie (distancias medidas desde arriba) ----
    private static final float ALTO_FIRMAS = 74f;
    private static final float GAP_SEGURIDAD = 12f;
    private static final float FONDO = PAGE_H - MARGEN_BOTTOM;
    private static final float LIMITE_NORMAL = FONDO - GAP_SEGURIDAD;
    private static final float Y_INICIO_FIRMAS = FONDO - ALTO_FIRMAS;
    private static final float LIMITE_ULTIMA = Y_INICIO_FIRMAS - GAP_SEGURIDAD;

    // La salida institucional usa exactamente 50 expedientes por columna
    // (150 por hoja), incluidas las páginas con firmas.
    private static final int FILAS_POR_TABLA_NORMAL = 50;
    private static final int FILAS_POR_TABLA_ULTIMA = 50;
    private static final int CAPACIDAD_NORMAL = FILAS_POR_TABLA_NORMAL * 3;
    private static final int CAPACIDAD_ULTIMA = FILAS_POR_TABLA_ULTIMA * 3;

    // ---- Colores ----
    private static final Color PRIMARIO = new Color(0x1F, 0x3A, 0x5F);
    private static final Color PRIMARIO_CLARO = new Color(0x2E, 0x4F, 0x7A);
    private static final Color TEXTO = new Color(0x1A, 0x1A, 0x1A);
    private static final Color TEXTO_SUAVE = new Color(0x5B, 0x65, 0x72);
    private static final Color BORDE = new Color(0x9A, 0xA5, 0xB1);
    private static final Color FILA_ALTERNA = new Color(0xF2, 0xF4, 0xF7);
    private static final Color BLANCO = Color.WHITE;

    private static final PDFont F_NORMAL = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private static final PDFont F_BOLD = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

    private static final String TITULO_POR_DEFECTO = "EXPEDIENTES ARCHIVADOS";

    /** Fila de la rejilla: número consecutivo, expediente y fecha. */
    public record Item(int numero, String numeroExpediente, LocalDate fecha) {
    }

    /** Firma al pie (máximo 2). */
    public record Firmante(String nombre, String cargo, String etiqueta) {
    }

    private static final List<Firmante> FIRMANTES_POR_DEFECTO = List.of(
            new Firmante("Encargado de Archivo", "Archivo / Registro Médico", "Nombre y firma"),
            new Firmante("Jefe de Registro Médico", "Registro Médico", "Nombre y firma"));

    public byte[] generar(String titulo, List<Item> expedientes, List<Firmante> firmantes,
                          OffsetDateTime generadoEn) throws IOException {
        return generar(titulo, expedientes, firmantes, generadoEn, null);
    }

    public byte[] generar(String titulo, List<Item> expedientes, List<Firmante> firmantes,
                          OffsetDateTime generadoEn, String generadoPor) throws IOException {
        String tituloFinal = (titulo == null || titulo.isBlank()) ? TITULO_POR_DEFECTO : titulo.trim();
        List<Item> items = (expedientes != null) ? expedientes : List.of();
        List<Firmante> firmantesFinales = (firmantes == null || firmantes.isEmpty())
                ? FIRMANTES_POR_DEFECTO
                : firmantes.subList(0, Math.min(2, firmantes.size()));
        OffsetDateTime generado = (generadoEn != null) ? generadoEn : OffsetDateTime.now();

        List<Integer> paginas = planificarPaginas(items.size());

        try (PDDocument doc = new PDDocument()) {
            int indiceGlobal = 0;
            for (int p = 0; p < paginas.size(); p++) {
                PDPage page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    int cantidad = paginas.get(p);
                    dibujarEncabezado(doc, cs, tituloFinal, items.size(), generado, generadoPor);
                    dibujarEncabezadoTablas(cs);

                    boolean ultima = p == paginas.size() - 1;
                    int[] dist = ultima
                            ? distribuirUltimaPaginaBalanceada(cantidad)
                            : distribuirEnTablas(cantidad);
                    int[] inicios = {0, dist[0], dist[0] + dist[1]};
                    int maxFilas = Math.max(dist[0], Math.max(dist[1], dist[2]));

                    for (int fila = 0; fila < maxFilas; fila++) {
                        Item[] celdas = new Item[3];
                        for (int t = 0; t < 3; t++) {
                            int global = indiceGlobal + inicios[t] + fila;
                            celdas[t] = (fila < dist[t] && global < items.size()) ? items.get(global) : null;
                        }
                        dibujarFilaTriple(cs, fila, celdas, fila % 2 == 1);
                    }
                    indiceGlobal += cantidad;
                }
            }

            // Firmas ancladas al pie (una sola vez, sobre la última página).
            dibujarFirmas(doc, firmantesFinales);

            // Pie con numeración en todas las páginas.
            dibujarPiePaginas(doc);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    // ------------------------------------------------------------------
    // Encabezado
    // ------------------------------------------------------------------

    private void dibujarEncabezado(PDDocument doc, PDPageContentStream cs, String titulo, int total,
                                   OffsetDateTime generado, String generadoPor) throws IOException {
        float y = PAGE_H - MARGEN_TOP; // borde superior del encabezado (PDF: sube)
        boolean logo = dibujarLogo(doc, cs, MARGEN_X, y - ALTO_LOGO, ALTO_LOGO);
        float textX = logo ? MARGEN_X + ALTO_LOGO + 10f : MARGEN_X;

        escribir(cs, F_BOLD, 11f, PRIMARIO, "HOSPITAL REGIONAL DE OCCIDENTE", textX,
                y - 14f, PAGE_W - MARGEN_X - textX, Alineacion.IZQUIERDA);
        escribir(cs, F_BOLD, 13f, TEXTO, titulo, textX, y - 29f,
                PAGE_W - MARGEN_X - textX, Alineacion.IZQUIERDA);

        float metaW = 170f;
        escribir(cs, F_NORMAL, 8f, TEXTO_SUAVE, "Generado: " + formatearFechaHora(generado),
                PAGE_W - MARGEN_X - metaW, y - 11f, metaW, Alineacion.DERECHA);
        escribir(cs, F_NORMAL, 8f, TEXTO_SUAVE, "Total: " + total,
                PAGE_W - MARGEN_X - metaW, y - 24f, metaW, Alineacion.DERECHA);
        if (generadoPor != null && !generadoPor.isBlank()) {
            escribir(cs, F_NORMAL, 8f, TEXTO_SUAVE, "Generado por: " + generadoPor,
                    PAGE_W - MARGEN_X - metaW, y - 37f, metaW, Alineacion.DERECHA);
        }

        // Línea divisoria del encabezado.
        float lineY = PAGE_H - (ALTO_ENCABEZADO - 4f);
        cs.setStrokingColor(PRIMARIO);
        cs.setLineWidth(0.8f);
        cs.moveTo(MARGEN_X, lineY);
        cs.lineTo(MARGEN_X + CONTENT_W, lineY);
        cs.stroke();
    }

    private void dibujarEncabezadoTablas(PDPageContentStream cs) throws IOException {
        float alto = ALTO_ENC_EST;
        for (int t = 0; t < 3; t++) {
            float x = xTabla(t);
            cs.setNonStrokingColor(PRIMARIO_CLARO);
            cs.addRect(x, PAGE_H - INICIO_TABLAS - alto, ANCHO_TABLA, alto);
            cs.fill();
            float cx = x;
            for (int c = 0; c < COL_FRAC.length; c++) {
                float ancho = ANCHO_TABLA * COL_FRAC[c];
                escribir(cs, F_BOLD, 9f, BLANCO, COL_LABELS[c], cx + PAD_X,
                        PAGE_H - INICIO_TABLAS - alto + (alto - 9f) / 2f + 2f,
                        ancho - PAD_X * 2f, Alineacion.CENTRO);
                cx += ancho;
            }
            cs.setStrokingColor(PRIMARIO);
            cs.setLineWidth(0.8f);
            cs.addRect(x, PAGE_H - INICIO_TABLAS - alto, ANCHO_TABLA, alto);
            cs.stroke();
        }
    }

    // ------------------------------------------------------------------
    // Tabla (fila de 3 celdas por cada una de las 3 tablas)
    // ------------------------------------------------------------------

    private void dibujarFilaTriple(PDPageContentStream cs, int indiceFila, Item[] celdas,
                                   boolean alterna) throws IOException {
        float top = INICIO_FILAS + indiceFila * ALTO_FILA;
        for (int t = 0; t < 3; t++) {
            dibujarFilaTabla(cs, xTabla(t), top, celdas[t], alterna);
        }
    }

    private void dibujarFilaTabla(PDPageContentStream cs, float x, float top, Item item,
                                  boolean alterna) throws IOException {
        float bottom = top + ALTO_FILA;
        float cx = x;
        String[] valores = {
                item != null ? String.valueOf(item.numero()) : "",
                item != null ? nvl(item.numeroExpediente()) : "",
                item != null ? formatearFecha(item.fecha()) : "",
        };
        for (int c = 0; c < COL_FRAC.length; c++) {
            float ancho = ANCHO_TABLA * COL_FRAC[c];
            cs.setNonStrokingColor(alterna ? FILA_ALTERNA : BLANCO);
            cs.addRect(cx, PAGE_H - bottom, ancho, ALTO_FILA);
            cs.fill();
            cs.setStrokingColor(BORDE);
            cs.setLineWidth(0.5f);
            cs.addRect(cx, PAGE_H - bottom, ancho, ALTO_FILA);
            cs.stroke();

            escribir(cs, F_NORMAL, 9f, TEXTO, ajustar(cs, valores[c], ancho - PAD_X * 2f, 9f),
                    cx + PAD_X, PAGE_H - bottom + (ALTO_FILA - 9f) / 2f + 2f,
                    ancho - PAD_X * 2f, Alineacion.CENTRO);
            cx += ancho;
        }
    }

    private float xTabla(int indice) {
        return MARGEN_X + indice * (ANCHO_TABLA + SEPARACION_TABLAS);
    }

    // ------------------------------------------------------------------
    // Firmas (ancladas al pie, solo en la última página)
    // ------------------------------------------------------------------

    private void dibujarFirmas(PDDocument doc, List<Firmante> firmantes) throws IOException {
        PDPage page = doc.getPage(doc.getNumberOfPages() - 1);
        try (PDPageContentStream cs = new PDPageContentStream(doc, page,
                PDPageContentStream.AppendMode.APPEND, true, true)) {
            float sepColumnas = 80f;
            float anchoColumna = (CONTENT_W - sepColumnas) / 2f;
            float lineaY = PAGE_H - (Y_INICIO_FIRMAS + 42f);
            float[] xs = {MARGEN_X, MARGEN_X + anchoColumna + sepColumnas};

            for (int i = 0; i < 2; i++) {
                Firmante f = firmantes.get(i);
                String nombre = nvl(f.nombre());
                String cargo = nvl(f.cargo());
                String etiqueta = (f.etiqueta() == null || f.etiqueta().isBlank())
                        ? "Nombre y firma" : f.etiqueta();

                if (!nombre.isEmpty()) {
                    escribir(cs, F_BOLD, 9f, TEXTO, nombre, xs[i], lineaY + 12f, anchoColumna,
                            Alineacion.CENTRO);
                }
                cs.setStrokingColor(TEXTO);
                cs.setLineWidth(0.8f);
                cs.moveTo(xs[i], lineaY);
                cs.lineTo(xs[i] + anchoColumna, lineaY);
                cs.stroke();
                if (!cargo.isEmpty()) {
                    escribir(cs, F_NORMAL, 8f, TEXTO_SUAVE, cargo, xs[i], lineaY - 10f, anchoColumna,
                            Alineacion.CENTRO);
                    escribir(cs, F_NORMAL, 8f, TEXTO_SUAVE, etiqueta, xs[i], lineaY - 21f, anchoColumna,
                            Alineacion.CENTRO);
                } else {
                    escribir(cs, F_NORMAL, 8f, TEXTO_SUAVE, etiqueta, xs[i], lineaY - 10f, anchoColumna,
                            Alineacion.CENTRO);
                }
            }
        }
    }

    // ------------------------------------------------------------------
    // Pie de página
    // ------------------------------------------------------------------

    private void dibujarPiePaginas(PDDocument doc) throws IOException {
        int total = doc.getNumberOfPages();
        for (int i = 0; i < total; i++) {
            PDPage page = doc.getPage(i);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page,
                    PDPageContentStream.AppendMode.APPEND, true, true)) {
                float y = MARGEN_BOTTOM - 4f;
                cs.setStrokingColor(BORDE);
                cs.setLineWidth(0.5f);
                cs.moveTo(MARGEN_X, y + 6f);
                cs.lineTo(MARGEN_X + CONTENT_W, y + 6f);
                cs.stroke();
                escribir(cs, F_NORMAL, 8f, TEXTO_SUAVE, "Hospital Regional de Occidente - Sistema HRO",
                        MARGEN_X, y, CONTENT_W / 2f, Alineacion.IZQUIERDA);
                escribir(cs, F_NORMAL, 8f, TEXTO_SUAVE, "Página " + (i + 1) + " de " + total,
                        MARGEN_X + CONTENT_W / 2f, y, CONTENT_W / 2f, Alineacion.DERECHA);
            }
        }
    }

    // ------------------------------------------------------------------
    // Paginación (portado del generador)
    // ------------------------------------------------------------------

    static List<Integer> planificarPaginas(int total) {
        List<Integer> paginas = new ArrayList<>();
        if (total <= 0) {
            paginas.add(0);
            return paginas;
        }
        if (total <= CAPACIDAD_ULTIMA) {
            paginas.add(total);
            return paginas;
        }

        int resto = total;
        while (resto > 0) {
            if (resto <= CAPACIDAD_ULTIMA) {
                paginas.add(resto);
                break;
            }
            int toma = Math.min(CAPACIDAD_NORMAL, resto - 1);
            paginas.add(toma);
            resto -= toma;
        }

        // Estético: evitar una última página casi vacía.
        if (paginas.size() >= 2) {
            int ultimo = paginas.size() - 1;
            int penultimo = paginas.size() - 2;
            int faltante = FILAS_POR_TABLA_ULTIMA - paginas.get(ultimo);
            if (faltante > 0) {
                int cedible = paginas.get(penultimo) - 1;
                int cupo = CAPACIDAD_ULTIMA - paginas.get(ultimo);
                int mover = Math.min(faltante, Math.min(cedible, cupo));
                if (mover > 0) {
                    paginas.set(penultimo, paginas.get(penultimo) - mover);
                    paginas.set(ultimo, paginas.get(ultimo) + mover);
                }
            }
        }
        return paginas;
    }

    static int[] distribuirEnTablas(int cantidad) {
        int primera = Math.min(cantidad, FILAS_POR_TABLA_NORMAL);
        int segunda = Math.min(Math.max(cantidad - FILAS_POR_TABLA_NORMAL, 0), FILAS_POR_TABLA_NORMAL);
        int tercera = Math.max(cantidad - FILAS_POR_TABLA_NORMAL * 2, 0);
        return new int[]{primera, segunda, tercera};
    }

    static int capacidadNormal() {
        return CAPACIDAD_NORMAL;
    }

    static int capacidadUltima() {
        return CAPACIDAD_ULTIMA;
    }

    static int[] distribuirUltimaPaginaBalanceada(int registros) {
        if (registros <= 0) {
            return new int[]{0, 0, 0};
        }
        int base = registros / 3;
        int residuo = registros % 3;
        return new int[]{
                base + (residuo > 0 ? 1 : 0),
                base + (residuo > 1 ? 1 : 0),
                base,
        };
    }

    // ------------------------------------------------------------------
    // Utilidades
    // ------------------------------------------------------------------

    private boolean dibujarLogo(PDDocument doc, PDPageContentStream cs, float x, float y, float tam) {
        try (InputStream in = getClass().getResourceAsStream("/img/logo-hro.jpg")) {
            if (in == null) {
                return false;
            }
            byte[] bytes = in.readAllBytes();
            PDImageXObject img = PDImageXObject.createFromByteArray(doc, bytes, "logo-hro");
            cs.drawImage(img, x, y, tam, tam);
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    /** Recorta el texto con "..." si excede el ancho disponible (una sola línea). */
    private String ajustar(PDPageContentStream cs, String texto, float ancho, float tamano)
            throws IOException {
        String valor = sanitizar(nvl(texto));
        if (anchoTexto(F_NORMAL, tamano, valor) <= ancho) {
            return valor;
        }
        String recorte = valor;
        while (recorte.length() > 1 && anchoTexto(F_NORMAL, tamano, recorte + "...") > ancho) {
            recorte = recorte.substring(0, recorte.length() - 1);
        }
        return recorte + "...";
    }

    private void escribir(PDPageContentStream cs, PDFont font, float tamano, Color color,
                          String texto, float x, float y, float ancho, Alineacion alineacion)
            throws IOException {
        String valor = sanitizar(nvl(texto));
        float anchoTexto = anchoTexto(font, tamano, valor);
        float drawX = x;
        if (alineacion == Alineacion.CENTRO) {
            drawX = x + Math.max(0f, (ancho - anchoTexto) / 2f);
        } else if (alineacion == Alineacion.DERECHA) {
            drawX = x + Math.max(0f, ancho - anchoTexto);
        }
        cs.beginText();
        cs.setFont(font, tamano);
        cs.setNonStrokingColor(color);
        cs.newLineAtOffset(drawX, y);
        cs.showText(valor);
        cs.endText();
    }

    private float anchoTexto(PDFont font, float tamano, String texto) throws IOException {
        return font.getStringWidth(texto) / 1000f * tamano;
    }

    private static String nvl(String valor) {
        return valor == null ? "" : valor;
    }

    private static String formatearFecha(LocalDate fecha) {
        return fecha == null ? "" : fecha.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private static String formatearFechaHora(OffsetDateTime fecha) {
        return fecha == null ? "" : fecha.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    }

    /** Reemplaza caracteres fuera de Latin-1 (WinAnsiEncoding de Helvetica). */
    private static String sanitizar(String valor) {
        if (valor == null) {
            return "";
        }
        return valor
                .replace('\u2192', '-')
                .replace('\u2014', '-')
                .replace('\u2013', '-')
                .replace('\u2018', '\'')
                .replace('\u2019', '\'')
                .replace('\u201c', '"')
                .replace('\u201d', '"')
                .replace('\u2026', '.');
    }

    private enum Alineacion { IZQUIERDA, CENTRO, DERECHA }
}
