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
 * Plantilla institucional REUTILIZABLE de reportes PDF (A4 vertical) para el
 * SIGHO. Porta el diseño del generador "reportes-pdf" (Node/pdfkit) al backend
 * Java (PDFBox): encabezado con logo, panel de datos, tabla paginada con
 * encabezado repetido y filas alternadas, observaciones, firmas y pie con
 * numeración.
 *
 * <p>Es genérica: solo cambian el título/subtítulo y las COLUMNAS y FILAS.
 * Otros sectores pueden generar sus reportes reutilizando esta clase.</p>
 */
@Component
public class PlantillaReportePdf {

    private static final float PAGE_W = PDRectangle.A4.getWidth();
    private static final float PAGE_H = PDRectangle.A4.getHeight();
    private static final float MARGEN = 36f;
    private static final float BOTTOM = 54f;
    private static final float CONTENT_W = PAGE_W - MARGEN * 2;
    private static final float HEADER_TABLE_H = 20f;
    private static final float PAD_X = 5f;
    private static final float LINE_H = 11.5f;

    private static final Color PRIMARIO = new Color(31, 58, 95);
    private static final Color PRIMARIO_CLARO = new Color(46, 79, 122);
    private static final Color TEXTO = new Color(26, 26, 26);
    private static final Color TEXTO_SUAVE = new Color(91, 101, 114);
    private static final Color BORDE = new Color(154, 165, 177);
    private static final Color FILA_ALTERNA = new Color(242, 244, 247);
    private static final Color PANEL = new Color(237, 241, 246);

    private static final PDFont F_NORMAL = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private static final PDFont F_BOLD = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

    public enum Alineacion { IZQUIERDA, CENTRO, DERECHA }

    /** Columna de la tabla: etiqueta, peso relativo de ancho y alineación. */
    public record Columna(String etiqueta, float peso, Alineacion alineacion) {
    }

    /** Datos completos del reporte (plantilla genérica). */
    public record Reporte(
            String titulo,
            String subtitulo,
            String idDocumento,
            LocalDate fecha,
            OffsetDateTime generadoEn,
            String generadoPor,
            String origen,
            String destino,
            List<Columna> columnas,
            List<List<String>> filas,
            long total,
            String responsableEntrega,
            String responsableRecibe,
            String observaciones
    ) {
    }

    public byte[] generar(Reporte r) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            List<PDPageState> estado = new ArrayList<>();
            PDPageState page = nuevaPagina(doc);
            float y = dibujarEncabezadoCompleto(doc, page.stream, r);
            y = dibujarTablaEncabezado(page.stream, r, y);

            List<Float> anchos = calcularAnchos(r.columnas());
            boolean alterna = false;
            for (List<String> fila : r.filas()) {
                float alto = altoFila(fila, anchos);
                if (page.y - alto < BOTTOM) {
                    page.stream.close();
                    page = nuevaPagina(doc);
                    y = dibujarEncabezadoResumido(page.stream, r);
                    y = dibujarTablaEncabezado(page.stream, r, y);
                    alterna = false;
                }
                dibujarFila(page.stream, fila, anchos, page.y, r.columnas(), alterna, alto);
                page.y -= alto;
                alterna = !alterna;
            }

            // Observaciones + firmas (con salto de página si hace falta).
            float necesario = 70 + 60;
            if (page.y - necesario < BOTTOM) {
                page.stream.close();
                page = nuevaPagina(doc);
                dibujarEncabezadoResumido(page.stream, r);
            }
            dibujarObservacionesFirmas(page.stream, r, page.y - 16);
            page.stream.close();

            // Pie de página con numeración en todas las páginas.
            dibujarPiePaginas(doc);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    // ------------------------------------------------------------------
    // Página
    // ------------------------------------------------------------------
    private static final class PDPageState {
        final PDPage page;
        final PDPageContentStream stream;
        float y;

        PDPageState(PDPage page, PDPageContentStream stream, float y) {
            this.page = page;
            this.stream = stream;
            this.y = y;
        }
    }

