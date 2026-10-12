package com.hro.system.reporte;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Pruebas unitarias de la plantilla institucional reutilizable (sin contexto Spring). */
class PlantillaReportePdfTest {

    private final PlantillaReportePdf plantilla = new PlantillaReportePdf();

    private PlantillaReportePdf.Reporte reporte(boolean incluirFirmas) {
        return new PlantillaReportePdf.Reporte(
                "CONTROL DE PRUEBA",
                "Origen -> Destino",
                "TEST-001",
                LocalDate.of(2026, 1, 1),
                OffsetDateTime.now(),
                "tester",
                "Origen",
                "Destino",
                List.of(
                        new PlantillaReportePdf.Columna("#", 0.6f, PlantillaReportePdf.Alineacion.CENTRO),
                        new PlantillaReportePdf.Columna("Expediente", 2.4f, PlantillaReportePdf.Alineacion.IZQUIERDA)),
                List.of(List.of("1", "123456")),
                1,
                "Entrega - Archivo",
                "Recibe - COEX / Enfermeria",
                "",
                incluirFirmas);
    }

    private static String texto(byte[] pdf) throws IOException {
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            return new PDFTextStripper().getText(doc);
        }
    }

    @Test
    @DisplayName("incluye el bloque de firmas cuando se solicita")
    void incluyeFirmas() throws IOException {
        byte[] pdf = plantilla.generar(reporte(true));
        assertThat(pdf).isNotEmpty();
        assertThat(texto(pdf))
                .contains("Entrega - Archivo")
                .contains("Recibe - COEX / Enfermeria");
    }

    @Test
    @DisplayName("omite el bloque de firmas cuando no se solicita")
    void omiteFirmas() throws IOException {
        byte[] pdf = plantilla.generar(reporte(false));
        assertThat(pdf).isNotEmpty();
        assertThat(texto(pdf))
                .doesNotContain("Entrega - Archivo")
                .doesNotContain("Recibe - COEX / Enfermeria");
    }
}
