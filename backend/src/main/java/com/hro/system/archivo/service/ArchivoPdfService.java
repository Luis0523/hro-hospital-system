package com.hro.system.archivo.service;

import com.hro.system.archivo.entity.ActaRecepcion;
import com.hro.system.archivo.entity.ActaRecepcionDetalle;
import com.hro.system.archivo.dto.ResumenArchivoDTO;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.OffsetDateTime;

/**
 * Generación de documentos PDF del módulo de Archivo con Apache PDFBox.
 * Usa fuentes Standard14 (WinAnsi) que cubren acentos del español.
 */
@Slf4j
@Service
public class ArchivoPdfService {

    private static final float MARGEN = 50f;
    private static final float ANCHO_PAGINA = PDRectangle.A4.getWidth();
    private static final float ALTO_PAGINA = PDRectangle.A4.getHeight();
    private static final float Y_LIMITE = 60f;

    public byte[] generarActaPdf(ActaRecepcion acta) {
        PDFont bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDFont regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

        try (PDDocument doc = new PDDocument()) {
            Cursor cursor = nuevoCursor(doc);

            cursor.escribir(bold, 16, "ACTA DE RECEPCION DE EXPEDIENTES");
            cursor.espacio(6);
            cursor.escribir(regular, 11, "Numero de acta: " + nvl(acta.getNumeroActa()));
            cursor.escribir(regular, 11, "Fecha: " + nvl(acta.getFecha()));
            cursor.escribir(regular, 11, "Unidad: " + textoSubespecialidad(acta));
            cursor.escribir(regular, 11, "Entrega: " + textoUsuario(acta.getUsuarioEntrega()));
            cursor.escribir(regular, 11, "Recibe: " + textoUsuario(acta.getUsuarioRecibe()));
            cursor.espacio(6);

            if (acta.getObservaciones() != null && !acta.getObservaciones().isBlank()) {
                cursor.escribir(regular, 11, "Observaciones: " + acta.getObservaciones());
                cursor.espacio(6);
            }

            cursor.escribir(bold, 12, "Expedientes incluidos (" + acta.getDetalles().size() + ")");
            cursor.espacio(4);
            cursor.escribir(bold, 10, String.format("%-4s %-18s %-34s %-10s", "#", "Expediente", "Paciente", "Cita"));

            int i = 1;
            for (ActaRecepcionDetalle detalle : acta.getDetalles()) {
                var expediente = detalle.getExpediente();
                var paciente = expediente.getPaciente();
                String numero = nvl(expediente.getNumeroExpediente());
                String nombre = (paciente.getNombres() + " " + paciente.getApellidos());
                if (nombre.length() > 32) {
                    nombre = nombre.substring(0, 32);
                }
                String cita = detalle.getCita() != null ? String.valueOf(detalle.getCita().getId()) : "-";
                String linea = String.format("%-4d %-18s %-34s %-10s",
                        i++, recortar(numero, 17), nombre, cita);
                cursor.escribir(regular, 10, linea);
            }

            cursor.espacio(12);
            cursor.escribir(regular, 9, "Generado por: " + textoUsuario(acta.getCreadoPor())
                    + " - " + OffsetDateTime.now());

            cursor.cerrar();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Error generando PDF del acta {}", acta.getNumeroActa(), e);
            throw new IllegalStateException("No se pudo generar el PDF del acta", e);
        }
    }

    public byte[] generarResumenPdf(ResumenArchivoDTO resumen, String usuarioGenerador) {
        PDFont bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDFont regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

        try (PDDocument doc = new PDDocument()) {
            Cursor cursor = nuevoCursor(doc);

            cursor.escribir(bold, 16, "RESUMEN OPERATIVO DIARIO - ARCHIVO");
            cursor.espacio(6);
            cursor.escribir(regular, 11, "Fecha: " + nvl(resumen.getFecha()));
            cursor.escribir(regular, 11, "Generado por: " + (usuarioGenerador != null ? usuarioGenerador : "-")
                    + " - " + OffsetDateTime.now());
            cursor.espacio(8);

            cursor.escribir(bold, 12, "Indicadores del dia");
            cursor.espacio(4);
            escribirIndicador(cursor, regular, "Total de ciclos", resumen.getTotalCiclos());
            escribirIndicador(cursor, regular, "Pendientes de localizar", resumen.getPendienteLocalizar());
            escribirIndicador(cursor, regular, "En busqueda", resumen.getEnBusqueda());
            escribirIndicador(cursor, regular, "Localizados", resumen.getLocalizado());
            escribirIndicador(cursor, regular, "En transito (entrega + retorno)", resumen.getEnTransito());
            escribirIndicador(cursor, regular, "Entregados", resumen.getEntregado());
            escribirIndicador(cursor, regular, "Archivados", resumen.getArchivado());
            escribirIndicador(cursor, regular, "No localizados", resumen.getNoLocalizado());
            escribirIndicador(cursor, regular, "Expedientes nuevos", resumen.getExpedientesNuevos());

            cursor.cerrar();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Error generando PDF del resumen de archivo", e);
            throw new IllegalStateException("No se pudo generar el PDF del resumen", e);
        }
    }

    private void escribirIndicador(Cursor cursor, PDFont font, String etiqueta, long valor) {
        cursor.escribir(font, 11, String.format("%-34s %d", etiqueta, valor));
    }

    private String textoSubespecialidad(ActaRecepcion acta) {
        return acta.getSubespecialidad() != null ? nvl(acta.getSubespecialidad().getNombre()) : "-";
    }

    private String textoUsuario(com.hro.system.usuario.entity.UsuarioReferencia usuario) {
        return usuario != null ? nvl(usuario.getNombreMostrar()) : "-";
    }

    private static String nvl(Object valor) {
        return valor != null ? valor.toString() : "-";
    }

    private static String recortar(String valor, int max) {
        if (valor == null) {
            return "-";
        }
        return valor.length() > max ? valor.substring(0, max) : valor;
    }

    private Cursor nuevoCursor(PDDocument doc) {
        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);
        return new Cursor(doc, page);
    }

    /**
     * Cursor de escritura simple con salto de página automático.
     */
    private final class Cursor {
        private final PDDocument doc;
        private PDPage page;
        private PDPageContentStream stream;
        private float y = ALTO_PAGINA - MARGEN;

        private Cursor(PDDocument doc, PDPage page) {
            this.doc = doc;
            this.page = page;
            try {
                this.stream = new PDPageContentStream(doc, page);
            } catch (IOException e) {
                throw new IllegalStateException("No se pudo crear el contenido del PDF", e);
            }
        }

        void escribir(PDFont font, float tamano, String texto) {
            try {
                if (y <= Y_LIMITE) {
                    nuevaPagina();
                }
                stream.beginText();
                stream.setFont(font, tamano);
                stream.newLineAtOffset(MARGEN, y);
                stream.showText(texto);
                stream.endText();
                y -= tamano + 4;
            } catch (IOException e) {
                throw new IllegalStateException("No se pudo escribir en el PDF", e);
            }
        }

        void espacio(float alto) {
            y -= alto;
        }

        private void nuevaPagina() {
            cerrar();
            page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            try {
                stream = new PDPageContentStream(doc, page);
            } catch (IOException e) {
                throw new IllegalStateException("No se pudo crear la página del PDF", e);
            }
            y = ALTO_PAGINA - MARGEN;
        }

        void cerrar() {
            try {
                if (stream != null) {
                    stream.close();
                    stream = null;
                }
            } catch (IOException e) {
                throw new IllegalStateException("No se pudo cerrar el contenido del PDF", e);
            }
        }
    }
}