    private PDPageState nuevaPagina(PDDocument doc) throws IOException {
        PDPage page = new PDPage(PDRectangle.A4);
        PDPageContentStream stream = new PDPageContentStream(doc, page);
        return new PDPageState(page, stream, PAGE_H - MARGEN);
    }

    // ------------------------------------------------------------------
    // Encabezado
    // ------------------------------------------------------------------
    private float dibujarEncabezadoCompleto(PDDocument doc, PDPageContentStream cs, Reporte r) throws IOException {
        float y = PAGE_H - MARGEN;
        float logo = 44f;
        dibujarLogo(doc, cs, MARGEN, y - logo, logo);
        float textX = MARGEN + logo + 12f;
        float textW = PAGE_W - MARGEN - textX;

        escribir(cs, F_BOLD, 14f, PRIMARIO, "HOSPITAL REGIONAL DE OCCIDENTE", textX, y - 14f, textW,
                Alineacion.IZQUIERDA);
        escribir(cs, F_BOLD, 13f, TEXTO, r.titulo(), textX, y - 30f, textW, Alineacion.IZQUIERDA);
        escribir(cs, F_NORMAL, 9f, TEXTO_SUAVE, nvl(r.subtitulo()), textX, y - 43f, textW,
                Alineacion.IZQUIERDA);
        y -= logo + 8f;

        // Panel de datos (2 columnas x filas).
        float panelH = 66f;
        cs.setNonStrokingColor(PANEL);
        cs.addRect(MARGEN, y - panelH, CONTENT_W, panelH);
        cs.fill();
        cs.setStrokingColor(BORDE);
        cs.setLineWidth(0.6f);
        cs.addRect(MARGEN, y - panelH, CONTENT_W, panelH);
        cs.stroke();

        List<String[]> izquierda = List.of(
                new String[]{"Fecha", formatearFecha(r.fecha())},
                new String[]{"Documento", nvl(r.idDocumento())},
                new String[]{"Total de expedientes", String.valueOf(r.total())},
                new String[]{"Generado el", formatearFechaHora(r.generadoEn())});
        List<String[]> derecha = List.of(
                new String[]{"Origen", nvl(r.origen())},
                new String[]{"Destino", nvl(r.destino())},
                new String[]{"Generado por", nvl(r.generadoPor())});

        float colX1 = MARGEN + 10f;
        float valX1 = colX1 + 96f;
        float colX2 = MARGEN + CONTENT_W / 2f + 6f;
        float valX2 = colX2 + 78f;
        float firstY = y - 15f;
        for (int i = 0; i < izquierda.size(); i++) {
            float filaY = firstY - i * 13f;
            escribir(cs, F_BOLD, 8f, TEXTO_SUAVE, izquierda.get(i)[0] + ":", colX1, filaY, 90f,
                    Alineacion.IZQUIERDA);
            escribir(cs, F_NORMAL, 8.5f, TEXTO, izquierda.get(i)[1], valX1, filaY, 100f,
                    Alineacion.IZQUIERDA);
        }
        for (int i = 0; i < derecha.size(); i++) {
            float filaY = firstY - i * 13f;
            escribir(cs, F_BOLD, 8f, TEXTO_SUAVE, derecha.get(i)[0] + ":", colX2, filaY, 74f,
                    Alineacion.IZQUIERDA);
            escribir(cs, F_NORMAL, 8.5f, TEXTO, derecha.get(i)[1], valX2, filaY,
                    MARGEN + CONTENT_W - valX2 - 6f, Alineacion.IZQUIERDA);
        }

        return y - panelH - 10f;
    }

    private float dibujarEncabezadoResumido(PDPageContentStream cs, Reporte r) throws IOException {
        float y = PAGE_H - MARGEN;
        escribir(cs, F_BOLD, 11f, PRIMARIO, "HOSPITAL REGIONAL DE OCCIDENTE", MARGEN, y - 12f,
                CONTENT_W, Alineacion.IZQUIERDA);
        escribir(cs, F_BOLD, 10f, TEXTO, r.titulo(), MARGEN, y - 26f, CONTENT_W, Alineacion.IZQUIERDA);
        escribir(cs, F_NORMAL, 8f, TEXTO_SUAVE,
                nvl(r.idDocumento()) + " · " + formatearFecha(r.fecha()), MARGEN, y - 38f, CONTENT_W,
                Alineacion.IZQUIERDA);
        return y - 50f;
    }

    // ------------------------------------------------------------------
    // Tabla
    // ------------------------------------------------------------------
    private List<Float> calcularAnchos(List<Columna> columnas) {
        float totalPeso = 0f;
        for (Columna c : columnas) {
            totalPeso += Math.max(0.0001f, c.peso());
        }
        List<Float> anchos = new ArrayList<>();
        for (Columna c : columnas) {
            anchos.add(CONTENT_W * (Math.max(0.0001f, c.peso()) / totalPeso));
        }
        return anchos;
    }

    private float dibujarTablaEncabezado(PDPageContentStream cs, Reporte r, float y) throws IOException {
        List<Float> anchos = calcularAnchos(r.columnas());
        cs.setNonStrokingColor(PRIMARIO_CLARO);
        cs.addRect(MARGEN, y - HEADER_TABLE_H, CONTENT_W, HEADER_TABLE_H);
        cs.fill();
        float x = MARGEN;
        for (int i = 0; i < r.columnas().size(); i++) {
            Columna c = r.columnas().get(i);
            escribir(cs, F_BOLD, 8f, Color.WHITE, c.etiqueta(), x + PAD_X, y - 13f, anchos.get(i) - PAD_X * 2,
                    c.alineacion());
            x += anchos.get(i);
        }
        return y - HEADER_TABLE_H;
    }

    private float altoFila(List<String> fila, List<Float> anchos) {
        int maxLineas = 1;
        for (int i = 0; i < anchos.size(); i++) {
            String valor = i < fila.size() ? nvl(fila.get(i)) : "";
            maxLineas = Math.max(maxLineas, envolver(F_NORMAL, 8.5f, valor, anchos.get(i) - PAD_X * 2).size());
        }
        return Math.max(16f, maxLineas * LINE_H + 5f);
    }

    private void dibujarFila(PDPageContentStream cs, List<String> fila, List<Float> anchos,
                             float topY, List<Columna> columnas, boolean alterna, float alto) throws IOException {
        if (alterna) {
            cs.setNonStrokingColor(FILA_ALTERNA);
            cs.addRect(MARGEN, topY - alto, CONTENT_W, alto);
            cs.fill();
        }
        float x = MARGEN;
        for (int i = 0; i < columnas.size(); i++) {
            String valor = i < fila.size() ? nvl(fila.get(i)) : "";
            List<String> lineas = envolver(F_NORMAL, 8.5f, valor, anchos.get(i) - PAD_X * 2);
            float ty = topY - 12f;
            for (String linea : lineas) {
                escribir(cs, F_NORMAL, 8.5f, TEXTO, linea, x + PAD_X, ty, anchos.get(i) - PAD_X * 2,
                        columnas.get(i).alineacion());
                ty -= LINE_H;
            }
            x += anchos.get(i);
        }
        // borde inferior
        cs.setStrokingColor(BORDE);
        cs.setLineWidth(0.4f);
        cs.moveTo(MARGEN, topY - alto);
        cs.lineTo(MARGEN + CONTENT_W, topY - alto);
        cs.stroke();
    }

    // ------------------------------------------------------------------
    // Observaciones y firmas
    // ------------------------------------------------------------------
    private void dibujarObservacionesFirmas(PDPageContentStream cs, Reporte r, float y)
            throws IOException {
        escribir(cs, F_BOLD, 9f, TEXTO, "Observaciones:", MARGEN, y, CONTENT_W, Alineacion.IZQUIERDA);
        y -= 12f;
        String obs = nvl(r.observaciones());
        List<String> lineas = envolver(F_NORMAL, 8.5f, obs.isEmpty() ? " " : obs, CONTENT_W - 4);
        for (String linea : lineas) {
            escribir(cs, F_NORMAL, 8.5f, TEXTO_SUAVE, linea, MARGEN, y, CONTENT_W, Alineacion.IZQUIERDA);
            y -= LINE_H;
        }
        y -= 22f;

        float ancho = CONTENT_W / 2f - 20f;
        float x1 = MARGEN + 10f;
        float x2 = MARGEN + CONTENT_W / 2f + 10f;
        cs.setStrokingColor(TEXTO);
        cs.setLineWidth(0.7f);
        cs.moveTo(x1, y);
        cs.lineTo(x1 + ancho, y);
        cs.stroke();
        cs.moveTo(x2, y);
        cs.lineTo(x2 + ancho, y);
        cs.stroke();
        escribir(cs, F_NORMAL, 8f, TEXTO_SUAVE, nvl(r.responsableEntrega()), x1, y - 11f, ancho,
                Alineacion.CENTRO);
        escribir(cs, F_NORMAL, 8f, TEXTO_SUAVE, nvl(r.responsableRecibe()), x2, y - 11f, ancho,
                Alineacion.CENTRO);
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
                cs.setStrokingColor(BORDE);
                cs.setLineWidth(0.4f);
                cs.moveTo(MARGEN, MARGEN);
                cs.lineTo(MARGEN + CONTENT_W, MARGEN);
                cs.stroke();
                escribir(cs, F_NORMAL, 7.5f, TEXTO_SUAVE, "Sistema HRO — Documento generado automáticamente",
                        MARGEN, MARGEN - 11f, CONTENT_W / 2f, Alineacion.IZQUIERDA);
                escribir(cs, F_NORMAL, 7.5f, TEXTO_SUAVE, "Página " + (i + 1) + " de " + total,
                        MARGEN + CONTENT_W / 2f, MARGEN - 11f, CONTENT_W / 2f, Alineacion.DERECHA);
            }
        }
    }

    // ------------------------------------------------------------------
    // Utilidades
    // ------------------------------------------------------------------
    private void dibujarLogo(PDDocument doc, PDPageContentStream cs, float x, float y, float tam) {
        try (InputStream in = getClass().getResourceAsStream("/img/logo-hro.jpg")) {
            if (in == null) {
                return;
            }
            byte[] bytes = in.readAllBytes();
            PDImageXObject img = PDImageXObject.createFromByteArray(doc, bytes, "logo-hro");
            cs.drawImage(img, x, y, tam, tam);
        } catch (IOException e) {
            // Sin logo: el reporte continúa.
        }
    }

    private void escribir(PDPageContentStream cs, PDFont font, float tamano, Color color,
                          String texto, float x, float y, float ancho, Alineacion alineacion)
            throws IOException {
        String valor = nvl(texto);
        float anchoTexto = font.getStringWidth(valor) / 1000f * tamano;
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

    private List<String> envolver(PDFont font, float tamano, String texto, float ancho) {
        List<String> lineas = new ArrayList<>();
        String contenido = nvl(texto);
        if (contenido.isEmpty() || ancho <= 0) {
            lineas.add(contenido);
            return lineas;
        }
        String actual = "";
        for (String palabra : contenido.split("\\s+")) {
            String candidato = actual.isEmpty() ? palabra : actual + " " + palabra;
            if (anchoTexto(font, tamano, candidato) <= ancho) {
                actual = candidato;
            } else {
                if (!actual.isEmpty()) {
                    lineas.add(actual);
                }
                actual = palabra;
            }
        }
        if (!actual.isEmpty()) {
            lineas.add(actual);
        }
        return lineas.isEmpty() ? List.of("") : lineas;
    }

    private float anchoTexto(PDFont font, float tamano, String texto) {
        try {
            return font.getStringWidth(texto) / 1000f * tamano;
        } catch (IOException e) {
            return texto.length() * tamano * 0.5f;
        }
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
}
